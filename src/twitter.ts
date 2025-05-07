import { TwitterApi, ApiResponseError } from 'twitter-api-v2';
import dotenv from 'dotenv';
import { info, warn, error } from './logger';

dotenv.config();

const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);
const userIdCache = new Map<string, string>();
let globalUserIdCooldownUntil = 0;

export async function getUserId(username: string): Promise<string | null | { rateLimited: true, cooldown: number }> {
  if (userIdCache.has(username)) return userIdCache.get(username)!;
  const now = Date.now();
  if (globalUserIdCooldownUntil > now) {
    const waitSec = Math.ceil((globalUserIdCooldownUntil - now) / 1000);
    warn(`Twitter user ID lookup is in cooldown. Try again in ${waitSec} seconds.`);
    return { rateLimited: true, cooldown: waitSec };
  }
  try {
    const user = await twitterClient.v2.userByUsername(username);
    if (user.data?.id) {
      userIdCache.set(username, user.data.id);
      return user.data.id;
    }
    return null;
  } catch (e: any) {
    if (e.code === 429 && e.rateLimit) {
      const resetIn = Math.max(0, e.rateLimit.reset * 1000 - Date.now());
      globalUserIdCooldownUntil = Date.now() + resetIn;
      warn(`Twitter rate limit hit. Global cooldown set for ${Math.ceil(resetIn / 1000)} seconds.`);
      return { rateLimited: true, cooldown: Math.ceil(resetIn / 1000) };
    }
    error('Twitter getUserId error', e);
    return null;
  }
}

export function isUserIdLookupInCooldown() {
  return globalUserIdCooldownUntil > Date.now();
}

export function getUserIdCooldownSeconds() {
  return Math.max(0, Math.ceil((globalUserIdCooldownUntil - Date.now()) / 1000));
}

export async function getLatestImageTweet(username: string): Promise<
  { url: string, id: string, text: string, imageUrl: string } | null | { rateLimited: true, cooldown: number }
> {
  const userId = await getUserId(username);
  if (userId && typeof userId === 'object' && 'rateLimited' in userId) {
    return userId;
  }
  if (!userId) return null;
  try {
    const tweets = await twitterClient.v2.userTimeline(userId, {
      exclude: ['retweets', 'replies'],
      expansions: ['attachments.media_keys'],
      'media.fields': ['url', 'type'],
      max_results: 5,
    });
    const media = tweets.includes?.media || [];
    for (const tweet of tweets.data.data || []) {
      if (
        tweet.attachments &&
        Array.isArray(tweet.attachments.media_keys) &&
        tweet.attachments.media_keys.length > 0
      ) {
        const image = media.find(
          m => tweet.attachments!.media_keys!.includes(m.media_key) && m.type === 'photo'
        );
        if (image && image.url) {
          return {
            url: `https://twitter.com/${username}/status/${tweet.id}`,
            id: tweet.id,
            text: tweet.text,
            imageUrl: image.url,
          };
        }
      }
    }
    return null;
  } catch (e) {
    error('Twitter getLatestImageTweet error', e);
    return null;
  }
}

export async function getRateLimitStatus() {
  try {
    // twitter-api-v2 does not expose a direct endpoint for rate limits, so we simulate by catching errors
    await twitterClient.v2.me();
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiResponseError && e.rateLimit) {
      return { ok: false, rateLimit: e.rateLimit };
    }
    error('Twitter getRateLimitStatus error', e);
    return { ok: false };
  }
}
