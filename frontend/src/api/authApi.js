const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5286';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.status === 204 ? null : res.json();
}

export async function loginUser({ email, password }) {
  if (!email || !password) throw new Error('Email and password are required.');
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function registerUser(payload) {
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}
