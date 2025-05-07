# Discord Twitter Image Bot

A Discord bot that monitors Twitter accounts for new image posts and notifies subscribed Discord channels. The bot uses scheduled tasks to periodically check for new tweets containing images and sends rich embed notifications to Discord.

## Features

- Subscribe Discord channels to Twitter accounts.
- Periodically checks for new image tweets (every 20 minutes).
- Sends Discord embed messages with tweet details and images.
- Handles Twitter rate limits gracefully.
- Simple logging for info and warnings.

## Project Structure

```
src/
  bot.ts            # Main bot entry point and Discord client logic
  commands.ts       # Command handling for subscriptions and bot interaction
  logger.ts         # Logging utilities
  scheduler.ts      # Cron-based scheduler for periodic tweet checks
  subscriptions.ts  # Subscription management (add/remove/list)
  twitter.ts        # Twitter API integration and image tweet fetching
  types/
    node-cron.d.ts  # Type definitions for node-cron
package.json        # Project dependencies and scripts
tsconfig.json       # TypeScript configuration
```

## How It Works

1. Users subscribe a Discord channel to a Twitter username.
2. The scheduler runs every 20 minutes, checking for new image tweets from all subscribed accounts.
3. If a new image tweet is found, the bot sends an embed message to the subscribed channel.
4. The bot tracks the last seen tweet per channel/account to avoid duplicate notifications.

## Setup

1. Clone the repository.
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your Discord bot token and Twitter API credentials (see code for details).
4. Build and run the bot:
   ```
   npm run build
   npm start
   ```

## Dependencies

- [discord.js](https://discord.js.org/)
- [node-cron](https://www.npmjs.com/package/node-cron)
- [twitter-api-v2](https://www.npmjs.com/package/twitter-api-v2) (or similar, see `twitter.ts`)

## License

MIT
