const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5286';
import { mockLeaderboardRows } from './mockData';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', ...options });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.status === 204 ? null : res.json();
}

function normalizeLeaderboardRow(row, index) {
  if (!row || typeof row !== 'object') {
    return mockLeaderboardRows[index] ?? mockLeaderboardRows[0];
  }

  const fallback = mockLeaderboardRows[index] ?? mockLeaderboardRows[0];

  return {
    rank: row.rank ?? fallback.rank,
    team: row.team ?? row.name ?? fallback.team,
    wins: row.wins ?? fallback.wins,
    losses: row.losses ?? fallback.losses,
    points: row.points ?? fallback.points,
    kd: row.kd ?? fallback.kd,
  };
}

export async function getLeaderboard() {
  try {
    const data = await request('/api/leaderboard');
    const rows = Array.isArray(data) ? data.map(normalizeLeaderboardRow) : [];
    return rows.length > 0 ? rows : mockLeaderboardRows;
  } catch {
    return mockLeaderboardRows;
  }
}
