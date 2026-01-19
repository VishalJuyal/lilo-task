const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const trendRoutes = require('./routes/trends');
const { fetchAllTrends } = require('./services/scoring');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trend-arbitrage', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/trends', trendRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auto-refresh trends every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Auto-refreshing trends...');
  try {
    await fetchAllTrends();
    console.log('Trends refreshed');
  } catch (error) {
    console.error('Error refreshing trends:', error);
  }
});

// Initial fetch on server start
fetchAllTrends().catch(err => console.error('Initial fetch error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
