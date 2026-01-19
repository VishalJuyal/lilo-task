const mongoose = require('mongoose');

const trendSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    index: true
  },
  sourceId: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  risingScore: {
    type: Number,
    required: true,
    default: 0,
    index: true
  },
  // Velocity metrics
  velocity: {
    type: Number,
    default: 0
  },
  engagement: {
    type: Number,
    default: 0
  },
  recency: {
    type: Number,
    default: 0
  },
  // Raw metrics from source
  metrics: {
    upvotes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    createdAt: { type: Date }
  },
  // For buzzword clustering
  keywords: [{
    type: String
  }],
  cluster: {
    type: String,
    default: null
  },
  // Timestamps
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique trends per source
trendSchema.index({ source: 1, sourceId: 1 }, { unique: true });

// Update lastSeen on save
trendSchema.pre('save', function(next) {
  this.lastSeen = new Date();
  next();
});

module.exports = mongoose.model('Trend', trendSchema);
