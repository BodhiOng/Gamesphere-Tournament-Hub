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

export async function getMyMatches(user, {
  search = '', page = 1, pageSize = 8, game = 'all', status = 'all', sort = 'closest',
} = {}) {
  if (!user) {
    return {
      items: [],
      page: 1,
      pageSize,
      totalItems: 0,
      totalPages: 0,
    };
  }

  const query = new URLSearchParams();
  if (user.id != null) query.set('actorUserId', String(user.id));
  if (user.email) query.set('actorEmail', user.email);
  if (search.trim()) query.set('search', search.trim());
  if (game && game !== 'all') query.set('game', game);
  if (status && status !== 'all') query.set('status', status);
  if (sort) query.set('sort', sort);
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));

  const data = await request(`/api/match/user-schedule?${query.toString()}`);
  return Array.isArray(data)
    ? {
        items: data,
        page,
        pageSize,
        totalItems: data.length,
        totalPages: data.length > 0 ? 1 : 0,
      }
    : data;
}
