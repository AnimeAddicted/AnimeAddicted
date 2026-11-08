// Placeholder bot - replace this whole folder with your real bot.
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

if (!process.env.DISCORD_TOKEN) {
  console.error('[bot-one] DISCORD_TOKEN is missing. Copy .env.example to .env and add your token.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('ready', () => console.log(`[bot-one] Logged in as ${client.user.tag}`));
client.login(process.env.DISCORD_TOKEN);
