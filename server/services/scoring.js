const Trend = require('../models/Trend');
const redditSource = require('./sources/reddit');
const hackernewsSource = require('./sources/hackernews');
const githubSource = require('./sources/github');
const rssSource = require('./sources/rss');

/**
 * Rising Score Algorithm
 * 
 * The algorithm calculates a "rising score" based on three key factors:
 * 
 * 1. VELOCITY (40% weight): How quickly engagement is growing
 *    - Compares current metrics to previous state
 *    - Higher growth rate = higher velocity score
 *    - Formula: (current_engagement - previous_engagement) / time_elapsed
 * 
 * 2. RECENCY (30% weight): How fresh the content is
 *    - Newer content gets higher scores (decay over time)
 *    - Formula: 1 / (hours_old + 1) * recency_multiplier
 * 
 * 3. ENGAGEMENT (30% weight): Absolute engagement levels
 *    - Normalized across different sources (upvotes, stars, comments)
 *    - Formula: log(engagement + 1) * engagement_multiplier
 * 
 * Final Score = (velocity * 0.4) + (recency * 0.3) + (engagement * 0.3)
 * 
 * The algorithm favors:
 * - Content that's gaining traction quickly (velocity)
 * - Recent content (recency)
 * - Content with meaningful engagement (engagement)
 * 
 * This combination helps surface trends BEFORE they peak, as items with
 * high velocity and recency but moderate engagement are likely still rising.
 */

function calculateRisingScore(trend, previousTrend = null) {
  const now = new Date();
  const createdAt = trend.metrics.createdAt || trend.firstSeen || now;
  const hoursOld = (now - createdAt) / (1000 * 60 * 60);
  
  // Calculate engagement score (normalized across sources)
  let engagementScore = 0;
  if (trend.source === 'reddit') {
    engagementScore = Math.log(trend.metrics.upvotes + 1) * 10 + 
                      Math.log(trend.metrics.comments + 1) * 5;
  } else if (trend.source === 'hackernews') {
    engagementScore = Math.log(trend.metrics.upvotes + 1) * 12 + 
                      Math.log(trend.metrics.comments + 1) * 6;
  } else if (trend.source === 'github') {
    engagementScore = Math.log(trend.metrics.stars + 1) * 15;
  } else if (trend.source === 'rss') {
    engagementScore = Math.log(trend.engagement + 1) * 8;
  }
  
  // Calculate recency score (decay over time)
  const recencyScore = (1 / (hoursOld + 1)) * 100;
  
  // Calculate velocity score (growth rate)
  let velocityScore = 0;
  if (previousTrend) {
    const timeDiff = (now - previousTrend.lastSeen) / (1000 * 60 * 60); // hours
    if (timeDiff > 0) {
      const engagementDiff = engagementScore - previousTrend.engagement;
      velocityScore = Math.max(0, engagementDiff / timeDiff);
    }
  } else {
    // New trend - give it a boost
    velocityScore = engagementScore * 0.5;
  }
  
  // Normalize velocity score
  velocityScore = Math.min(velocityScore, 100);
  
  // Calculate final rising score
  const risingScore = 
    (velocityScore * 0.4) + 
    (recencyScore * 0.3) + 
    (engagementScore * 0.3);
  
  return {
    risingScore: Math.round(risingScore * 100) / 100,
    velocity: Math.round(velocityScore * 100) / 100,
    engagement: Math.round(engagementScore * 100) / 100,
    recency: Math.round(recencyScore * 100) / 100
  };
}

/**
 * Extract keywords from title for clustering
 */
function extractKeywords(title) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);
  
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 5);
}

/**
 * Simple clustering based on keyword overlap
 */
async function clusterTrends() {
  const trends = await Trend.find().exec();
  const clusters = new Map();
  let clusterId = 0;
  
  for (const trend of trends) {
    let assigned = false;
    
    // Check if it matches any existing cluster
    for (const [id, clusterKeywords] of clusters.entries()) {
      const overlap = trend.keywords.filter(k => clusterKeywords.has(k)).length;
      if (overlap >= 2) {
        // Add to existing cluster
        trend.keywords.forEach(k => clusterKeywords.add(k));
        trend.cluster = id;
        await trend.save();
        assigned = true;
        break;
      }
    }
    
    // Create new cluster if no match
    if (!assigned) {
      const newClusterId = `cluster-${clusterId++}`;
      clusters.set(newClusterId, new Set(trend.keywords));
      trend.cluster = newClusterId;
      await trend.save();
    }
  }
}

/**
 * Fetch and process trends from all sources
 */
async function fetchAllTrends() {
  console.log('Fetching trends from all sources...');
  
  const sources = [
    { name: 'reddit', fetcher: redditSource.fetchTrends },
    { name: 'hackernews', fetcher: hackernewsSource.fetchTrends },
    { name: 'github', fetcher: githubSource.fetchTrends },
    { name: 'rss', fetcher: rssSource.fetchTrends }
  ];
  
  const allTrends = [];
  
  for (const source of sources) {
    try {
      console.log(`  Fetching from ${source.name}...`);
      const trends = await source.fetcher();
      allTrends.push(...trends.map(t => ({ ...t, source: source.name })));
      console.log(`  ${source.name}: ${trends.length} trends`);
    } catch (error) {
      console.error(`  ${source.name} error:`, error.message);
    }
  }
  
  console.log(`Processing ${allTrends.length} total trends...`);
  
  // Process each trend
  for (const trendData of allTrends) {
    try {
      // Extract keywords
      const keywords = extractKeywords(trendData.title);
      
      // Find existing trend
      let trend = await Trend.findOne({
        source: trendData.source,
        sourceId: trendData.sourceId
      });
      
      const previousTrend = trend ? trend.toObject() : null;
      
      if (trend) {
        // Update existing trend
        trend.title = trendData.title;
        trend.url = trendData.url;
        trend.description = trendData.description || trend.description;
        trend.metrics = { ...trend.metrics, ...trendData.metrics };
        trend.keywords = keywords;
      } else {
        // Create new trend
        trend = new Trend({
          title: trendData.title,
          url: trendData.url,
          source: trendData.source,
          sourceId: trendData.sourceId,
          description: trendData.description || '',
          metrics: trendData.metrics,
          keywords: keywords
        });
      }
      
      // Calculate scores
      const scores = calculateRisingScore(trend, previousTrend);
      trend.risingScore = scores.risingScore;
      trend.velocity = scores.velocity;
      trend.engagement = scores.engagement;
      trend.recency = scores.recency;
      
      await trend.save();
    } catch (error) {
      if (error.code !== 11000) { // Ignore duplicate key errors
        console.error(`Error processing trend:`, error.message);
      }
    }
  }
  
  // Run clustering
  console.log('Clustering trends...');
  await clusterTrends();
  
  console.log('All trends processed');
}

module.exports = {
  fetchAllTrends,
  calculateRisingScore,
  clusterTrends
};
