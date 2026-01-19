import React, { useState, useEffect } from 'react';
import './App.css';
import TrendList from './components/TrendList';
import Header from './components/Header';
import { fetchTrends, refreshTrends } from './services/api';

function App() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTrends();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      loadTrends();
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const loadTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchTrends();
      setTrends(response.trends || []);
      setLastUpdated(response.lastUpdated);
    } catch (err) {
      setError(err.message || 'Failed to load trends');
      console.error('Error loading trends:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await refreshTrends();
      setTrends(response.trends || []);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Failed to refresh trends');
      console.error('Error refreshing trends:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTrends = filter === 'all' 
    ? trends 
    : trends.filter(trend => trend.source === filter);

  const sources = ['all', ...new Set(trends.map(t => t.source))];

  return (
    <div className="App">
      <Header 
        onRefresh={handleRefresh} 
        refreshing={refreshing}
        lastUpdated={lastUpdated}
        sources={sources}
        filter={filter}
        onFilterChange={setFilter}
      />
      
      <main className="main-content">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading emerging trends...</p>
          </div>
        ) : (
          <TrendList trends={filteredTrends} />
        )}
      </main>
    </div>
  );
}

export default App;
