import { requestJson } from './httpClient';

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
  const response = await requestJson('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  return {
    ...response,
    user: normalizeAuthUser(response?.user),
  };
}

export async function registerUser(payload) {
  return requestJson('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}
