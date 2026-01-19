# 🔮 Trend Arbitrage

A MERN stack application that detects emerging trends **before** they hit the mainstream by analyzing data from multiple sources and calculating a custom "rising score" algorithm.

## Overview

This application pulls data from Reddit, Hacker News, GitHub, and RSS feeds, then uses a proprietary algorithm to identify trends that are gaining momentum but haven't peaked yet. Unlike traditional "trending" endpoints that show what's already popular, this app finds the signal in the noise.

## Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher) - running locally or connection string
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trend-arbitrage
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env and add your MongoDB connection string
   # MONGODB_URI=mongodb://localhost:27017/trend-arbitrage
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Linux
   sudo systemctl start mongod
   
   # On Windows
   # Start MongoDB service from Services panel
   ```

5. **Run the application**
   ```bash
   # From the root directory, run both server and client
   npm run dev
   
   # Or run them separately:
   # Terminal 1: Server
   cd server && npm run dev
   
   # Terminal 2: Client
   cd client && npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/api/health

## Data Sources

The application pulls data from **4 different sources**:

### 1. Reddit (`/services/sources/reddit.js`)
- **Endpoints**: `/r/{subreddit}/rising.json` and `/r/{subreddit}/new.json`
- **Subreddits**: programming, technology, MachineLearning, artificial, webdev, startups, Entrepreneur, gamedev, cscareerquestions
- **Why**: Reddit's "rising" endpoint shows posts gaining traction before they hit the front page
- **Metrics**: Upvotes, comments, creation time
- **No authentication required** (uses public JSON endpoints)

### 2. Hacker News (`/services/sources/hackernews.js`)
- **Endpoints**: `/newstories` and `/beststories` from Firebase API
- **Why**: HN's new stories often predict what will become popular in tech circles
- **Metrics**: Points (upvotes), comments, story age
- **No authentication required**

### 3. GitHub (`/services/sources/github.js`)
- **Endpoint**: GitHub Search API (`/search/repositories`)
- **Queries**: Repositories created/updated in last 7 days with stars
- **Why**: Repos gaining stars quickly indicate emerging tools/libraries
- **Metrics**: Star count, creation date
- **Optional**: Add `GITHUB_TOKEN` to `.env` for higher rate limits (60 req/hour → 5000 req/hour)

### 4. RSS Feeds (`/services/sources/rss.js`)
- **Feeds**: Hacker News RSS, Product Hunt, Dev.to, Smashing Magazine, CSS-Tricks, O'Reilly Radar
- **Why**: Indie blogs and niche sites often break stories before mainstream media
- **Scraping**: Attempts to extract engagement metrics from Product Hunt pages
- **Metrics**: Publication date, scraped engagement (when available)

## Rising Score Algorithm

The core of this application is the **Rising Score Algorithm** (`/server/services/scoring.js`), which calculates how likely a trend is to "blow up" based on three weighted factors:

### Formula

```
Rising Score = (Velocity × 0.4) + (Recency × 0.3) + (Engagement × 0.3)
```

### Components

#### 1. **Velocity (40% weight)**
- Measures how quickly engagement is growing
- Compares current metrics to previous state (if available)
- Formula: `(current_engagement - previous_engagement) / time_elapsed`
- New trends get a velocity boost
- **Why 40%**: Velocity is the strongest indicator of something "rising"

#### 2. **Recency (30% weight)**
- Rewards fresh content with exponential decay
- Formula: `1 / (hours_old + 1) × 100`
- A post from 1 hour ago scores much higher than one from 24 hours ago
- **Why 30%**: Recent content has more potential to grow

#### 3. **Engagement (30% weight)**
- Normalized engagement across different sources
- Uses logarithmic scaling to prevent outliers from dominating
- Source-specific multipliers:
  - Reddit: `log(upvotes + 1) × 10 + log(comments + 1) × 5`
  - Hacker News: `log(upvotes + 1) × 12 + log(comments + 1) × 6`
  - GitHub: `log(stars + 1) × 15`
  - RSS: `log(engagement + 1) × 8`
- **Why 30%**: Absolute engagement matters, but not as much as growth rate

### Why This Works

The algorithm is designed to surface trends **before they peak** by:
- Favoring high velocity (growing fast) over high absolute engagement
- Rewarding recency (newer = more potential)
- Using logarithmic scaling to prevent already-viral content from dominating

A post with 50 upvotes growing at 10 upvotes/hour will score higher than a post with 500 upvotes that's plateaued.

## Buzzword Clustering (Bonus Feature)

The application includes a **keyword clustering feature** that groups related trends together:

- **Extraction**: Extracts keywords from titles (removes stop words, keeps meaningful terms)
- **Clustering**: Groups trends with 2+ overlapping keywords
- **Display**: Shows related trends in cluster groups in the UI
- **Algorithm**: Simple but effective - uses keyword overlap to identify related conversations

Example: If "GPT-5", "OpenAI announcement", and "ChatGPT update" all appear, they'll be grouped together as they share keywords like "GPT", "OpenAI", "ChatGPT".

