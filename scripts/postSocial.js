/**
 * Posts branded content to the Facebook Page and Instagram Business
 * account from content/social-queue.json, using the Meta Graph API.
 * Meant to run on a schedule (Render Cron Job) 2-3 times a day, same
 * pattern as scripts/postDailyBlogs.js.
 *
 * Images are pre-generated branded graphics committed into this repo
 * at uploads/social/<id>.png and served statically at
 * ${API_BASE_URL}/uploads/social/<id>.png - the Graph API needs a
 * public image URL for both Facebook photo posts and Instagram media
 * containers, so no image generation happens at runtime.
 *
 * STATELESS between runs, same idea as the blog script: instead of
 * tracking "already posted" in a file (which would need git push
 * access we don't have from a Render Cron Job), each run:
 *   1. Picks a deterministic "next" post based on the current time
 *      slot, cycling through the queue (content naturally repeats
 *      after a full cycle - normal for a social content calendar).
 *   2. Before posting, checks the Page's / IG account's recent posts
 *      and skips forward if that exact caption was already posted
 *      recently, so overlapping cron runs never double-post.
 *
 * Required environment variables:
 *   API_BASE_URL          - e.g. https://pixal-fe5o.onrender.com
 *   FB_PAGE_ID            - Facebook Page ID
 *   FB_PAGE_ACCESS_TOKEN  - long-lived Page Access Token
 *   IG_USER_ID            - Instagram Business Account ID (linked to the Page)
 *
 * Optional:
 *   POSTS_PER_RUN         - how many posts to publish this run (default 1)
 *   POST_HOURS_UTC        - comma-separated UTC hours this cron actually
 *                           fires at, matching render.yaml's cron schedule
 *                           (default "6,11,16" -> 3 runs/day)
 *
 * INDEX SELECTION (fixed 2026-09-01): the old approach picked the queue
 * index from a raw 8-hour wall-clock bucket (Date.now() / 8h). Because the
 * actual cron fires unevenly (6am, 11am, 4pm UTC - gaps of 5h, 5h, 14h,
 * not a clean 8h), two runs in the same calendar day often landed in the
 * SAME bucket, so the "skip if already posted" logic kept bumping forward
 * by only 1 and the same handful of queue items kept resurfacing instead
 * of the full queue rotating - this is why the same 3-4 posts looked like
 * they were the only ones ever going out.
 *
 * Fix: derive the index from how many scheduled runs have actually
 * elapsed since a fixed epoch (one integer step per real cron fire,
 * matching POST_HOURS_UTC exactly), so every run advances to a genuinely
 * new queue item and the full queue rotates before anything repeats.
 */

const fs = require('fs');
const path = require('path');

const QUEUE_PATH = path.join(__dirname, '..', 'content', 'social-queue.json');
const POSTS_PER_RUN = parseInt(process.env.POSTS_PER_RUN || '1', 10);
const POST_HOURS_UTC = (process.env.POST_HOURS_UTC || '6,11,16')
  .split(',')
  .map((h) => parseInt(h.trim(), 10))
  .sort((a, b) => a - b);
const EPOCH = Date.UTC(2026, 0, 1); // fixed reference point, never changes
const GRAPH = 'https://graph.facebook.com/v19.0';

function loadQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
}

function fullCaption(post) {
  return `${post.caption}\n\n${post.hashtags}`;
}

// Counts exactly how many scheduled slots (per POST_HOURS_UTC) have
// elapsed since EPOCH, so each real cron fire is its own unique step -
// no two runs on the same day can ever collide on the same index.
function scheduledSlotsElapsed(now) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysElapsed = Math.floor((now - EPOCH) / msPerDay);
  const dayStart = EPOCH + daysElapsed * msPerDay;
  const hoursIntoDay = (now - dayStart) / (60 * 60 * 1000);
  let slotsToday = 0;
  for (const h of POST_HOURS_UTC) {
    if (hoursIntoDay >= h) slotsToday += 1;
  }
  return daysElapsed * POST_HOURS_UTC.length + slotsToday;
}

