/**
 * Posts the next N unpublished blog posts from content/blog-queue.json
 * to the live API, using an admin login. Meant to run on a schedule
 * (see .github/workflows/daily-blogs.yml) so the site gets fresh blog
 * content automatically without anyone manually using the admin panel.
 *
 * Required environment variables:
 *   API_BASE_URL   - e.g. https://pixal-fe5o.onrender.com
 *   ADMIN_EMAIL    - login email for an existing admin account
 *   ADMIN_PASSWORD - login password for that account
 *
 * Optional:
 *   POSTS_PER_RUN  - how many posts to publish per run (default 2)
 *
 * After running, it rewrites content/blog-queue.json marking the
 * posts it just published as posted:true with a postedAt timestamp,
 * so re-running never double-posts. The GitHub Actions workflow is
 * responsible for committing that updated file back to the repo.
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
  // Support either { data: { token } } or { token } shapes defensively.
  const token = data.data?.token || data.token;
  if (!token) throw new Error('Login succeeded but no token was returned.');
  return token;
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
  const pending = queue.filter((post) => !post.posted);

  if (pending.length === 0) {
    console.log('No pending blog posts left in the queue. Add more to content/blog-queue.json.');
    return;
  }

  const batch = pending.slice(0, POSTS_PER_RUN);
  console.log(`Publishing ${batch.length} post(s), ${pending.length} were pending.`);

  const token = await login(baseUrl, email, password);

  for (const post of batch) {
    try {
      const blog = await createBlog(baseUrl, token, post.name, post.content);
      post.posted = true;
      post.postedAt = new Date().toISOString();
      post.blogId = blog._id;
      console.log(`Published: "${post.name}" (id: ${blog._id})`);
    } catch (err) {
      console.error(`Skipped "${post.name}": ${err.message}`);
    }
  }

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');

  const remaining = queue.filter((p) => !p.posted).length;
  console.log(`Done. ${remaining} post(s) remaining in the queue.`);
  if (remaining <= 4) {
    console.warn('Queue is running low (4 or fewer posts left) - ask for more blog content to be added soon.');
  }
}

main().catch((err) => {
  console.error('postDailyBlogs failed:', err.message);
  process.exit(1);
});
