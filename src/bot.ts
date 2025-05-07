import { Client, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import { registerCommands, handleInteraction } from './commands';
import { startScheduler } from './scheduler';
import { info, error } from './logger';
import http from 'http';

dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID || '';
const guildId = process.env.DISCORD_GUILD_ID; // Optional: for dev

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (readyClient) => {
  info(`Logged in as ${readyClient.user.tag}`);
  try {
    await registerCommands(token, clientId, guildId);
  } catch (e) {
    error('Failed to register commands', e);
  }
  startScheduler(async (channelId, message) => {
    const channel = await client.channels.fetch(channelId);
    if (
      channel &&
      channel.isTextBased() &&
      'send' in channel &&
      typeof channel.send === 'function'
    ) {
      await channel.send(message);
    }
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // @ts-ignore
    await handleInteraction(interaction);
  } catch (e) {
    error('Interaction error', e);
    if (interaction.isRepliable()) {
      await interaction.reply('An error occurred.');
    }
  }
});

http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!');
}).listen(3001);

client.login(token);
