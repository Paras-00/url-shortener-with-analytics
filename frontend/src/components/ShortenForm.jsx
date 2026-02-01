import React, { useState } from 'react';
import { createShortUrl } from '../services/api';
import './ShortenForm.css';

export default function ShortenForm({ onCreated }) {
  const [url, setUrl] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const longUrl = url.trim();
    if (!longUrl) return;
    setError('');
    setLoading(true);
    try {
      const expires = expiresIn === '' ? null : parseInt(expiresIn, 10);
      const data = await createShortUrl(longUrl, expires);
      onCreated(data);
      setUrl('');
      setExpiresIn('');
    } catch (err) {
      const msg = err.message || 'Failed to create short URL';
      const isNetworkError = err.message && (err.message.includes('fetch') || err.message.includes('Network'));
      const is404OnCreate = err.status === 404;
      setError(
        isNetworkError || is404OnCreate
          ? 'Cannot reach server. Is the backend running on port 5000?'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="shorten-form" onSubmit={handleSubmit}>
      <div className="shorten-row">
        <input
          type="text"
          placeholder="Paste a long URL here (e.g. https://www.google.com/search?q=...)"
          inputMode="url"
          autoComplete="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="shorten-input"
          disabled={loading}
        />
        <button type="submit" className="shorten-btn" disabled={loading}>
          {loading ? 'Shortening…' : 'Shorten'}
        </button>
      </div>
      <div className="shorten-options">
        <label className="shorten-label">
          <span>Expires in (optional)</span>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            className="shorten-select"
          >
            <option value="">Never</option>
            <option value="3600">1 hour</option>
            <option value="86400">24 hours</option>
            <option value="604800">7 days</option>
            <option value="2592000">30 days</option>
          </select>
        </label>
      </div>
      {error && <p className="shorten-error">{error}</p>}
    </form>
  );
}
