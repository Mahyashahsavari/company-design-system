import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const siteDir = join(root, 'site');

/** GitHub Pages project site base path (repo name). Update if the repo is renamed. */
const REPO_NAME = 'company-design-system';
const BASE = `/${REPO_NAME}`;
const GH_PAGES_REDIRECT_KEY = 'gh-pages-redirect';

function run(command, env = {}) {
  execSync(command, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

function landingHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Monosuite Design System — Live Demos</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: Nunito, system-ui, sans-serif;
        line-height: 1.5;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f4f6f8;
        color: #1a1d21;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background: #14171a;
          color: #e8eaed;
        }
        .card {
          background: #1a1d21;
          border-color: #2d3339;
        }
        .card p {
          color: #9aa0a6;
        }
      }
      main {
        width: min(640px, calc(100% - 2rem));
        padding: 2rem 0;
      }
      h1 {
        margin: 0 0 0.5rem;
        font-size: 1.75rem;
        font-weight: 700;
      }
      .lead {
        margin: 0 0 2rem;
        color: #5f6368;
      }
      @media (prefers-color-scheme: dark) {
        .lead {
          color: #9aa0a6;
        }
      }
      .cards {
        display: grid;
        gap: 1rem;
      }
      .card {
        display: block;
        padding: 1.25rem 1.5rem;
        border: 1px solid #dadce0;
        border-radius: 8px;
        background: #fff;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.15s ease;
      }
      .card:hover {
        border-color: #069494;
      }
      .card h2 {
        margin: 0 0 0.35rem;
        font-size: 1.125rem;
        color: #069494;
      }
      .card p {
        margin: 0;
        font-size: 0.9375rem;
        color: #5f6368;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Monosuite Design System</h1>
      <p class="lead">Reference applications deployed from the design system monorepo.</p>
      <div class="cards">
        <a class="card" href="${BASE}/assets/">
          <h2>Assets Management</h2>
          <p>Asset inventory table, filters, pagination, and empty/loading states.</p>
        </a>
        <a class="card" href="${BASE}/war-room/">
          <h2>War Room</h2>
          <p>Incident response dashboard — KPIs, health, incidents, and activity feed.</p>
        </a>
      </div>
    </main>
  </body>
</html>
`;
}

function fallback404Html() {
  const warRoomBase = `${BASE}/war-room`;
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting…</title>
  </head>
  <body>
    <script>
      (function () {
        var repo = '${BASE}';
        var warRoom = '${warRoomBase}';
        var path = location.pathname;
        var warRoomPrefix = warRoom + '/';
        if (path.indexOf(warRoomPrefix) === 0) {
          var rest = path.slice(warRoom.length) + location.search + location.hash;
          sessionStorage.setItem('${GH_PAGES_REDIRECT_KEY}', rest);
          location.replace(warRoom + '/');
          return;
        }
        location.replace(repo + '/');
      })();
    </script>
  </body>
</html>
`;
}

rmSync(siteDir, { recursive: true, force: true });
mkdirSync(siteDir, { recursive: true });

run('npm run build --workspace=@monosuite/theme');
run('npm run build --workspace=@monosuite/ui');
run('npm run build --workspace=@monosuite/utils');

run('npm run build --workspace=monosuite-assets-management', {
  VITE_BASE_PATH: `${BASE}/assets/`,
});

run('npm run build --workspace=monosuite-war-room', {
  VITE_BASE_PATH: `${BASE}/war-room/`,
});

cpSync(join(root, 'apps/monosuite-assets-management/dist'), join(siteDir, 'assets'), {
  recursive: true,
});
cpSync(join(root, 'apps/monosuite-war-room/dist'), join(siteDir, 'war-room'), {
  recursive: true,
});

writeFileSync(join(siteDir, '.nojekyll'), '');
writeFileSync(join(siteDir, 'index.html'), landingHtml());
writeFileSync(join(siteDir, '404.html'), fallback404Html());

console.log(`\nGitHub Pages site ready at ${siteDir}`);
