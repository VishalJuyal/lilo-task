import React from 'react';
import TrendCard from './TrendCard';
import './TrendList.css';

function TrendList({ trends }) {
  if (trends.length === 0) {
    return (
      <div className="empty-state">
        <p>No trends found. Try refreshing or check back later.</p>
      </div>
    );
  }

  // Group by cluster if available
  const clustered = trends.filter(t => t.cluster);
  const unclustered = trends.filter(t => !t.cluster);
  
  const clusters = {};
  clustered.forEach(trend => {
    if (!clusters[trend.cluster]) {
      clusters[trend.cluster] = [];
    }
    clusters[trend.cluster].push(trend);
  });

  return (
    <div className="trend-list">
      {Object.keys(clusters).length > 0 && (
        <div className="clusters-section">
          <h2 className="section-title">Related Trends</h2>
          {Object.entries(clusters).map(([clusterId, clusterTrends]) => (
            <div key={clusterId} className="cluster-group">
              <div className="cluster-trends">
                {clusterTrends.map(trend => (
                  <TrendCard key={trend._id} trend={trend} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {unclustered.length > 0 && (
        <div className="individual-section">
          {Object.keys(clusters).length > 0 && (
            <h2 className="section-title">Individual Trends</h2>
          )}
          <div className="trends-grid">
            {unclustered.map(trend => (
              <TrendCard key={trend._id} trend={trend} />
            ))}
          </div>
        </div>
      )}
      
      {Object.keys(clusters).length === 0 && unclustered.length > 0 && (
        <div className="trends-grid">
          {trends.map(trend => (
            <TrendCard key={trend._id} trend={trend} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TrendList;
