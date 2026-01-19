import React from 'react';
import './TrendCard.css';

function TrendCard({ trend }) {
  const getSourceIcon = (source) => {
    const icons = {
      reddit: 'R',
      hackernews: 'H',
      github: 'G',
      rss: 'RSS'
    };
    return icons[source] || '';
  };

  const formatScore = (score) => {
    return score.toFixed(1);
  };

  const getScoreColor = (score) => {
    // Black and white only - use grayscale based on score
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    
    if (score >= 70) return isDark ? '#ffffff' : '#000000';
    if (score >= 50) return isDark ? '#cccccc' : '#333333';
    if (score >= 30) return isDark ? '#999999' : '#666666';
    return isDark ? '#666666' : '#999999';
  };

  return (
    <div className="trend-card">
      <div className="trend-header">
        <div className="trend-source">
          <span className="source-icon">{getSourceIcon(trend.source)}</span>
          <span className="source-name">{trend.source}</span>
        </div>
        <div 
          className="trend-score"
          style={{ color: getScoreColor(trend.risingScore) }}
        >
          {formatScore(trend.risingScore)}
        </div>
      </div>
      
      <h3 className="trend-title">
        <a 
          href={trend.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="trend-link"
        >
          {trend.title}
        </a>
      </h3>
      
      {trend.description && (
        <p className="trend-description">{trend.description}</p>
      )}
      
      <div className="metrics">
        <div className="metric">
          <span className="metric-label">Velocity</span>
          <span className="metric-value">{formatScore(trend.velocity)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Engagement</span>
          <span className="metric-value">{formatScore(trend.engagement)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Recency</span>
          <span className="metric-value">{formatScore(trend.recency)}</span>
        </div>
      </div>
      
      <div className="card-footer">
        {trend.metrics.upvotes > 0 && (
          <span className="stat">Upvotes: {trend.metrics.upvotes}</span>
        )}
        {trend.metrics.comments > 0 && (
          <span className="stat">Comments: {trend.metrics.comments}</span>
        )}
        {trend.metrics.stars > 0 && (
          <span className="stat">Stars: {trend.metrics.stars}</span>
        )}
      </div>
    </div>
  );
}

export default TrendCard;
