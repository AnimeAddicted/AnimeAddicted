// Settings come from bots/Discord-Bot/.env (copy .env.example to .env and fill it in).
// This file holds no secrets, so it's safe to commit.
const path = require('path');
const { Colors } = require('discord.js');

try {
	process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
	// No .env file: use whatever environment variables are already set (PM2, hosting panel, Docker).
}

const env = (key, fallback = '') => (process.env[key] ?? '').trim() || fallback;
const list = (key) => env(key).split(',').map((s) => s.trim()).filter(Boolean);

const config = {
	ownerID: list('OWNER_IDS'),
	token: env('DISCORD_TOKEN'),
	api_keys: {
		genius: env('GENIUS_API_KEY'),
		amethyste: env('AMETHYSTE_API_KEY'),
		masterToken: env('EGGLORD_MASTER_TOKEN'),
	},
	disabledCommands: list('DISABLED_COMMANDS'),
	disabledPlugins: list('DISABLED_PLUGINS'),
	websiteURL: env('WEBSITE_URL'),
	SupportServer: {
		link: env('SUPPORT_SERVER_LINK'),
		GuildID: env('SUPPORT_GUILD_ID'),
		ModRole: env('SUPPORT_MOD_ROLE_ID'),
		SuggestionChannel: env('SUGGESTION_CHANNEL_ID'),
		GuildChannel: env('GUILD_LOG_CHANNEL_ID'),
		rateLimitChannelID: env('RATE_LIMIT_CHANNEL_ID'),
	},
	API: {
		port: Number(env('API_PORT', '3000')),
		secure: env('API_SECURE', 'true') === 'true',
		token: env('API_TOKEN'),
	},
	Staff: {
		ContributorRole: env('CONTRIBUTOR_ROLE_ID'),
		SupportRole: env('SUPPORT_ROLE_ID'),
		DeveloperRole: env('DEVELOPER_ROLE_ID'),
	},
	LavalinkNodes: [
		{
			host: env('LAVALINK_HOST', 'localhost'),
			port: Number(env('LAVALINK_PORT', '5000')),
			password: env('LAVALINK_PASSWORD', 'youshallnotpass'),
		},
	],
	MongoDBURl: env('MONGODB_URL'),
	embedColor: Colors.Default,
	debug: env('DEBUG', 'false') === 'true',
};

module.exports = config;
