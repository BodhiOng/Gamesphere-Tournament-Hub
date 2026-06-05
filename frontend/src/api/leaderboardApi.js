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

function normalizeMatchResultFeedItem(item, index) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const fallbackId = `match-${index}`;
  return {
    id: item.id ?? fallbackId,
    publicId: item.publicId ?? fallbackId,
    roundNumber: item.roundNumber ?? null,
    teamAScore: item.teamAScore ?? null,
    teamBScore: item.teamBScore ?? null,
    createdAtUtc: item.createdAtUtc ?? null,
    tournament: {
      id: item.tournament?.id ?? null,
      publicId: item.tournament?.publicId ?? '',
      name: item.tournament?.name ?? 'Unknown tournament',
      status: item.tournament?.status ?? '',
      game: item.tournament?.game ?? '',
      region: item.tournament?.region ?? '',
      startDate: item.tournament?.startDate ?? null,
    },
    teamA: {
      id: item.teamA?.id ?? null,
      publicId: item.teamA?.publicId ?? '',
      name: item.teamA?.name ?? 'Team A',
    },
    teamB: {
      id: item.teamB?.id ?? null,
      publicId: item.teamB?.publicId ?? '',
      name: item.teamB?.name ?? 'Team B',
    },
    winner: item.winner
      ? {
          id: item.winner.id ?? null,
          publicId: item.winner.publicId ?? '',
          name: item.winner.name ?? 'Winner',
        }
      : null,
  };
}

export async function getPublicMatchResultFeed() {
  try {
    const data = await request('/api/leaderboard/match-results');
    return Array.isArray(data) ? data.map(normalizeMatchResultFeedItem).filter(Boolean) : [];
  } catch {
    return [];
  }
}
