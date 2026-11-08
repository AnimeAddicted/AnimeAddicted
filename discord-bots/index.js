#!/usr/bin/env node
// Single entry point: `node index.js` (or `npm start`).
// 1. Installs each bot's own dependencies if they're missing.
// 2. Starts every bot in ./bots under PM2 (pm2-runtime, stays in the foreground
//    so hosting panels / Docker / Pterodactyl that just run "node index.js" work).
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) throw new Error(`"${cmd} ${args.join(' ')}" failed in ${cwd}`);
}

// Make sure PM2 itself is installed.
if (!fs.existsSync(path.join(ROOT, 'node_modules', 'pm2'))) {
  console.log('[launcher] Installing PM2...');
  run(npm, ['install', '--omit=dev'], ROOT);
}

const { apps } = require('./ecosystem.config.js');
if (apps.length === 0) {
  console.error('[launcher] No bots found. Put each bot folder inside ./bots and try again.');
  process.exit(1);
}

// Install each bot's dependencies (only when node_modules is missing).
for (const app of apps) {
  const hasPkg = fs.existsSync(path.join(app.cwd, 'package.json'));
  const hasModules = fs.existsSync(path.join(app.cwd, 'node_modules'));
  if (hasPkg && !hasModules) {
    console.log(`[launcher] Installing dependencies for "${app.name}"...`);
    run(npm, ['install', '--omit=dev'], app.cwd);
  }
}

console.log(`[launcher] Starting ${apps.length} bot(s) with PM2: ${apps.map((a) => a.name).join(', ')}`);

const pm2Runtime = require.resolve('pm2/bin/pm2-runtime');
const child = spawn(process.execPath, [pm2Runtime, 'start', path.join(ROOT, 'ecosystem.config.js')], {
  cwd: ROOT,
  stdio: 'inherit',
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => child.kill(sig));
}
child.on('exit', (code) => process.exit(code ?? 0));
