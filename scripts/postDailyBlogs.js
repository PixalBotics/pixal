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
 */

const fs = require('fs');
const path = require('path');

const QUEUE_PATH = path.join(__dirname, '..', 'content', 'blog-queue.json');
const POSTS_PER_RUN = parseInt(process.env.POSTS_PER_RUN || '2', 10);

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

async function blogExists(baseUrl, name) {
  const url = `${baseUrl}/api/blogs?search=${encodeURIComponent(name)}&limit=5&all=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data.success) return false;
  const blogs = data.data?.blogs || [];
  return blogs.some((b) => b.name.trim().toLowerCase() === name.trim().toLowerCase());
}

async function createBlog(baseUrl, token, name, content) {
  const res = await fetch(`${baseUrl}/api/blogs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, content }),
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

  let published = 0;
  let token = null;

  for (const post of queue) {
    if (published >= POSTS_PER_RUN) break;

    const alreadyExists = await blogExists(baseUrl, post.name);
    if (alreadyExists) continue;

    if (!token) {
      token = await login(baseUrl, email, password);
    }

    try {
      const blog = await createBlog(baseUrl, token, post.name, post.content);
      console.log(`Published: "${post.name}" (id: ${blog._id})`);
      published += 1;
    } catch (err) {
      console.error(`Skipped "${post.name}": ${err.message}`);
    }
  }

  if (published === 0) {
    console.log('Nothing new to publish this run (queue exhausted or all titles already exist).');
  } else {
    console.log(`Done. Published ${published} post(s) this run.`);
  }

  // Rough estimate of how many queue entries have not been detected as posted yet.
  const stillPending = [];
  for (const post of queue) {
    if (!(await blogExists(baseUrl, post.name))) stillPending.push(post.name);
  }
  console.log(`${stillPending.length} post(s) remaining in the queue.`);
  if (stillPending.length <= 4) {
    console.warn('Queue is running low (4 or fewer posts left) - ask for more blog content to be added soon.');
  }
}

main().catch((err) => {
  console.error('postDailyBlogs failed:', err.message);
  process.exit(1);
});
