/**
 * Copies the built frontend bundle into the backend's static folder.
 *
 * The Railway build only runs `npm install && prisma generate` — it does not
 * build the frontend, so `packages/backend/public` holds a committed bundle
 * that would otherwise go stale and keep serving an old checkout page.
 *
 * Usage (from the repo root):
 *   npm run build:public
 *
 * It replaces index.html and the hashed asset files, and leaves everything
 * else in public/ alone (main-site.html, blog/, backups).
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'packages/frontend/dist');
const publicDir = path.join(repoRoot, 'packages/backend/public');
const publicAssetsDir = path.join(publicDir, 'assets');
const distAssetsDir = path.join(distDir, 'assets');

function fail(message) {
  console.error(`[sync-public] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  fail(`Frontend build not found at ${distDir}. Run "npm run build -w packages/frontend" first.`);
}

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  fail('Frontend build has no index.html.');
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Replace the served index.html with the fresh build.
fs.copyFileSync(path.join(distDir, 'index.html'), path.join(publicDir, 'index.html'));
console.log('[sync-public] index.html replaced');

// Drop the previous hashed bundle so stale chunks cannot be served.
if (fs.existsSync(publicAssetsDir)) {
  for (const entry of fs.readdirSync(publicAssetsDir)) {
    fs.rmSync(path.join(publicAssetsDir, entry), { force: true, recursive: true });
  }
}

if (fs.existsSync(distAssetsDir)) {
  fs.mkdirSync(publicAssetsDir, { recursive: true });

  for (const entry of fs.readdirSync(distAssetsDir)) {
    fs.cpSync(path.join(distAssetsDir, entry), path.join(publicAssetsDir, entry), {
      recursive: true,
    });
  }

  console.log(`[sync-public] copied ${fs.readdirSync(publicAssetsDir).length} asset file(s)`);
}

// Copy root-level static files from the Vite output (favicon.svg, robots.txt, ...).
// These are NOT hashed and live in dist/ rather than dist/assets/.
for (const entry of fs.readdirSync(distDir)) {
  if (entry === 'index.html' || entry === 'assets') continue;

  const source = path.join(distDir, entry);
  if (!fs.statSync(source).isFile()) continue;

  fs.copyFileSync(source, path.join(publicDir, entry));
  console.log(`[sync-public] copied ${entry}`);
}

console.log('[sync-public] done');
