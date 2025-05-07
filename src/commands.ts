import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getLatestImageTweet, getRateLimitStatus } from './twitter';
import { addSubscription, removeSubscription, listSubscriptions, getLastSeenTweetId, setLastSeenTweetId } from './subscriptions';
import { info, warn } from './logger';
import { isUserIdLookupInCooldown, getUserIdCooldownSeconds } from './twitter';

const commands = [
  new SlashCommandBuilder()
    .setName('latest')
    .setDescription('Fetch the latest image post from a Twitter/X account')
    .addStringOption(opt => opt.setName('username').setDescription('Twitter username').setRequired(true)),
  new SlashCommandBuilder()
    .setName('subscribe')
    .setDescription('Subscribe this channel to new image posts from a Twitter/X account')
    .addStringOption(opt => opt.setName('username').setDescription('Twitter username').setRequired(true)),
  new SlashCommandBuilder()
    .setName('list')
    .setDescription('List all Twitter/X subscriptions for this channel'),
  new SlashCommandBuilder()
    .setName('unsubscribe')
    .setDescription('Unsubscribe this channel from a Twitter/X account')
    .addStringOption(opt => opt.setName('username').setDescription('Twitter username').setRequired(true)),
  new SlashCommandBuilder()
    .setName('ratelimit')
    .setDescription('Check current Twitter API rate limit status'),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the bot and get latency'),
].map(cmd => cmd.toJSON());

export async function registerCommands(token: string, clientId: string, guildId?: string) {
  const rest = new REST({ version: '10' }).setToken(token);
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
  }
  info('Slash commands registered');
}

export async function handleInteraction(interaction: ChatInputCommandInteraction) {
  if (!interaction.isChatInputCommand()) return;
  const channelId = interaction.channelId;
  const username = interaction.options.getString('username');
  switch (interaction.commandName) {
    case 'latest': {
      await interaction.deferReply();
      const tweet = await getLatestImageTweet(username!);
      if (tweet && typeof tweet === 'object' && 'rateLimited' in tweet) {
        await interaction.editReply(`Twitter API rate limit reached. Please try again in ${tweet.cooldown} seconds.`);
        return;
      }
      if (tweet && 'url' in tweet) {
        await interaction.editReply(`Latest image post from @${username}: ${tweet.url}`);
      } else {
        await interaction.editReply(`No recent image post found for @${username}.`);
      }
      break;
    }
    case 'subscribe': {
      await interaction.deferReply();
      const tweet = await getLatestImageTweet(username!);
      if (tweet && typeof tweet === 'object' && 'rateLimited' in tweet) {
        await interaction.editReply(`Twitter API rate limit reached. Please try again in ${tweet.cooldown} seconds.`);
        return;
      }
      if (tweet && 'url' in tweet) {
        addSubscription(channelId, username!, tweet.id);
        await interaction.editReply(`Subscribed to @${username}. Latest image: ${tweet.url}`);
      } else {
        addSubscription(channelId, username!);
        await interaction.editReply(`Subscribed to @${username}, but no recent image post found.`);
      }
      break;
    }
    case 'list': {
      const subs = listSubscriptions(channelId);
      if (subs.length) {
        await interaction.reply('Subscriptions:\n' + subs.map(s => `@${s.twitterUsername}`).join('\n'));
      } else {
        await interaction.reply('No subscriptions for this channel.');
      }
      break;
    }
    case 'unsubscribe': {
      removeSubscription(channelId, username!);
      await interaction.reply(`Unsubscribed from @${username}.`);
      break;
    }
    case 'ratelimit': {
      await interaction.deferReply();
      const status = await getRateLimitStatus();
      if (status.ok) {
        await interaction.editReply('Twitter API rate limit: OK');
      } else if (status.rateLimit) {
        await interaction.editReply(`Rate limit hit. Reset at: ${status.rateLimit.reset}`);
      } else {
        await interaction.editReply('Could not determine rate limit status.');
      }
      break;
    }
    case 'ping': {
      const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      await interaction.editReply(`Pong! Latency: ${latency}ms`);
      break;
    }
    default:
      await interaction.reply('Unknown command.');
  }
}
