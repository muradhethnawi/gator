import { db } from "..";
import { feeds, users, feedFollows } from "../schema";
import { eq, and, sql } from "drizzle-orm";

export async function getFeedsWithUsers() {
  const result = await db
    .select({
      feedId: feeds.id,
      feedName: feeds.name,
      feedUrl: feeds.url,
      feedCreatedAt: feeds.createdAt,
      feedUpdatedAt: feeds.updatedAt,
      userName: users.name,
    })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));
  return result;
}

export async function getFeedByUrl(url: string) {
  const result = await db.select().from(feeds).where(eq(feeds.url, url));
  return result[0] ?? null;
}

export async function createFeedFollow(userId: string, feedId: string) {
  const [follow] = await db
    .insert(feedFollows)
    .values({ userId, feedId })
    .returning();

  const result = await db
    .select({
      followId: feedFollows.id,
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .where(eq(feedFollows.id, follow.id));

  return result[0];
}

export async function getFeedFollowsForUser(userId: string) {
  const result = await db
    .select({
      followId: feedFollows.id,
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .where(eq(feedFollows.userId, userId));
  return result;
}

export async function deleteFeedFollow(userId: string, feedUrl: string) {
  const feed = await getFeedByUrl(feedUrl);
  if (!feed) throw new Error(`No feed found with url: ${feedUrl}`);
  await db
    .delete(feedFollows)
    .where(and(eq(feedFollows.userId, userId), eq(feedFollows.feedId, feed.id)));
}

export async function markFeedFetched(feedId: string) {
  await db
    .update(feeds)
    .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
    .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
  const result = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} ASC NULLS FIRST`)
    .limit(1);
  return result[0] ?? null;
}
