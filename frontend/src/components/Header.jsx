import React, { useState } from 'react';
import { getUrlDetails } from '../services/api';
import './Header.css';

export default function Header({ onLookup }) {
  const [shortCode, setShortCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const looksLikeUrl = (str) =>
    /^https?:\/\//i.test(str) || str.includes('://') || (/^www\./i.test(str)) || (str.includes('.') && str.length > 8);

  const handleLookup = async (e) => {
    e.preventDefault();
    let code = shortCode.trim();
    if (!code) return;

    // If it's a full URL, try to extract the last part (the short code)
    if (looksLikeUrl(code)) {
      try {
        const urlObj = new URL(code.startsWith('http') ? code : `https://${code}`);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          code = pathParts[pathParts.length - 1];
        } else {
          setError('Please provide a valid short link or code.');
          return;
        }
      } catch (err) {
        setError('Invalid URL format. Please enter a short code.');
        return;
      }
    }

    setError('');
    setLoading(true);
    try {
      await getUrlDetails(code);
      onLookup(code);
      setShortCode(''); // Clear after success
    } catch (err) {
      setError(err.message || 'Short link not found or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-row">
          <a href="/" className="logo">
            <span className="logo-icon">S</span>
            <span className="logo-text">Syncvia</span>
          </a>
          <form className="lookup-form" onSubmit={handleLookup}>
            <input
              type="text"
              placeholder="Paste short code to view analytics"
              value={shortCode}
              onChange={(e) => { setShortCode(e.target.value); setError(''); }}
              className="lookup-input"
            />
            <button type="submit" className="lookup-btn" disabled={loading}>
              {loading ? '…' : 'View'}
            </button>
          </form>
        </div>
        {error ? (
          <p className="lookup-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </header>
  );
}
