import fs from 'fs';
import path from 'path';

type Subscription = {
  channelId: string;
  twitterUsername: string;
  lastSeenTweetId?: string;
};

const SUBSCRIPTIONS_FILE = path.join(__dirname, '../subscriptions.json');

function loadSubscriptions(): Subscription[] {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    // ignore and start with empty
  }
  return [];
}

function saveSubscriptions() {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

const subscriptions: Subscription[] = loadSubscriptions();

export function addSubscription(channelId: string, twitterUsername: string, lastSeenTweetId?: string) {
  if (!subscriptions.find(s => s.channelId === channelId && s.twitterUsername === twitterUsername)) {
    subscriptions.push({ channelId, twitterUsername, lastSeenTweetId });
    saveSubscriptions();
  }
}

export function removeSubscription(channelId: string, twitterUsername: string) {
  const idx = subscriptions.findIndex(s => s.channelId === channelId && s.twitterUsername === twitterUsername);
  if (idx !== -1) {
    subscriptions.splice(idx, 1);
    saveSubscriptions();
  }
}

export function listSubscriptions(channelId: string) {
  return subscriptions.filter(s => s.channelId === channelId);
}

export function getAllSubscriptions() {
  return subscriptions;
}

export function getLastSeenTweetId(channelId: string, twitterUsername: string) {
  return subscriptions.find(s => s.channelId === channelId && s.twitterUsername === twitterUsername)?.lastSeenTweetId;
}

export function setLastSeenTweetId(channelId: string, twitterUsername: string, tweetId: string) {
  const sub = subscriptions.find(s => s.channelId === channelId && s.twitterUsername === twitterUsername);
  if (sub) sub.lastSeenTweetId = tweetId;
}
