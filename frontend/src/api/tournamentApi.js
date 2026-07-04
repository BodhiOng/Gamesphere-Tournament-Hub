import { cachedRequestJson, invalidateApiCache, requestJson } from './httpClient';

function normalizeTournament(item) {
  if (!item) {
    return null;
  }

  return {
    id: item.id,
    publicId: item.publicId,
    name: item.name,
    image: item.image,
    description: item.description,
    game: item.game,
    region: item.region,
    status: item.status,
    prizePool: item.prizePool,
    venue: item.venue,
    startDate: item.startDate,
    teamSlots: item.teamSlots,
    teamsCount: Array.isArray(item.registrations)
      ? item.registrations.length
      : (Array.isArray(item.teams) ? item.teams.length : (item.teamsCount ?? 0)),
  };
}

function invalidateTournamentCache() {
  invalidateApiCache((key) => key.startsWith('tournament:') || key.startsWith('leaderboard:groups:'));
}

export async function getTournaments() {
  try {
    const data = await cachedRequestJson('/api/tournament', {
      ttlMs: 60_000,
      cacheKey: 'tournament:list',
    });
    return Array.isArray(data) ? data.map(normalizeTournament).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function getTournamentById(id) {
  try {
    const data = await cachedRequestJson(`/api/tournament/${id}`, {
      ttlMs: 60_000,
      cacheKey: `tournament:detail:id:${id}`,
    });
    return normalizeTournament(data);
  } catch {
    return null;
  }
}

export async function getTournamentByPublicId(publicId) {
  const normalizedPublicId = String(publicId || '').trim();
  if (!normalizedPublicId) {
    return null;
  }

  try {
    const data = await cachedRequestJson(`/api/tournament/public/${encodeURIComponent(normalizedPublicId)}`, {
      ttlMs: 60_000,
      cacheKey: `tournament:detail:public:${normalizedPublicId}`,
    });
    return normalizeTournament(data);
  } catch {
    return null;
  }
}

export async function getTournamentRegistrationsByPublicId(publicId) {
  const normalizedPublicId = String(publicId || '').trim();
  if (!normalizedPublicId) {
    return [];
  }

  try {
    const data = await cachedRequestJson(`/api/tournament/public/${encodeURIComponent(normalizedPublicId)}/registrations`, {
      ttlMs: 20_000,
      cacheKey: `tournament:registrations:public:${normalizedPublicId}`,
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function registerTeamForTournamentByPublicId(publicId, payload) {
  const normalizedPublicId = String(publicId || '').trim();
  const body = JSON.stringify({
    actorUserId: payload.actorUserId ?? null,
    actorEmail: payload.actorEmail ?? null,
    teamId: payload.teamId,
  });

  const response = await requestJson(`/api/tournament/public/${encodeURIComponent(normalizedPublicId)}/register`, {
    method: 'POST',
    body,
  });
  invalidateTournamentCache();
  invalidateApiCache((key) => key.startsWith('team:'));
  return response;
}

export async function leaveTeamFromTournamentByPublicId(publicId, payload) {
  const normalizedPublicId = String(publicId || '').trim();
  const body = JSON.stringify({
    actorUserId: payload.actorUserId ?? null,
    actorEmail: payload.actorEmail ?? null,
    teamId: payload.teamId,
  });

  const response = await requestJson(`/api/tournament/public/${encodeURIComponent(normalizedPublicId)}/leave`, {
    method: 'POST',
    body,
  });
  invalidateTournamentCache();
  invalidateApiCache((key) => key.startsWith('team:'));
  return response;
}

export async function createTournament(payload) {
  const data = await requestJson('/api/tournament', {
    method: 'POST',
    body: JSON.stringify({
      Name: payload.name,
      Image: payload.image,
      Description: payload.description,
      StartDate: payload.startDate,
      TeamSlots: payload.teamSlots,
      Game: payload.game,
      Region: payload.region,
      Status: payload.status,
      PrizePool: payload.prizePool,
      Venue: payload.venue,
    }),
  });
  invalidateTournamentCache();
  return normalizeTournament(data);
}

export async function updateTournament(id, payload) {
  const response = await requestJson(`/api/tournament/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  invalidateTournamentCache();
  return response;
}

export async function deleteTournament(id, cascade = false) {
  const qs = cascade ? '?cascade=true' : '';
  const response = await requestJson(`/api/tournament/${id}${qs}`, { method: 'DELETE' });
  invalidateTournamentCache();
  return response;
}

export async function registerTeamForTournament(tournamentId, payload) {
  const response = await requestJson(`/api/tournament/${tournamentId}/register`, {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: payload.actorUserId ?? null,
      actorEmail: payload.actorEmail ?? null,
      teamId: payload.teamId,
    }),
  });
  invalidateTournamentCache();
  invalidateApiCache((key) => key.startsWith('team:'));
  return response;
}

export async function leaveTeamFromTournament(tournamentId, payload) {
  const response = await requestJson(`/api/tournament/${tournamentId}/leave`, {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: payload.actorUserId ?? null,
      actorEmail: payload.actorEmail ?? null,
      teamId: payload.teamId,
    }),
  });
  invalidateTournamentCache();
  invalidateApiCache((key) => key.startsWith('team:'));
  return response;
}

export async function getTournamentRegistrations(tournamentId) {
  try {
    const data = await cachedRequestJson(`/api/tournament/${tournamentId}/registrations`, {
      ttlMs: 20_000,
      cacheKey: `tournament:registrations:id:${tournamentId}`,
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
