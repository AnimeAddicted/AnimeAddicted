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
    ├── MusicBot/         <- github.com/umutxyp/MusicBot (MIT)
    └── Discord-Bot/      <- github.com/Spiderjockey02/Discord-Bot (Apache-2.0)
                             (+ its Lavalink music server, started as "Discord-Bot-lavalink")
```

## Setup for the two bots that are included

You need **Node.js 22.12 or newer** (MusicBot requires it) and **Java 17 or newer** (for Discord-Bot's Lavalink music server).
Each bot needs **its own** bot application and token from the [Discord Developer Portal](https://discord.com/developers/applications).
For each one, open the Bot page and turn on all three "Privileged Gateway Intents".

### MusicBot
1. `cp bots/MusicBot/.env.example bots/MusicBot/.env`
2. Set `DISCORD_TOKEN=`. Everything else is optional (Spotify keys, YouTube cookies and so on, see the comments in the file).
3. yt-dlp and ffmpeg are downloaded automatically the first time it starts.

### Discord-Bot (Egglord)
1. `cp bots/Discord-Bot/.env.example bots/Discord-Bot/.env`
2. Fill in the 3 required settings:
   - `DISCORD_TOKEN`: the bot's token
   - `OWNER_IDS`: your Discord user ID
   - `MONGODB_URL`: a MongoDB database. A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works.
3. The bot won't start without a valid token and a MongoDB database it can connect to (it checks both when it starts).
4. The launcher starts the bundled Lavalink server on port 5000 for you. Its password is in `bots/Discord-Bot/Lavalink/application.yml` and must match `LAVALINK_PASSWORD`.
5. Its built-in web API listens on port 3000 (`API_PORT`).

Then run `node index.js`.

## Adding or swapping bots

1. Copy each bot's **whole folder** into `bots/`. The folder name becomes its PM2 name.
2. Keep each bot's own `.env` / `config.json` inside its folder. Each bot runs from its own folder, so `require('dotenv').config()` and `./config.json` keep working unchanged.
3. Run `node index.js`.

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

- Bot folders with a `Lavalink/Lavalink.jar` get that Lavalink server started next to them as a separate PM2 app, if Java is installed.
- Never commit `.env` files or tokens. `.gitignore` already excludes `.env`.
- TypeScript bots: build them first (`npm run build`) so a `dist/index.js` exists, or set `main` to the built file.
