import cron from 'node-cron';
import { getAllSubscriptions, getLastSeenTweetId, setLastSeenTweetId } from './subscriptions';
import { getLatestImageTweet } from './twitter';
import { info, warn } from './logger';

export function startScheduler(notify: (channelId: string, message: string | { content: string; embeds: any[] }) => Promise<void>) {
  // Run every 20 minutes (at minute 0, 20, 40)
  cron.schedule('0,20,40 * * * *', async () => {
    info('Scheduler tick: checking subscriptions');
    const subs = getAllSubscriptions();
    for (const sub of subs) {
      try {
        const latest = await getLatestImageTweet(sub.twitterUsername);
        if (latest && typeof latest === 'object' && 'rateLimited' in latest) {
          warn(`Rate limited for @${sub.twitterUsername}, skipping. Cooldown: ${latest.cooldown}s`);
          continue;
        }
        if (latest && latest.id && latest.id !== getLastSeenTweetId(sub.channelId, sub.twitterUsername)) {
          setLastSeenTweetId(sub.channelId, sub.twitterUsername, latest.id);
          await notify(sub.channelId, {
            content: `New image post from @${sub.twitterUsername}:`,
            embeds: [
              {
                title: `@${sub.twitterUsername} posted a new image!`,
                url: latest.url,
                description: latest.text || '',
                image: { url: latest.imageUrl },
                color: 0x1da1f2
              }
            ]
          });
        }
      } catch (e) {
        warn(`Scheduler error for @${sub.twitterUsername} in channel ${sub.channelId}`, e);
      }
    }
  });
}
