// PM2 config. Every folder inside ./bots becomes its own PM2 app.
// You normally don't need to edit this; drop bot folders into ./bots instead.
const fs = require('fs');
const path = require('path');

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

module.exports = { apps };
