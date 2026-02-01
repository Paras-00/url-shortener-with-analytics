const express = require('express');
const router = express.Router();
const urlService = require('../services/urlService');
const { createUrlBody } = require('../middleware/validation');
const { isMongoConnected } = require('../config/database');

router.post('/', createUrlBody, async (req, res) => {
  if (!(await isMongoConnected())) {
    return res.status(503).json({
      success: false,
      error: 'Database not connected. Start MongoDB (e.g. mongod --dbpath backend/data/db --noauth) and try again.',
    });
  }
  try {
    const { url, expiresInSeconds } = req.body;
    const result = await urlService.createShortUrl(url, expiresInSeconds || null, null);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: err.message || 'Failed to create short URL',
    });
  }
});

router.get('/:shortCode', async (req, res) => {
  try {
    const details = await urlService.getUrlDetails(req.params.shortCode);
    if (!details) {
      return res.status(404).json({ success: false, error: 'Short URL not found or expired' });
    }
    res.json({ success: true, data: details });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
