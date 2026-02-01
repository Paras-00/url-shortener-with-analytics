// const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const Click = require('../models/Click');
const Url = require('../models/Url');

function getGeo(ip) {
  // geoip disabled for debugging
  return {};
}

function getDeviceInfo(userAgent) {
  const parser = new UAParser(userAgent || '');
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  return {
    browser: browser.name ? `${browser.name}${browser.version ? ' ' + browser.version : ''}` : null,
    os: os.name ? `${os.name}${os.version ? ' ' + os.version : ''}` : null,
    device: device.type || 'desktop',
  };
}

async function recordClick(shortCode, urlId, req) {
  const ip = req.ip || req.connection?.remoteAddress || null;
  const userAgent = req.get('user-agent') || null;
  const referer = req.get('referer') || req.get('referrer') || null;

  const geo = getGeo(ip);
  const deviceInfo = getDeviceInfo(userAgent);

  console.log(`[Analytics] Recording click for shortCode: ${shortCode}, urlId: ${urlId}`);
  const click = await Click.create({
    shortCode,
    urlId,
    ip,
    userAgent,
    referer,
    ...geo,
    ...deviceInfo,
  });
  console.log('[Analytics] Click document created');

  await Url.findByIdAndUpdate(urlId, { $inc: { clickCount: 1 } });
  console.log('[Analytics] URL click count updated');

  return click;
}

async function getAnalyticsByShortCode(shortCode) {
  const url = await Url.findOne({ shortCode: shortCode.toLowerCase() }).lean();
  if (!url) return null;

  const clicks = await Click.find({ shortCode: shortCode.toLowerCase() })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const byCountry = {};
  const byDevice = {};
  const byBrowser = {};
  const byOs = {};
  const daily = {};

  for (const c of clicks) {
    const day = c.createdAt.toISOString().slice(0, 10);
    daily[day] = (daily[day] || 0) + 1;
    if (c.country) byCountry[c.country] = (byCountry[c.country] || 0) + 1;
    if (c.device) byDevice[c.device] = (byDevice[c.device] || 0) + 1;
    if (c.browser) byBrowser[c.browser] = (byBrowser[c.browser] || 0) + 1;
    if (c.os) byOs[c.os] = (byOs[c.os] || 0) + 1;
  }

  return {
    shortCode: url.shortCode,
    longUrl: url.longUrl,
    totalClicks: url.clickCount,
    clicks: clicks.map((c) => ({
      createdAt: c.createdAt,
      country: c.country,
      region: c.region,
      city: c.city,
      device: c.device,
      browser: c.browser,
      os: c.os,
      referer: c.referer,
    })),
    byCountry: Object.entries(byCountry).map(([k, v]) => ({ name: k, count: v })),
    byDevice: Object.entries(byDevice).map(([k, v]) => ({ name: k, count: v })),
    byBrowser: Object.entries(byBrowser).map(([k, v]) => ({ name: k, count: v })),
    byOs: Object.entries(byOs).map(([k, v]) => ({ name: k, count: v })),
    daily: Object.entries(daily).map(([date, count]) => ({ date, count })),
  };
}

module.exports = {
  recordClick,
  getAnalyticsByShortCode,
  getGeo,
  getDeviceInfo,
};
