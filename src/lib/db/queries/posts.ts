import { db } from "..";
import { posts, feeds, feedFollows } from "../schema";
import { eq, desc, inArray } from "drizzle-orm";

export async function createPost(data: {
  title: string;
  url: string;
  description?: string | null;
  publishedAt?: Date | null;
  feedId: string;
}) {
  try {
    const [result] = await db
      .insert(posts)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return result ?? null;
  } catch (err) {
    return null;
  }
}

export async function getPostsForUser(userId: string, limit: number = 2) {
  const userFeeds = await db
    .select({ feedId: feedFollows.feedId })
    .from(feedFollows)
    .where(eq(feedFollows.userId, userId));

  if (userFeeds.length === 0) return [];

  const feedIds = userFeeds.map((f) => f.feedId);

  const result = await db
    .select({
      id: posts.id,
      title: posts.title,
      url: posts.url,
      description: posts.description,
      publishedAt: posts.publishedAt,
      feedId: posts.feedId,
    })
    .from(posts)
    .where(inArray(posts.feedId, feedIds))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);

  return result;
}
