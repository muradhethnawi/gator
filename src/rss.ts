import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  title: string;
  link: string;
  description: string;
  items: RSSItem[];
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const res = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  const xml = await res.text();

  const parser = new XMLParser();
  const data = parser.parse(xml);

  const channel = data?.rss?.channel;

  if (!channel) {
    throw new Error("Invalid RSS feed");
  }

  const { title, link, description } = channel;

  if (!title || !link || !description) {
    throw new Error("Missing channel metadata");
  }

  let items: any[] = [];

  if (channel.item) {
    if (Array.isArray(channel.item)) {
      items = channel.item;
    } else {
      items = [channel.item];
    }
  }

  const parsedItems: RSSItem[] = [];

  for (const item of items) {
    const { title, link, description, pubDate } = item;

    if (!title || !link || !description || !pubDate) {
      continue;
    }

    parsedItems.push({
      title,
      link,
      description,
      pubDate,
    });
  }

  return {
    title,
    link,
    description,
    items: parsedItems,
  };
}
