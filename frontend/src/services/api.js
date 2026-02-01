// Use VITE_API_URL (e.g. http://localhost:5000) to hit backend directly; otherwise use proxy /api
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || res.statusText || 'Request failed';
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function createShortUrl(url, expiresIn = null) {
  const body = { url };
  if (expiresIn != null) body.expiresIn = expiresIn;
  const json = await request('/urls', { method: 'POST', body: JSON.stringify(body) });
  return json.data;
}

export async function getUrlDetails(shortCode) {
  const json = await request(`/urls/${encodeURIComponent(shortCode)}`);
  return json.data;
}

export async function getAnalytics(shortCode) {
  const json = await request(`/analytics/${encodeURIComponent(shortCode)}`);
  return json.data;
}

export async function healthCheck() {
  return request('/health');
}
