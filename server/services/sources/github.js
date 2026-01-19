const axios = require('axios');

/**
 * GitHub Source
 * 
 * Fetches repositories that are gaining stars quickly.
 * Uses the GitHub Search API to find repos with recent activity
 * and high star velocity (not just total stars).
 */

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function searchRepositories(query, sort = 'stars', order = 'desc', perPage = 30) {
  try {
    const headers = {
      'User-Agent': 'TrendArbitrage/1.0',
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    
    const response = await axios.get(`${GITHUB_API}/search/repositories`, {
      params: {
        q: query,
        sort: sort,
        order: order,
        per_page: perPage
      },
      headers: headers,
      timeout: 10000
    });
    
    return response.data.items;
  } catch (error) {
    if (error.response?.status === 403) {
      console.error('GitHub API rate limit exceeded. Consider adding GITHUB_TOKEN.');
    }
    console.error('Error searching GitHub:', error.message);
    return [];
  }
}

async function fetchTrends() {
  const trends = [];
  
  try {
    // Search for repos created in the last 7 days with stars
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const dateStr = recentDate.toISOString().split('T')[0];
    
    // Multiple queries to get diverse results
    const queries = [
      `created:>${dateStr} stars:>5 language:javascript`,
      `created:>${dateStr} stars:>5 language:python`,
      `created:>${dateStr} stars:>5 language:typescript`,
      `created:>${dateStr} stars:>5 language:rust`,
      `pushed:>${dateStr} stars:>10` // Recently updated popular repos
    ];
    
    const allRepos = [];
    
    for (const query of queries) {
      const repos = await searchRepositories(query, 'stars', 'desc', 20);
      allRepos.push(...repos);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Deduplicate by ID
    const uniqueRepos = Array.from(
      new Map(allRepos.map(repo => [repo.id, repo])).values()
    );
    
    // Convert to trend format
    for (const repo of uniqueRepos.slice(0, 50)) {
      trends.push({
        sourceId: repo.id.toString(),
        title: repo.full_name,
        url: repo.html_url,
        description: repo.description || '',
        metrics: {
          stars: repo.stargazers_count || 0,
          createdAt: new Date(repo.created_at)
        }
      });
    }
    
  } catch (error) {
    console.error('Error fetching GitHub trends:', error.message);
  }
  
  return trends;
}

module.exports = {
  fetchTrends
};
