import { Feed, User } from "./db/schema";

export function printFeed(feed: Feed, user: User) {
  console.log("Feed:");
  console.log(`  ID:         ${feed.id}`);
  console.log(`  Name:       ${feed.name}`);
  console.log(`  URL:        ${feed.url}`);
  console.log(`  UserID:     ${feed.userId}`);
  console.log(`  CreatedAt:  ${feed.createdAt}`);
  console.log(`  UpdatedAt:  ${feed.updatedAt}`);
  console.log("User:");
  console.log(`  ID:         ${user.id}`);
  console.log(`  Name:       ${user.name}`);
}
