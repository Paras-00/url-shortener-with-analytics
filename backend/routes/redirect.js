const express = require('express');
const router = express.Router();
const urlService = require('../services/urlService');
const analyticsService = require('../services/analyticsService');
const { redirectLimiter } = require('../middleware/rateLimiter');

// GET /:shortCode – redirect and record click
router.get('/:shortCode', redirectLimiter, async (req, res, next) => {
  if (req.params.shortCode === 'api') return next();
  console.log(`[Redirect] Request for shortCode: ${req.params.shortCode}`);
  try {
    const { shortCode } = req.params;
    console.log('[Redirect] Calling urlService.getByShortCode...');
    const result = await urlService.getByShortCode(shortCode);
    console.log('[Redirect] urlService result:', !!result);

    if (!result) {
      console.log('[Redirect] Not found');
      res.status(404);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link not found – Syncvia</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f0f12; color: #f4f4f5; text-align: center; padding: 1.5rem; }
    h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
    p { color: #a1a1aa; margin: 0 0 1.5rem; }
    a { color: #6366f1; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div>
    <h1>Link not found or expired</h1>
    <p>This short link does not exist or has expired.</p>
    <a href="/">Go to Syncvia</a>
  </div>
</body>
</html>`);
    }

    const { longUrl, urlId } = result;
    await analyticsService.recordClick(shortCode, urlId, req);

    res.redirect(302, longUrl);
  } catch (err) {
    res.status(500).send('Redirect failed');
  }
});

module.exports = router;
