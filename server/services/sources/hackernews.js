const axios = require('axios');

/**
 * Hacker News Source
 * 
 * Fetches from /newstories and /beststories endpoints.
 * Focuses on items with high velocity (gaining points quickly)
 * rather than just high absolute scores.
 */

const BASE_URL = 'https://hacker-news.firebaseio.com/v0';

async function fetchStoryIds(endpoint) {
  try {
    const response = await axios.get(`${BASE_URL}/${endpoint}.json`, {
      timeout: 10000
    });
    return response.data.slice(0, 50); // Top 50
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    return [];
  }
}

async function fetchStoryDetails(storyId) {
  try {
    const response = await axios.get(`${BASE_URL}/item/${storyId}.json`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

async function fetchTrends() {
  const trends = [];
  
  try {
    // Get new stories (most recent)
    const newStoryIds = await fetchStoryIds('newstories');
    
    // Get best stories (high scoring)
    const bestStoryIds = await fetchStoryIds('beststories');
    
    // Combine and deduplicate
    const allStoryIds = [...new Set([...newStoryIds, ...bestStoryIds])];
    
    // Fetch details for each story
    const storyPromises = allStoryIds.slice(0, 60).map(id => 
      fetchStoryDetails(id)
    );
    
    const stories = (await Promise.all(storyPromises))
      .filter(story => story && story.type === 'story' && !story.deleted);
    
    // Convert to trend format
    for (const story of stories) {
      trends.push({
        sourceId: story.id.toString(),
        title: story.title || 'Untitled',
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        description: '',
        metrics: {
          upvotes: story.score || 0,
          comments: story.descendants || 0,
          createdAt: new Date(story.time * 1000)
        }
      });
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    console.error('Error fetching Hacker News trends:', error.message);
  }
  
  return trends;
}

module.exports = {
  fetchTrends
};
