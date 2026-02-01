import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ShortenForm from './components/ShortenForm';
import ResultCard from './components/ResultCard';
import AnalyticsView from './components/AnalyticsView';
import SyncRoom from './components/SyncRoom';
import Footer from './components/Footer';
import './App.css';

const RECENT_LINKS_KEY = 'syncvia_recent_links';
const MAX_RECENT_LINKS = 5;

export default function App() {
  const [view, setView] = useState('shortener'); // 'shortener' or 'sync'
  const [result, setResult] = useState(null);
  const [analyticsShortCode, setAnalyticsShortCode] = useState(null);
  const [recentLinks, setRecentLinks] = useState([]);

  // Load recent links from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_LINKS_KEY);
      if (stored) {
        setRecentLinks(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load recent links:', err);
    }
  }, []);

  // Save recent links to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_LINKS_KEY, JSON.stringify(recentLinks));
    } catch (err) {
      console.error('Failed to save recent links:', err);
    }
  }, [recentLinks]);

  const handleCreated = (data) => {
    setResult(data);
    setAnalyticsShortCode(null);

    // Add to recent links
    const newLink = {
      shortCode: data.shortCode,
      shortUrl: data.shortUrl,
      longUrl: data.longUrl,
      createdAt: data.createdAt || new Date().toISOString(),
      clickCount: 0,
    };

    setRecentLinks((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((link) => link.shortCode !== data.shortCode);
      // Add new link at the beginning and limit to MAX_RECENT_LINKS
      return [newLink, ...filtered].slice(0, MAX_RECENT_LINKS);
    });
  };

  const handleLookup = (shortCode) => {
    setView('shortener');
    setResult(null);
    setAnalyticsShortCode(shortCode);

    // Scroll to analytics section if needed
    setTimeout(() => {
      document.getElementById('analytics-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleClearRecent = () => {
    if (window.confirm('Clear all recent links?')) {
      setRecentLinks([]);
    }
  };

  const handleRecentLinkClick = (link) => {
    // Open in new tab for redirection
    window.open(link.shortUrl, '_blank');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 8400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="app">
      <Header onLookup={handleLookup} />

      <nav className="view-nav">
        <button
          className={`nav-btn ${view === 'shortener' ? 'active' : ''}`}
          onClick={() => setView('shortener')}
        >
          URL Shortener
        </button>
        <button
          className={`nav-btn ${view === 'sync' ? 'active' : ''}`}
          onClick={() => setView('sync')}
        >
          Sync Room
        </button>
      </nav>

      <main className="main">
        {view === 'shortener' ? (
          <>
            <section className="hero">
              <h1 className="hero-title">
                Short links, <span className="gradient">real insights</span>
              </h1>
              <p className="hero-subtitle">
                Create short URLs with expiration and track clicks with geo & device analytics.
              </p>
            </section>

            <ShortenForm onCreated={handleCreated} />

            {result && (
              <ResultCard
                data={result}
                onViewAnalytics={() => setAnalyticsShortCode(result.shortCode)}
              />
            )}

            <div id="analytics-section">
              {analyticsShortCode && (
                <AnalyticsView
                  shortCode={analyticsShortCode}
                  onClose={() => setAnalyticsShortCode(null)}
                />
              )}
            </div>

            {recentLinks.length > 0 && (
              <section className="recent-links">
                <div className="recent-links-header">
                  <h2 className="recent-links-title">Recent Links</h2>
                  <button className="clear-btn" onClick={handleClearRecent}>
                    Clear All
                  </button>
                </div>
                <div className="recent-links-grid">
                  {recentLinks.map((link) => (
                    <div
                      key={link.shortCode}
                      className="recent-link-item"
                      onClick={() => handleRecentLinkClick(link)}
                    >
                      <div className="recent-link-short">{link.shortUrl}</div>
                      <div className="recent-link-long">{link.longUrl}</div>
                      <div className="recent-link-meta">
                        <span className="recent-link-date">
                          {formatDate(link.createdAt)}
                        </span>
                        <span className="recent-link-clicks">
                          {link.clickCount} clicks
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="features-section">
              <div className="feature-card glass glass-hover">
                <div className="feature-icon">⚡</div>
                <h3>Lightning Fast</h3>
                <p>Our links are optimized for speed, ensuring your users reach their destination instantly.</p>
              </div>
              <div className="feature-card glass glass-hover">
                <div className="feature-icon">📊</div>
                <h3>Detailed Analytics</h3>
                <p>Track every click with geographical data, device types, and browser information.</p>
              </div>
              <div className="feature-card glass glass-hover">
                <div className="feature-icon">🛡️</div>
                <h3>Safe & Secure</h3>
                <p>Built-in protection algorithms to filter malicious URLs and ensure link integrity.</p>
              </div>
            </section>
          </>
        ) : (
          <SyncRoom />
        )}
      </main>
      <Footer />
    </div>
  );
}

