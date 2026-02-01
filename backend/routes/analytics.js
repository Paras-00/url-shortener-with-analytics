const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');

// GET /api/analytics/:shortCode
router.get('/:shortCode', async (req, res) => {
  try {
    const data = await analyticsService.getAnalyticsByShortCode(req.params.shortCode);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Short URL not found' });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