function currentSlotIndex(queueLength) {
  const slots = scheduledSlotsElapsed(Date.now());
  return ((slots % queueLength) + queueLength) % queueLength;
}

async function graphGet(pathAndQuery) {
  const res = await fetch(`${GRAPH}/${pathAndQuery}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`Graph GET failed: ${data.error?.message || res.status}`);
  return data;
}

async function graphPost(nodePath, params) {
  const url = `${GRAPH}/${nodePath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Graph POST ${nodePath} failed: ${data.error?.message || res.status}`);
  return data;
}

async function recentlyPostedCaptions({ pageId, igUserId, pageToken }) {
  const captions = [];
  try {
    const fb = await graphGet(`${pageId}/posts?fields=message&limit=30&access_token=${pageToken}`);
    for (const p of fb.data || []) if (p.message) captions.push(p.message);
  } catch (e) {
    console.warn('Could not read recent FB posts (continuing):', e.message);
  }
  try {
    const ig = await graphGet(`${igUserId}/media?fields=caption&limit=30&access_token=${pageToken}`);
    for (const p of ig.data || []) if (p.caption) captions.push(p.caption);
  } catch (e) {
    console.warn('Could not read recent IG media (continuing):', e.message);
  }
  return captions;
}

// Full-caption match (not just a short prefix) - a short prefix match can
// false-positive on two different posts that happen to open the same way,
// which would cause good, unposted content to be skipped as "duplicate".
function alreadyPosted(candidateCaption, recentCaptions) {
  const candidate = candidateCaption.trim().toLowerCase();
  return recentCaptions.some((c) => c.trim().toLowerCase() === candidate);
}

async function postToFacebookPage({ pageId, pageToken, imageUrl, caption }) {
  const data = await graphPost(`${pageId}/photos`, {
    url: imageUrl,
    caption,
    access_token: pageToken,
  });
  return data.post_id || data.id;
}

async function postToInstagram({ igUserId, pageToken, imageUrl, caption }) {
  const container = await graphPost(`${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: pageToken,
  });
  const published = await graphPost(`${igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: pageToken,
  });
  return published.id;
}

async function main() {
  const baseUrl = process.env.API_BASE_URL;
  const pageId = process.env.FB_PAGE_ID;
  const pageToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;

  if (!baseUrl || !pageId || !pageToken || !igUserId) {
    console.error('Missing required env vars: API_BASE_URL, FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN, IG_USER_ID');
    process.exit(1);
  }

  const queue = loadQueue();
  if (!queue.length) {
    console.log('social-queue.json is empty, nothing to post.');
    return;
  }

  const recentCaptions = await recentlyPostedCaptions({ pageId, igUserId, pageToken });

  let posted = 0;
  let idx = currentSlotIndex(queue.length);
  let attempts = 0;

  while (posted < POSTS_PER_RUN && attempts < queue.length) {
    const post = queue[idx];
    const caption = fullCaption(post);
    attempts += 1;

    if (alreadyPosted(caption, recentCaptions)) {
      console.log(`Skipping "${post.id}" - looks already posted recently.`);
      idx = (idx + 1) % queue.length;
      continue;
    }

    const imageUrl = `${baseUrl}/uploads/social/${post.imageFile}`;

    try {
      const fbId = await postToFacebookPage({ pageId, pageToken, imageUrl, caption });
      console.log(`Posted to Facebook Page: "${post.id}" (post id: ${fbId})`);
    } catch (err) {
      console.error(`Facebook post failed for "${post.id}": ${err.message}`);
    }

    try {
      const igId = await postToInstagram({ igUserId, pageToken, imageUrl, caption });
      console.log(`Posted to Instagram: "${post.id}" (media id: ${igId})`);
    } catch (err) {
      console.error(`Instagram post failed for "${post.id}": ${err.message}`);
    }

    posted += 1;
    recentCaptions.push(caption);
    idx = (idx + 1) % queue.length;
  }

  if (posted === 0) {
    console.log('Nothing posted this run (all candidates looked already-posted).');
  } else {
    console.log(`Done. Posted ${posted} item(s) this run.`);
  }
}

main().catch((err) => {
  console.error('postSocial failed:', err.message);
  process.exit(1);
});
