const express = require('express');
const router = express.Router();
const Trend = require('../models/Trend');
const { fetchAllTrends } = require('../services/scoring');

// Get all trends, sorted by rising score
router.get('/', async (req, res) => {
  try {
    const trends = await Trend.find()
      .sort({ risingScore: -1 })
      .limit(50)
      .exec();
    
    res.json({
      success: true,
      count: trends.length,
      trends: trends,
      lastUpdated: trends[0]?.updatedAt || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get trends by source
router.get('/source/:source', async (req, res) => {
  try {
    const trends = await Trend.find({ source: req.params.source })
      .sort({ risingScore: -1 })
      .limit(20)
      .exec();
    
    res.json({
      success: true,
      count: trends.length,
      trends: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    await fetchAllTrends();
    const trends = await Trend.find()
      .sort({ risingScore: -1 })
      .limit(50)
      .exec();
    
    res.json({
      success: true,
      message: 'Trends refreshed successfully',
      count: trends.length,
      trends: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get trend statistics
router.get('/stats', async (req, res) => {
  try {
    const totalTrends = await Trend.countDocuments();
    const sources = await Trend.distinct('source');
    const sourceCounts = await Promise.all(
      sources.map(async (source) => ({
        source,
        count: await Trend.countDocuments({ source })
      }))
    );
    
    res.json({
      success: true,
      totalTrends,
      sources: sourceCounts,
      topTrend: await Trend.findOne().sort({ risingScore: -1 })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
