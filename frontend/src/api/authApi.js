const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.status === 204 ? null : res.json();
}

export function normalizeAuthUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  return {
    id: user.id ?? user.Id ?? null,
    publicId: user.publicId ?? user.PublicId ?? '',
    username: user.username ?? user.Username ?? '',
    email: user.email ?? user.Email ?? '',
    gamerTag: user.gamerTag ?? user.GamerTag ?? user.username ?? user.Username ?? '',
    createdAt: user.createdAt ?? user.CreatedAt ?? null,
    isAdmin: Boolean(user.isAdmin ?? user.IsAdmin),
    isBanned: Boolean(user.isBanned ?? user.IsBanned),
    suspendedUntilUtc: user.suspendedUntilUtc ?? user.SuspendedUntilUtc ?? null,
  };
}

export async function loginUser({ email, password }) {
  if (!email || !password) throw new Error('Email and password are required.');
  const response = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  return {
    ...response,
    user: normalizeAuthUser(response?.user),
  };
}

export async function registerUser(payload) {
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}
