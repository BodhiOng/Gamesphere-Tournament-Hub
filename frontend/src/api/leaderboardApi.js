import { cachedRequestJson } from './httpClient';
import { mockLeaderboardRows } from './mockData';

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

function normalizeLeaderboardSummary(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  return {
    tournament: {
      id: item.tournament?.id ?? null,
      publicId: item.tournament?.publicId ?? '',
      name: item.tournament?.name ?? 'Unknown tournament',
      status: item.tournament?.status ?? '',
      game: item.tournament?.game ?? '',
      region: item.tournament?.region ?? '',
      startDate: item.tournament?.startDate ?? null,
    },
    latestCreatedAtUtc: item.latestCreatedAtUtc ?? null,
    matchCount: item.matchCount ?? 0,
  };
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

export async function getLeaderboard() {
  try {
    const data = await cachedRequestJson('/api/leaderboard', {
      ttlMs: 30_000,
      cacheKey: 'leaderboard:table',
    });
    const rows = Array.isArray(data) ? data.map(normalizeLeaderboardRow) : [];
    return rows.length > 0 ? rows : mockLeaderboardRows;
  } catch {
    return mockLeaderboardRows;
  }
}

export async function getPublicMatchResultFeed({
  search = '',
  page = 1,
  pageSize = 10,
  game = 'all',
  region = 'all',
  status = 'all',
} = {}) {
  const query = new URLSearchParams();
  if (search.trim()) query.set('search', search.trim());
  if (game && game !== 'all') query.set('game', game);
  if (region && region !== 'all') query.set('region', region);
  if (status && status !== 'all') query.set('status', status);
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));

  try {
    const data = await cachedRequestJson(`/api/leaderboard/match-results?${query.toString()}`, {
      ttlMs: 20_000,
      cacheKey: `leaderboard:groups:${query.toString()}`,
    });

    const items = Array.isArray(data?.items)
      ? data.items.map(normalizeLeaderboardSummary).filter(Boolean)
      : [];

    return {
      items,
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      totalItems: data?.totalItems ?? items.length,
      totalPages: data?.totalPages ?? (items.length > 0 ? 1 : 0),
    };
  } catch {
    return {
      items: [],
      page,
      pageSize,
      totalItems: 0,
      totalPages: 0,
    };
  }
}

export async function getTournamentMatchResults(publicId) {
  const normalizedPublicId = String(publicId || '').trim();
  if (!normalizedPublicId) {
    throw new Error('Tournament public id is required.');
  }

  const data = await cachedRequestJson(`/api/leaderboard/match-results/${encodeURIComponent(normalizedPublicId)}`, {
    ttlMs: 20_000,
    cacheKey: `leaderboard:tournament:${normalizedPublicId}`,
  });

  return {
    tournament: normalizeLeaderboardSummary(data)?.tournament
      ?? {
        id: data?.tournament?.id ?? null,
        publicId: data?.tournament?.publicId ?? '',
        name: data?.tournament?.name ?? 'Unknown tournament',
        status: data?.tournament?.status ?? '',
        game: data?.tournament?.game ?? '',
        region: data?.tournament?.region ?? '',
        startDate: data?.tournament?.startDate ?? null,
      },
    latestCreatedAtUtc: data?.latestCreatedAtUtc ?? null,
    matchCount: data?.matchCount ?? 0,
    results: Array.isArray(data?.results)
      ? data.results.map(normalizeMatchResultFeedItem).filter(Boolean)
      : [],
  };
}
