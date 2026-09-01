/**
 * Posts the next N unpublished blog posts from content/blog-queue.json
 * to the live API, using an admin login. Meant to run on a schedule
 * (see Render Cron Job setup in DEPLOYMENT.md) so the site gets fresh
 * blog content automatically without anyone manually using the admin
 * panel.
 *
 * This script is STATELESS between runs: instead of relying on a
 * committed "posted" flag in the queue file (which would require the
 * runner to git-push changes back, not possible from a Render Cron
 * Job), it checks the live blogs API for a post with the same title
 * before creating it, and skips any title that already exists. This
 * makes it safe to run daily without ever double-posting, without
 * needing write access back to the git repo.
 *
 * Required environment variables:
 *   API_BASE_URL   - e.g. https://pixal-fe5o.onrender.com
 *   ADMIN_EMAIL    - login email for an existing admin account
 *   ADMIN_PASSWORD - login password for that account
 *
 * Optional:
 *   POSTS_PER_RUN  - how many new posts to publish per run (default 2)
 *
 * FIXED 2026-09-01: this used to decide "what's next" purely by asking
 * the live API's search endpoint whether each queue title already
 * existed (GET /api/blogs?search=<title>). Blog titles with punctuation
 * (colons, parentheses, "&", "vs.") can fail to match themselves in a
 * text-search index, so the check silently came back "not found" for
 * titles that were, in fact, already published - and the script kept
 * re-publishing queue[0] and queue[1] every single day instead of
 * advancing through the other 12 topics.
 *
 * Fix: fetch the full blog list once (no search param - a real listing,
 * not a text-search query) and compare titles by exact normalized string
 * match against that list. The "which day am I on" question is answered
 * the same deterministic way as postSocial.js: count how many scheduled
 * daily runs have elapsed since a fixed epoch, so the starting index
 * always advances by POSTS_PER_RUN per real day regardless of API state,
 * and the exact-match listing check is only a safety net against
 * double-publishing if a run fires twice.
 */

const fs = require('fs');
const path = require('path');

const QUEUE_PATH = path.join(__dirname, '..', 'content', 'blog-queue.json');
const POSTS_PER_RUN = parseInt(process.env.POSTS_PER_RUN || '2', 10);
const EPOCH = Date.UTC(2026, 0, 1); // fixed reference point, never changes

function normalizeTitle(t) {
  return t.trim().toLowerCase().replace(/\s+/g, ' ');
}

function daysElapsedSinceEpoch(now) {
  return Math.floor((now - EPOCH) / (24 * 60 * 60 * 1000));
}

async function login(baseUrl, email, password) {
  const res = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Login failed: ${data.message || res.status}`);
  }
  const token = data.data?.token || data.token;
  if (!token) throw new Error('Login succeeded but no token was returned.');
  return token;
}

// Fetches the full blog list (a real listing, not a fragile text-search
// query) so exact-title matching cannot be defeated by punctuation in a
// search index. Paginates defensively in case the API caps page size.
async function fetchAllBlogTitles(baseUrl) {
  const titles = new Set();
  let page = 1;
  const limit = 100;
  for (let i = 0; i < 20; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(`${baseUrl}/api/blogs?all=true&limit=${limit}&page=${page}`);
    // eslint-disable-next-line no-await-in-loop
    const data = await res.json();
    if (!res.ok || !data.success) break;
    const blogs = data.data?.blogs || [];
    for (const b of blogs) if (b.name) titles.add(normalizeTitle(b.name));
    if (blogs.length < limit) break;
    page += 1;
  }
  return titles;
}

async function createBlog(baseUrl, token, name, content, imageUrl) {
  const res = await fetch(`${baseUrl}/api/blogs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(imageUrl ? { name, content, imageUrl } : { name, content }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Failed to create blog "${name}": ${data.message || res.status}`);
  }
  return data.data.blog;
}

async function main() {
  const baseUrl = process.env.API_BASE_URL;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!baseUrl || !email || !password) {
    console.error('Missing required env vars: API_BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD');
    process.exit(1);
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
  if (!queue.length) {
    console.log('blog-queue.json is empty, nothing to post.');
    return;
  }

  const existingTitles = await fetchAllBlogTitles(baseUrl);

  // Deterministic "which day am I on" - advances by POSTS_PER_RUN per real
  // calendar day regardless of API state, so the queue actually rotates.
  const dayNumber = daysElapsedSinceEpoch(Date.now());
  const startIndex = ((dayNumber * POSTS_PER_RUN) % queue.length + queue.length) % queue.length;

  let published = 0;
  let token = null;
  let attempts = 0;

  let idx = startIndex;
  while (published < POSTS_PER_RUN && attempts < queue.length) {
    const post = queue[idx];
    attempts += 1;

    if (existingTitles.has(normalizeTitle(post.name))) {
      console.log(`Skipping "${post.name}" - already live on the site.`);
      idx = (idx + 1) % queue.length;
      continue;
    }

    if (!token) {
      token = await login(baseUrl, email, password);
    }

    try {
      const blog = await createBlog(baseUrl, token, post.name, post.content, post.imageUrl);
      console.log(`Published: "${post.name}" (id: ${blog._id})`);
      existingTitles.add(normalizeTitle(post.name));
      published += 1;
    } catch (err) {
      console.error(`Skipped "${post.name}": ${err.message}`);
    }

    idx = (idx + 1) % queue.length;
  }

  if (published === 0) {
    console.log('Nothing new to publish this run (every candidate in today\'s slot was already live).');
  } else {
    console.log(`Done. Published ${published} post(s) this run, starting from queue index ${startIndex}.`);
  }

  const stillPending = queue.filter((post) => !existingTitles.has(normalizeTitle(post.name)));
  console.log(`${stillPending.length} post(s) remaining in the queue.`);
  if (stillPending.length <= 4) {
    console.warn('Queue is running low (4 or fewer posts left) - ask for more blog content to be added soon.');
  }
}

main().catch((err) => {
  console.error('postDailyBlogs failed:', err.message);
  process.exit(1);
});
