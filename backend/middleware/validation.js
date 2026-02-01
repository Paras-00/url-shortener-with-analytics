function createUrlBody(req, res, next) {
  const { url, expiresIn } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }
  if (expiresIn != null) {
    const n = parseInt(expiresIn, 10);
    if (Number.isNaN(n) || n < 60) {
      return res.status(400).json({
        success: false,
        error: 'expiresIn must be a number of seconds (minimum 60)',
      });
    }
    req.body.expiresInSeconds = n;
  }
  next();
}

module.exports = { createUrlBody };
