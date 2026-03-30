import { XMLParser } from "fast-xml-parser";

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface RSSFeed {
  title: string;
  link: string;
  description: string;
  items: RSSItem[];
}

export async function fetchFeed(url: string): Promise<RSSFeed> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "gator",
    },
  });

  const xmlText = await response.text();

  const parser = new XMLParser();
  const rawData = parser.parse(xmlText);

  const channel = rawData.rss?.channel;
  if (!channel) {
    throw new Error("No channel found in RSS feed");
  }

  const feed: RSSFeed = {
    title: channel.title,
    link: channel.link,
    description: channel.description,
    items: [],
  };

  if (!feed.title || !feed.link || !feed.description) {
    throw new Error("Missing required feed metadata");
  }

  let itemsList: any[] = [];
  if (channel.item) {
    itemsList = Array.isArray(channel.item) ? channel.item : [channel.item];
  }

  for (const item of itemsList) {
    if (item.title && item.link && item.description && item.pubDate) {
      feed.items.push({
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: item.pubDate,
      });
    }
  }

  return feed;
}
