import React, { useState } from 'react';
import './ResultCard.css';

export default function ResultCard({ data, onViewAnalytics }) {
  const [copied, setCopied] = useState(false);

  const shortUrl = data.shortUrl || `${window.location.origin.replace(/:\d+$/, ':5000')}/${data.shortCode}`;

  const copy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiresText = data.expiresAt
    ? new Date(data.expiresAt).toLocaleString()
    : 'Never';

  return (
    <div className="result-card">
      <h2 className="result-title">Your short link</h2>
      <div className="result-url-row">
        <code className="result-url">{shortUrl}</code>
        <button type="button" onClick={copy} className="result-copy">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="result-long">
        <span className="result-label">Original:</span>{' '}
        <a href={data.longUrl} target="_blank" rel="noopener noreferrer">
          {data.longUrl}
        </a>
      </p>
      <p className="result-meta">
        Expires: {expiresText} · Clicks: {data.clickCount ?? 0}
      </p>
      <button type="button" onClick={onViewAnalytics} className="result-analytics-btn">
        View analytics
      </button>
    </div>
  );
}
