async function handlerAgg() {
  const url = "https://www.wagslane.dev/index.xml";
  
  try {
    const feed = await fetchFeed(url);
    // Using JSON.stringify or console.dir to see the full nested object
    console.log(JSON.stringify(feed, null, 2));
  } catch (err) {
    console.error(`Error fetching feed: ${err}`);
  }
}

handlerAgg();



import { fetchFeed } from "./rss.js";

async function agg() {
  const url = "https://www.wagslane.dev/index.xml";
  
  try {
    console.log(`--- Fetching: ${url} ---`);
    const feed = await fetchFeed(url);
    
    // Print the entire object to verify the structure
    console.log(feed);
    
    console.log("--- Success ---");
  } catch (err) {
    console.error(`Aggregation failed: ${err}`);
  }
}

agg();
