// PM2 config. Every folder inside ./bots becomes its own PM2 app.
// You normally don't need to edit this; drop bot folders into ./bots instead.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const BOTS_DIR = path.join(__dirname, 'bots');
const FALLBACK_ENTRIES = ['index.js', 'bot.js', 'main.js', 'app.js', 'src/index.js', 'src/bot.js', 'dist/index.js'];

function findEntry(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    // 1. "start": "node something.js"
    const start = pkg.scripts && pkg.scripts.start;
    const match = start && start.match(/\bnode\s+(?:--?\S+\s+)*([^\s&|;]+\.(?:c|m)?js)\b/);
    if (match && fs.existsSync(path.join(dir, match[1]))) return match[1];
    // 2. "main": "something.js"
    if (pkg.main && fs.existsSync(path.join(dir, pkg.main))) return pkg.main;
  }
  // 3. Common file names
  return FALLBACK_ENTRIES.find((f) => fs.existsSync(path.join(dir, f)));
}

const apps = fs.existsSync(BOTS_DIR)
  ? fs
      .readdirSync(BOTS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
      .map((d) => {
        const cwd = path.join(BOTS_DIR, d.name);
        const script = findEntry(cwd);
        if (!script) {
          console.warn(`[ecosystem] Skipping "${d.name}": no entry file found (add "main" to its package.json).`);
          return null;
        }
        return {
          name: d.name,
          cwd, // each bot runs from its own folder, so its own .env / config.json are picked up
          script,
          autorestart: true,
          exp_backoff_restart_delay: 1000, // crash loops back off instead of hammering Discord
          max_memory_restart: '500M',
          time: true,
          env: { NODE_ENV: 'production' },
        };
      })
      .filter(Boolean)
  : [];

// Bots that ship a Lavalink server (Lavalink/Lavalink.jar) for music get it
// started as its own PM2 app, e.g. "Discord-Bot-lavalink". Needs Java 17+.
const hasJava = () => {
  const res = spawnSync('java', ['-version'], { stdio: 'ignore' });
  return !res.error && res.status === 0;
};
let javaChecked;
for (const app of [...apps]) {
  const lavalinkDir = path.join(app.cwd, 'Lavalink');
  if (!fs.existsSync(path.join(lavalinkDir, 'Lavalink.jar'))) continue;
  if (javaChecked === undefined) javaChecked = hasJava();
  if (!javaChecked) {
    console.warn(`[ecosystem] "${app.name}" includes Lavalink, but Java isn't installed. Install Java 17+ to get its music commands working.`);
    continue;
  }
  apps.unshift({
    name: `${app.name}-lavalink`,
    cwd: lavalinkDir,
    script: 'java',
    args: ['-Xmx512M', '-jar', 'Lavalink.jar'],
    interpreter: 'none',
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    time: true,
  });
}

module.exports = { apps };