## Project Structure

```
trend-arbitrage/
├── README.md                # This file
├── .env.example             # Environment variables template
├── package.json             # Root package.json with dev scripts
│
├── server/
│   ├── index.js             # Express entry point
│   ├── routes/
│   │   └── trends.js        # API routes (GET /api/trends, POST /api/trends/refresh)
│   ├── services/
│   │   ├── sources/         # Data source integrations
│   │   │   ├── reddit.js
│   │   │   ├── hackernews.js
│   │   │   ├── github.js
│   │   │   └── rss.js
│   │   └── scoring.js       # Rising score algorithm + clustering
│   ├── models/
│   │   └── Trend.js         # MongoDB schema
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── components/      # React components
│   │   │   ├── Header.jsx
│   │   │   ├── TrendList.jsx
│   │   │   └── TrendCard.jsx
│   │   └── services/
│   │       └── api.js       # API client
│   └── package.json
│
└── .gitignore
```

## Auto-Refresh

- **Server**: Automatically fetches new trends every 15 minutes (using `node-cron`)
- **Client**: Auto-refreshes the UI every 2 minutes
- **Manual**: Users can click the "Refresh" button to trigger immediate update

## API Endpoints

### `GET /api/trends`
Get all trends, sorted by rising score (descending)

**Response:**
```json
{
  "success": true,
  "count": 50,
  "trends": [...],
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

### `POST /api/trends/refresh`
Manually trigger a refresh of all trends

**Response:**
```json
{
  "success": true,
  "message": "Trends refreshed successfully",
  "count": 50,
  "trends": [...]
}
```

### `GET /api/trends/source/:source`
Get trends filtered by source (reddit, hackernews, github, rss)

### `GET /api/trends/stats`
Get statistics about trends (total count, per-source counts, top trend)

### `GET /api/health`
Health check endpoint

## Features

- **Multi-source aggregation**: 4 different data sources
- **Custom rising score algorithm**: Detects trends before they peak
- **Buzzword clustering**: Groups related trends together
- **Auto-refresh**: Both server-side (cron) and client-side (polling)
- **Source filtering**: Filter trends by data source
- **Real-time metrics**: Velocity, engagement, and recency scores displayed
- **Responsive design**: Works on desktop and mobile
- **Dark theme**: Easy on the eyes

## Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Connection (required)
MONGODB_URI=mongodb://localhost:27017/trend-arbitrage

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: GitHub API token (increases rate limit)
GITHUB_TOKEN=your_github_token_here
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check service status
- Verify connection string in `.env`
- Check MongoDB logs for errors

### Rate Limiting
- **Reddit**: Public endpoints are rate-limited. The app includes delays between requests.
- **GitHub**: Without a token, limit is 60 requests/hour. Add `GITHUB_TOKEN` to increase to 5000/hour.
- **Hacker News**: Firebase API is generally very permissive.

### No Trends Showing
- Check server logs for API errors
- Verify all data sources are accessible
- Wait for initial fetch to complete (runs on server start)
- Try manual refresh via POST `/api/trends/refresh`

### CORS Issues
- Ensure the client proxy is set correctly in `client/package.json`
- Or set `REACT_APP_API_URL` in client `.env` if running on different ports

## Assumptions & Trade-offs

### Assumptions
1. **MongoDB is available**: The app requires MongoDB. Could be adapted for other databases.
2. **Internet connectivity**: All data sources require internet access.
3. **Rate limits are acceptable**: The app includes delays but may hit limits with heavy usage.
4. **Public APIs are stable**: Reddit, HN, GitHub APIs are assumed to be available.

### Trade-offs Made
1. **Simple clustering**: Used keyword overlap instead of advanced NLP (TF-IDF, embeddings) for speed and simplicity.
2. **No historical tracking**: Trends are updated in-place. Could add historical snapshots for trend analysis over time.
3. **Basic error handling**: Errors are logged but don't crash the app. Some sources may fail silently.
4. **No authentication**: The app is designed as a prototype. Production would need user auth, API keys management, etc.
5. **Limited scraping**: Only Product Hunt is scraped. Could expand to more sources with more time.

### What Would I Improve with More Time?

1. **Historical tracking**: Store trend snapshots over time to calculate true velocity
2. **Better clustering**: Use word embeddings or LLM API to cluster semantically similar trends
3. **More sources**: Add Twitter/X, YouTube, Indie Hackers, etc.
4. **Caching layer**: Redis for API responses to reduce rate limiting
5. **Notifications**: Alert users when trends matching their interests appear
6. **Category filtering**: Filter by tech category (AI, web dev, etc.)
7. **Trend prediction**: ML model to predict which trends will "blow up"
8. **Better UI**: Charts showing trend velocity over time, trend comparison, etc.

## Testing

The application is designed as a working prototype. To test:

1. Start the server and verify it connects to MongoDB
2. Check server logs for successful data fetches
3. Open the client and verify trends appear
4. Test manual refresh button
5. Test source filtering
6. Verify trends update over time

## License
MIT#   l i l o - t a s k  
 