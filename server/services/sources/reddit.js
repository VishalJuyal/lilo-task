const axios = require('axios');

/**
 * Reddit Source
 * 
 * Fetches from /r/rising and /r/new endpoints to catch trends early.
 * Uses public JSON endpoints (no auth required).
 * Focuses on tech-related subreddits that often predict mainstream trends.
 */

const SUBREDDITS = [
  'programming',
  'technology',
  'MachineLearning',
  'artificial',
  'webdev',
  'startups',
  'Entrepreneur',
  'gamedev',
  'cscareerquestions'
];

async function fetchSubreddit(subreddit, sort = 'rising', limit = 25) {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'TrendArbitrage/1.0'
      },
      timeout: 10000
    });
    
    return response.data.data.children.map(post => ({
      sourceId: post.data.id,
      title: post.data.title,
      url: post.data.url.startsWith('http') 
        ? post.data.url 
        : `https://reddit.com${post.data.url}`,
      description: post.data.selftext?.substring(0, 200) || '',
      metrics: {
        upvotes: post.data.ups || 0,
        comments: post.data.num_comments || 0,
        createdAt: new Date(post.data.created_utc * 1000)
      }
    }));
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error.message);
    return [];
  }
}

async function fetchTrends() {
  const allTrends = [];
  
  // Fetch from both 'rising' and 'new' to catch early signals
  for (const subreddit of SUBREDDITS) {
    try {
      const rising = await fetchSubreddit(subreddit, 'rising', 15);
      const newPosts = await fetchSubreddit(subreddit, 'new', 10);
      
      // Combine and deduplicate by sourceId
      const combined = [...rising, ...newPosts];
      const unique = Array.from(
        new Map(combined.map(item => [item.sourceId, item])).values()
      );
      
      allTrends.push(...unique);
      
      // Rate limiting - be nice to Reddit
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing r/${subreddit}:`, error.message);
    }
  }
  
  return allTrends;
}

module.exports = {
  fetchTrends
};
