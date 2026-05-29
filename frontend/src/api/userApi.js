const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5286';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    throw new Error((await res.text()) || res.statusText);
  }

  return res.status === 204 ? null : res.json();
}

function normalizeUserProfile(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  return {
    id: item.id,
    username: item.username,
    email: item.email,
    gamerTag: item.gamerTag ?? item.username,
    createdAt: item.createdAt,
    isAdmin: Boolean(item.isAdmin),
  };
}

export async function getCurrentUserProfile(user) {
  if (!user) {
    return null;
  }

  const query = new URLSearchParams();
  if (user.id != null) {
    query.set('id', String(user.id));
  }

  if (user.email) {
    query.set('email', user.email);
  }

  const suffix = query.toString();
  const data = await request(`/api/user/me${suffix ? `?${suffix}` : ''}`);
  return normalizeUserProfile(data);
}

export async function updateCurrentUserProfile(user, payload) {
  if (!user) {
    throw new Error('You must be logged in to update your profile.');
  }

  const query = new URLSearchParams();
  if (user.id != null) {
    query.set('id', String(user.id));
  }

  if (user.email) {
    query.set('email', user.email);
  }

  const suffix = query.toString();
  const data = await request(`/api/user/me${suffix ? `?${suffix}` : ''}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        username: payload.username,
        gamerTag: payload.gamerTag,
        email: payload.email,
      }),
    });

  return normalizeUserProfile(data);
}
