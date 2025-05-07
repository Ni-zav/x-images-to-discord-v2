type Subscription = {
  channelId: string;
  twitterUsername: string;
  lastSeenTweetId?: string;
};

const subscriptions: Subscription[] = [];

export function addSubscription(channelId: string, twitterUsername: string, lastSeenTweetId?: string) {
  if (!subscriptions.find(s => s.channelId === channelId && s.twitterUsername === twitterUsername)) {
    subscriptions.push({ channelId, twitterUsername, lastSeenTweetId });
  }
}

export function removeSubscription(channelId: string, twitterUsername: string) {
  const idx = subscriptions.findIndex(s => s.channelId === channelId && s.twitterUsername === twitterUsername);
  if (idx !== -1) subscriptions.splice(idx, 1);
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
