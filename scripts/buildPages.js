const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'src', 'app', 'api');
const tempDir = path.join(rootDir, 'src', 'server_api');
const outDir = path.join(rootDir, 'out');

console.log('[build-pages] Moving API routes outside src/app...');
let moved = false;
if (fs.existsSync(apiDir)) {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  fs.renameSync(apiDir, path.join(tempDir, 'api'));
  moved = true;
}

try {
  console.log('[build-pages] Executing next build with GITHUB_PAGES=true...');
  execSync('npx next build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      GITHUB_PAGES: 'true',
    },
  });

  // Ensure .nojekyll exists
  const nojekyllPath = path.join(outDir, '.nojekyll');
  fs.writeFileSync(nojekyllPath, '');
  console.log('[build-pages] Created .nojekyll in out/');
} finally {
  if (moved) {
    console.log('[build-pages] Restoring API routes to src/app/api...');
    fs.renameSync(path.join(tempDir, 'api'), apiDir);
    if (fs.readdirSync(tempDir).length === 0) {
      fs.rmdirSync(tempDir);
    }
  }
}
console.log('[build-pages] Static export completed successfully.');
