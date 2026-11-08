# Discord Bots (PM2)

Runs several Discord bots side by side with [PM2](https://pm2.keymetrics.io/), started with **one command**:

```bash
node index.js
```

(`npm start` does the same thing.) That one command:

1. Installs PM2 if it isn't installed yet.
2. Runs `npm install` in each bot folder that doesn't have `node_modules` yet.
3. Starts every bot in `bots/` as its own PM2 process. If a bot crashes, PM2 restarts it, waiting longer after each crash in a row.

It stays in the foreground (it uses `pm2-runtime`), so it works on hosting panels like Pterodactyl, Railway, Render or a VPS, or in Docker, anywhere you can only set "run `node index.js`".

## Layout

```
discord-bots/
├── index.js              <- the one file you run
├── ecosystem.config.js   <- PM2 config (finds the bots in ./bots for you)
├── package.json
└── bots/
    ├── bot-one/          <- replace with your first bot's full folder
    └── bot-two/          <- replace with your second bot's full folder
```

## Adding your bots

1. Delete the placeholder `bots/bot-one` and `bots/bot-two` folders.
2. Copy each bot's **whole folder** into `bots/`. The folder name becomes its PM2 name.
3. Keep each bot's own `.env` / `config.json` inside its folder. Each bot runs from its own folder, so `require('dotenv').config()` and `./config.json` keep working unchanged.
4. Run `node index.js`.

To find each bot's main file, the launcher checks these in order:
- the `start` script in the bot's `package.json` (for example `"start": "node src/bot.js"`)
- the `main` field in its `package.json`
- `index.js`, `bot.js`, `main.js`, `app.js`, `src/index.js`, `src/bot.js`, `dist/index.js`

You can run more than two bots: add more folders. To turn a bot off for a while, put `_` at the start of its folder name (for example `_bot-two`).

## Useful commands

Because the launcher runs PM2 in no-daemon mode, the logs from all bots go straight to the console, each line tagged with the bot's name. If you would rather run PM2 as a background daemon on a VPS:

```bash
npx pm2 start ecosystem.config.js
npx pm2 status
npx pm2 logs bot-one
npx pm2 restart bot-two
npx pm2 save && npx pm2 startup   # restart the bots automatically after a reboot
```

## Notes

- Requires Node.js 18 or newer (discord.js v14 needs 16.11 or newer).
- Never commit `.env` files or tokens. `.gitignore` already excludes `.env`.
- TypeScript bots: build them first (`npm run build`) so a `dist/index.js` exists, or set `main` to the built file.
