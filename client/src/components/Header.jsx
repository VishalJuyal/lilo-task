import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './Header.css';

function Header({ onRefresh, refreshing, lastUpdated, sources, filter, onFilterChange }) {
  const { theme, toggleTheme } = useTheme();
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <h1>Trend Arbitrage</h1>
          <p className="header-subtitle">Find trends before they peak</p>
        </div>
        
        <div className="header-controls">
          <div className="filter-group">
            <label htmlFor="source-filter">Source:</label>
            <select 
              id="source-filter"
              value={filter} 
              onChange={(e) => onFilterChange(e.target.value)}
              className="filter-select"
            >
              {sources.map(source => (
                <option key={source} value={source}>
                  {source === 'all' ? 'All Sources' : source}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          
          <button 
            onClick={onRefresh} 
            disabled={refreshing}
            className="refresh-button"
          >
            {refreshing ? (
              <>
                <span className="spinner-small"></span>
                Refreshing...
              </>
            ) : (
              <>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>
      
      {lastUpdated && (
        <div className="last-updated">
          Last updated: {formatTime(lastUpdated)}
        </div>
      )}
    </header>
  );
}

export default Header;
