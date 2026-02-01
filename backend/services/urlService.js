const { nanoid } = require('nanoid');
const validator = require('validator');
const Url = require('../models/Url');
const { getRedis } = require('../config/redis');
const config = require('../config');

const SHORT_CODE_LENGTH = 8;
const CACHE_TTL_SEC = 3600; // 1 hour for URL lookup

function isValidUrl(str) {
  if (typeof str !== 'string' || !str.trim()) return false;
  const opts = { require_protocol: true, allow_underscores: true, allow_protocol_relative_urls: false };
  return validator.isURL(str, opts) || validator.isURL('https://' + str.trim(), opts);
}

function normalizeUrl(url) {
  const u = url.trim();
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
}

async function getCachedLongUrl(shortCode) {
  try {
    const redis = await getRedis();
    if (!redis) return null;
    const key = `url:${shortCode}`;
    const longUrl = await redis.get(key);
    return longUrl || null;
  } catch {
    return null;
  }
}

async function setCachedLongUrl(shortCode, longUrl) {
  try {
    const redis = await getRedis();
    if (!redis) return;
    const key = `url:${shortCode}`;
    await redis.setEx(key, CACHE_TTL_SEC, longUrl);
  } catch {
    // Redis unavailable – skip cache
  }
}

async function invalidateCachedUrl(shortCode) {
  try {
    const redis = await getRedis();
    if (!redis) return;
    await redis.del(`url:${shortCode}`);
  } catch {
    // ignore
  }
}

async function createShortUrl(longUrl, expiresInSeconds = null, createdBy = null) {
  const normalized = normalizeUrl(longUrl);
  if (!isValidUrl(normalized)) {
    const err = new Error('Please enter a valid URL (e.g. https://example.com or example.com)');
    err.statusCode = 400;
    throw err;
  }

  const shortCode = nanoid(SHORT_CODE_LENGTH);
  const expiresAt = expiresInSeconds
    ? new Date(Date.now() + expiresInSeconds * 1000)
    : null;

  const doc = await Url.create({
    shortCode,
    longUrl: normalized,
    expiresAt,
    createdBy,
  });

  return {
    shortCode: doc.shortCode,
    longUrl: doc.longUrl,
    shortUrl: `${config.baseUrl}/${doc.shortCode}`,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  };
}

async function getByShortCode(shortCode, useCache = true) {
  if (useCache) {
    const cached = await getCachedLongUrl(shortCode);
    if (cached) return { longUrl: cached, fromCache: true };
  }

  const doc = await Url.findOne({
    shortCode: shortCode,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();

  if (!doc) return null;

  if (useCache) await setCachedLongUrl(shortCode, doc.longUrl);

  return {
    longUrl: doc.longUrl,
    urlId: doc._id,
    fromCache: false,
  };
}

async function getUrlDetails(shortCode) {
  const doc = await Url.findOne({
    shortCode: shortCode,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();

  if (!doc) return null;

  return {
    shortCode: doc.shortCode,
    longUrl: doc.longUrl,
    shortUrl: `${config.baseUrl}/${doc.shortCode}`,
    clickCount: doc.clickCount,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  };
}

module.exports = {
  createShortUrl,
  getByShortCode,
  getUrlDetails,
  invalidateCachedUrl,
  isValidUrl,
  normalizeUrl,
};
