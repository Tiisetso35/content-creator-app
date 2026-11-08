const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
export const CATEGORIES = ['Education', 'Technology', 'Entertainment', 'Lifestyle', 'Other'];
export const TYPES = ['video', 'article', 'image', 'podcast'];
export const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');
// Anonymous viewer id so one browser can like an item once
export function viewerId() {
  let id = localStorage.getItem('viewerId');
  if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random().toString(36).slice(2)); localStorage.setItem('viewerId', id); }
  return id;
}
