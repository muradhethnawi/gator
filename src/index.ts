import { createFeed } from "./lib/feeds";
import { createUser, getCurrentUser, resetDB, loginUser } from "./lib/users";
import { fetchFeed } from "./rss.js";
import { setUser } from "./config.js";
import {
  getFeedsWithUsers,
  getFeedByUrl,
  createFeedFollow,
  getFeedFollowsForUser,
  deleteFeedFollow,
  markFeedFetched,
  getNextFeedToFetch,
} from "./lib/db/queries/feeds";
import { createPost, getPostsForUser } from "./lib/db/queries/posts";
import { User } from "./lib/db/schema";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type UserCommandHandler = (cmdName: string, user: User, ...args: string[]) => Promise<void>;

function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]) => {
    const user = await getCurrentUser();
    await handler(cmdName, user, ...args);
  };
}

const commandsRegistry: Record<string, CommandHandler> = {};

function registerCommand(registry: Record<string, CommandHandler>, name: string, handler: CommandHandler) {
  registry[name] = handler;
}

registerCommand(commandsRegistry, "agg", handlerAgg);
registerCommand(commandsRegistry, "register", handlerRegister);
registerCommand(commandsRegistry, "reset", handlerReset);
registerCommand(commandsRegistry, "feeds", handlerFeeds);
registerCommand(commandsRegistry, "login", handlerLogin);
registerCommand(commandsRegistry, "addfeed", middlewareLoggedIn(handlerAddFeed));
registerCommand(commandsRegistry, "follow", middlewareLoggedIn(handlerFollow));
registerCommand(commandsRegistry, "following", middlewareLoggedIn(handlerFollowing));
registerCommand(commandsRegistry, "unfollow", middlewareLoggedIn(handlerUnfollow));
registerCommand(commandsRegistry, "browse", middlewareLoggedIn(handlerBrowse));

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) { console.error("Usage: cli <command> [arguments]"); process.exit(1); }
  const cmdName = args[0];
  const cmdArgs = args.slice(1);
  const handler = commandsRegistry[cmdName];
  if (!handler) { console.log("Unknown command: " + cmdName); process.exit(1); }
  await handler(cmdName, ...cmdArgs);
  process.exit(0);
}

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);
  if (!match) throw new Error("Invalid duration: " + durationStr);
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case "ms": return value;
    case "s":  return value * 1000;
    case "m":  return value * 60 * 1000;
    case "h":  return value * 60 * 60 * 1000;
    default:   throw new Error("Unknown unit: " + unit);
  }
}

function parsePublishedAt(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  } catch {}
  return null;
}

async function scrapeFeeds() {
  const feed = await getNextFeedToFetch();
  if (!feed) { console.log("No feeds to fetch"); return; }
  console.log("Fetching feed: " + feed.name + " (" + feed.url + ")");
  await markFeedFetched(feed.id);
  try {
    const rssFeed = await fetchFeed(feed.url);
    for (const item of rssFeed.items) {
      const post = await createPost({
        title: item.title ?? "Untitled",
        url: item.link ?? "",
        description: item.description ?? null,
        publishedAt: parsePublishedAt(item.pubDate),
        feedId: feed.id,
      });
      if (post) console.log("  Saved: " + item.title);
    }
  } catch (err) {
    console.error("Error fetching feed " + feed.url + ": " + err);
  }
}

function handleError(err: unknown) { console.error("Error: " + err); }

async function handlerAgg(cmdName: string, ...args: string[]) {
  const durationStr = args[0];
  if (!durationStr) { console.error("agg requires a time_between_reqs argument"); process.exit(1); }
  let timeBetweenRequests: number;
  try { timeBetweenRequests = parseDuration(durationStr); } catch (err) { console.error("" + err); process.exit(1); }
  console.log("Collecting feeds every " + durationStr);
  scrapeFeeds().catch(handleError);
  const interval = setInterval(() => { scrapeFeeds().catch(handleError); }, timeBetweenRequests);
  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => { console.log("Shutting down feed aggregator..."); clearInterval(interval); resolve(); });
  });
}

async function handlerRegister(cmdName: string, ...args: string[]) {
  const name = args[0];
  if (!name) { console.error("register requires a name"); process.exit(1); }
  const user = await createUser(name);
  setUser(name);
  console.log("Registered user: " + user.name);
}

async function handlerReset(cmdName: string, ...args: string[]) {
  await resetDB();
  console.log("Database reset successfully");
}

async function handlerFeeds(cmdName: string, ...args: string[]) {
  const rows = await getFeedsWithUsers();
  for (const row of rows) {
    console.log("Feed:");
    console.log("  Name:     " + row.feedName);
    console.log("  URL:      " + row.feedUrl);
    console.log("  User:     " + row.userName);
  }
}

async function handlerLogin(cmdName: string, ...args: string[]) {
  const name = args[0];
  if (!name) { console.error("login requires a name"); process.exit(1); }
  const user = await loginUser(name);
  console.log("Logged in as: " + user.name);
}

async function handlerAddFeed(cmdName: string, user: User, ...args: string[]) {
  const name = args[0]; const url = args[1];
  if (!name || !url) { console.error("addfeed requires a name and a url"); process.exit(1); }
  const feed = await createFeed(name, url, user.id);
  const follow = await createFeedFollow(user.id, feed.id);
  console.log("Feed: " + follow.feedName);
  console.log("User: " + follow.userName);
}

async function handlerFollow(cmdName: string, user: User, ...args: string[]) {
  const url = args[0];
  if (!url) { console.error("follow requires a url"); process.exit(1); }
  const feed = await getFeedByUrl(url);
  if (!feed) { console.error("No feed found with url: " + url); process.exit(1); }
  const follow = await createFeedFollow(user.id, feed.id);
  console.log("Feed: " + follow.feedName);
  console.log("User: " + follow.userName);
}

async function handlerFollowing(cmdName: string, user: User, ...args: string[]) {
  const follows = await getFeedFollowsForUser(user.id);
  for (const follow of follows) { console.log("Feed: " + follow.feedName); }
}

async function handlerUnfollow(cmdName: string, user: User, ...args: string[]) {
  const url = args[0];
  if (!url) { console.error("unfollow requires a url"); process.exit(1); }
  await deleteFeedFollow(user.id, url);
  console.log("Unfollowed: " + url);
}

async function handlerBrowse(cmdName: string, user: User, ...args: string[]) {
  const limit = args[0] ? parseInt(args[0]) : 2;
  const userPosts = await getPostsForUser(user.id, limit);
  if (userPosts.length === 0) { console.log("No posts found. Try running agg first."); return; }
  for (const post of userPosts) {
    console.log("Title:       " + post.title);
    console.log("URL:         " + post.url);
    console.log("Published:   " + (post.publishedAt ?? "unknown"));
    console.log("Description: " + (post.description ?? "none"));
    console.log("---");
  }
}

main();
