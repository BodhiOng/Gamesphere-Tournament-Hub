import { cachedRequestJson, invalidateApiCache, requestJson } from './httpClient';

function normalizeUserProfile(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  return {
    id: item.id,
    publicId: item.publicId ?? '',
    username: item.username,
    email: item.email,
    gamerTag: item.gamerTag ?? item.username,
    createdAt: item.createdAt,
    isAdmin: Boolean(item.isAdmin),
    isBanned: Boolean(item.isBanned),
    suspendedUntilUtc: item.suspendedUntilUtc ?? null,
  };
}

function normalizeTeamEnrollment(item, index) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  return {
    id: item.id ?? index,
    publicId: item.publicId ?? '',
    name: item.name ?? '-',
    joinedAt: item.joinedAt ?? null,
    isCaptain: Boolean(item.isCaptain),
  };
}

function normalizeTournamentHistoryItem(item, index) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  return {
    tournamentId: item.tournamentId ?? index,
    tournamentPublicId: item.tournamentPublicId ?? '',
    tournamentName: item.tournamentName ?? '-',
    tournamentImage: item.tournamentImage ?? '',
    tournamentStatus: item.tournamentStatus ?? '',
    tournamentStartDate: item.tournamentStartDate ?? null,
    teamId: item.teamId ?? null,
    teamPublicId: item.teamPublicId ?? '',
    teamName: item.teamName ?? '-',
  };
}

function normalizePublicUserProfile(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    user: normalizeUserProfile(payload.user),
    teams: Array.isArray(payload.teams)
      ? payload.teams.map(normalizeTeamEnrollment).filter(Boolean)
      : [],
    tournamentHistory: Array.isArray(payload.tournamentHistory)
      ? payload.tournamentHistory.map(normalizeTournamentHistoryItem).filter(Boolean)
      : [],
  };
}

export async function getCurrentUserProfile(user, { force = false } = {}) {
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
  const data = await cachedRequestJson(`/api/user/me${suffix ? `?${suffix}` : ''}`, {
    ttlMs: 15_000,
    cacheKey: `user:profile:me:${suffix || 'current'}`,
    force,
  });
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
  const data = await requestJson(`/api/user/me${suffix ? `?${suffix}` : ''}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        username: payload.username,
        gamerTag: payload.gamerTag,
        email: payload.email,
      }),
    });
  invalidateApiCache((key) => key.startsWith('user:profile:'));

  return normalizeUserProfile(data);
}

export async function getPublicUserProfile(userPublicId) {
  const publicId = String(userPublicId || '').trim();
  if (!publicId) {
    throw new Error('User public id is required.');
  }

  let data;
  try {
    data = await cachedRequestJson(`/api/user/public/${encodeURIComponent(publicId)}`, {
      ttlMs: 30_000,
      cacheKey: `user:profile:public:${publicId}`,
    });
  } catch (err) {
    if (err?.message === 'Not Found') {
      throw new Error('User profile endpoint is unavailable. Restart the backend and try again.', { cause: err });
    }

    throw err;
  }

  const normalized = normalizePublicUserProfile(data);
  if (!normalized || !normalized.user) {
    throw new Error('User not found.');
  }

  return normalized;
}

export async function createUserReport(actorUser, payload) {
  if (!actorUser) {
    throw new Error('You must be logged in to submit a report.');
  }

  const subject = String(payload?.subject || '').trim();
  const description = String(payload?.description || '').trim();
  const reportedUserPublicId = String(payload?.reportedUserPublicId || '').trim();

  if (!reportedUserPublicId) {
    throw new Error('Reported user id is required.');
  }

  if (!subject) {
    throw new Error('Report subject is required.');
  }

  if (!description) {
    throw new Error('Report description is required.');
  }

  const response = await requestJson('/api/report', {
    method: 'POST',
    body: JSON.stringify({
      reporterUserPublicId: actorUser.publicId,
      reporterEmail: actorUser.email,
      reportedUserPublicId,
      subject,
      description,
    }),
  });
  invalidateApiCache((key) => key.startsWith('admin:reports:'));
  return response;
}
