import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../services/api';
import './AnalyticsView.css';

export default function AnalyticsView({ shortCode, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getAnalytics(shortCode)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [shortCode]);

  if (loading) return <div className="analytics-view loading">Loading analytics…</div>;
  if (error) return <div className="analytics-view error">{error} <button onClick={onClose}>Close</button></div>;
  if (!data) return null;

  const { totalClicks, byCountry, byDevice, byBrowser, byOs, daily } = data;

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <h2>Analytics: /{shortCode}</h2>
        <button type="button" onClick={onClose} className="analytics-close">Close</button>
      </div>
      <div className="analytics-summary">
        <div className="stat">
          <span className="stat-value">{totalClicks}</span>
          <span className="stat-label">Total clicks</span>
        </div>
      </div>
      {daily?.length > 0 && (
        <section className="analytics-section">
          <h3>Clicks by day</h3>
          <ul className="analytics-list">
            {daily.slice(0, 14).map(({ date, count }) => (
              <li key={date}><span>{date}</span> <strong>{count}</strong></li>
            ))}
          </ul>
        </section>
      )}
      {byCountry?.length > 0 && (
        <section className="analytics-section">
          <h3>By country</h3>
          <ul className="analytics-list">
            {byCountry.map(({ name, count }) => (
              <li key={name}><span>{name}</span> <strong>{count}</strong></li>
            ))}
          </ul>
        </section>
      )}
      {byDevice?.length > 0 && (
        <section className="analytics-section">
          <h3>By device</h3>
          <ul className="analytics-list">
            {byDevice.map(({ name, count }) => (
              <li key={name}><span>{name}</span> <strong>{count}</strong></li>
            ))}
          </ul>
        </section>
      )}
      {byBrowser?.length > 0 && (
        <section className="analytics-section">
          <h3>By browser</h3>
          <ul className="analytics-list">
            {byBrowser.map(({ name, count }) => (
              <li key={name}><span>{name}</span> <strong>{count}</strong></li>
            ))}
          </ul>
        </section>
      )}
      {byOs?.length > 0 && (
        <section className="analytics-section">
          <h3>By OS</h3>
          <ul className="analytics-list">
            {byOs.map(({ name, count }) => (
              <li key={name}><span>{name}</span> <strong>{count}</strong></li>
            ))}
          </ul>
        </section>
      )}
      {totalClicks === 0 && (
        <p className="analytics-empty">No clicks yet. Share your short link to see analytics here.</p>
      )}
    </div>
  );
}
