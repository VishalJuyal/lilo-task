const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * RSS Source
 * 
 * Fetches from various tech RSS feeds.
 * Focuses on indie blogs and niche news sites that often break stories early.
 * Uses scraping to extract content when needed.
 */

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: ['media:content', 'content:encoded']
  }
});

const RSS_FEEDS = [
  'https://hnrss.org/newest', // Hacker News RSS
  'https://www.producthunt.com/feed', // Product Hunt
  'https://dev.to/feed', // Dev.to
  'https://www.smashingmagazine.com/feed/', // Smashing Magazine
  'https://css-tricks.com/feed/', // CSS-Tricks
  'https://feeds.feedburner.com/oreilly/radar', // O'Reilly Radar
];

async function fetchFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, 15).map(item => ({
      sourceId: item.guid || item.link || `${url}-${item.title}`,
      title: item.title || 'Untitled',
      url: item.link || '',
      description: item.contentSnippet || item.content || '',
      metrics: {
        createdAt: item.pubDate ? new Date(item.pubDate) : new Date()
      }
    }));
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error.message);
    return [];
  }
}

/**
 * Scrape additional engagement metrics from some sources
 */
async function scrapeEngagement(url) {
  try {
    // For Product Hunt, try to get upvotes
    if (url.includes('producthunt.com')) {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 5000
      });
      
      const $ = cheerio.load(response.data);
      const upvotesText = $('[data-test="vote-button"]').first().text();
      const upvotes = parseInt(upvotesText) || 0;
      
      return { engagement: upvotes };
    }
  } catch (error) {
    // Silently fail - scraping is optional
  }
  
  return { engagement: 0 };
}

async function fetchTrends() {
  const allTrends = [];
  
  for (const feedUrl of RSS_FEEDS) {
    try {
      const items = await fetchFeed(feedUrl);
      
      // Try to scrape engagement for some items
      for (const item of items.slice(0, 5)) {
        if (item.url) {
          const engagement = await scrapeEngagement(item.url);
          item.metrics = { ...item.metrics, ...engagement };
        }
      }
      
      allTrends.push(...items);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error processing feed ${feedUrl}:`, error.message);
    }
  }
  
  return allTrends;
}

module.exports = {
  fetchTrends
};
