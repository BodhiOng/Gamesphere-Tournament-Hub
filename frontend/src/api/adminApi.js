import { cachedRequestJson, invalidateApiCache, requestJson } from './httpClient';

function invalidateAdminCache(prefix = 'admin:') {
  invalidateApiCache((key) => key.startsWith(prefix));
}

export async function getAccountRequests({ search = '', status = 'all', page = 1, pageSize = 10 } = {}) {
  const query = new URLSearchParams();
  if (search.trim()) query.set('search', search.trim());
  if (status && status !== 'all') query.set('status', status);
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));

  return cachedRequestJson(`/api/admin/account-requests?${query.toString()}`, {
    ttlMs: 10_000,
    cacheKey: `admin:account-requests:${query.toString()}`,
  });
}

export async function approveAccountRequest(id, promoteToAdmin = false) {
  const query = new URLSearchParams({
    promoteToAdmin: promoteToAdmin ? 'true' : 'false',
  });

  const response = await requestJson(`/api/admin/account-requests/${id}/approve?${query.toString()}`, {
    method: 'POST',
  });
  invalidateAdminCache('admin:account-requests:');
  return response;
}

export async function rejectAccountRequest(id) {
  const response = await requestJson(`/api/admin/account-requests/${id}/reject`, { method: 'POST' });
  invalidateAdminCache('admin:account-requests:');
  return response;
}

export async function getReports({ search = '', status = 'all', page = 1, pageSize = 10 } = {}) {
  const query = new URLSearchParams();
  if (search.trim()) query.set('search', search.trim());
  if (status && status !== 'all') query.set('status', status);
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));

  return cachedRequestJson(`/api/admin/reports?${query.toString()}`, {
    ttlMs: 10_000,
    cacheKey: `admin:reports:${query.toString()}`,
  });
}

export async function deleteReportedAccount(reportId) {
  const response = await requestJson(`/api/admin/reports/${reportId}/delete-account`, { method: 'POST' });
  invalidateAdminCache('admin:reports:');
  invalidateApiCache((key) => key.startsWith('user:profile:'));
  return response;
}

export async function suspendReportedAccount(reportId, suspendedUntilUtc, actorUser) {
  const actorUserId = actorUser?.id ?? null;
  const actorUserPublicId = actorUser?.publicId ?? null;
  const actorEmail = actorUser?.email ?? null;

  const response = await requestJson(`/api/admin/reports/${reportId}/suspend-account`, {
    method: 'POST',
    body: JSON.stringify({
      actorUserId,
      actorUserPublicId,
      actorEmail,
      suspendedUntilUtc,
    }),
  });
  invalidateAdminCache('admin:reports:');
  invalidateApiCache((key) => key.startsWith('user:profile:'));
  return response;
}

export async function getMatchResults({ search = '', page = 1, pageSize = 10 } = {}) {
  const query = new URLSearchParams();
  if (search.trim()) query.set('search', search.trim());
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));

  return cachedRequestJson(`/api/admin/match-results?${query.toString()}`, {
    ttlMs: 10_000,
    cacheKey: `admin:match-results:${query.toString()}`,
  });
}

export async function getMatchResultLookups({ status = 'live', force = false } = {}) {
  const query = new URLSearchParams();
  if (status && status !== 'all') {
    query.set('status', status);
  }

  const suffix = query.toString();
  return cachedRequestJson(`/api/admin/match-results/lookups${suffix ? `?${suffix}` : ''}`, {
    ttlMs: 60_000,
    cacheKey: `admin:match-results:lookups:${suffix || 'all'}`,
    force,
  });
}

export async function createMatchResult(payload, actorUser) {
  const response = await requestJson('/api/admin/match-results', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      actorUserId: actorUser?.id ?? null,
      actorUserPublicId: actorUser?.publicId ?? null,
      actorEmail: actorUser?.email ?? null,
    }),
  });
  invalidateAdminCache('admin:match-results:');
  invalidateApiCache((key) => key.startsWith('leaderboard:'));
  return response;
}

export async function updateMatchResult(id, payload, actorUser) {
  const response = await requestJson(`/api/admin/match-results/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...payload,
      actorUserId: actorUser?.id ?? null,
      actorUserPublicId: actorUser?.publicId ?? null,
      actorEmail: actorUser?.email ?? null,
    }),
  });
  invalidateAdminCache('admin:match-results:');
  invalidateApiCache((key) => key.startsWith('leaderboard:'));
  return response;
}

export async function deleteMatchResult(id) {
  const response = await requestJson(`/api/admin/match-results/${id}`, {
    method: 'DELETE',
  });
  invalidateAdminCache('admin:match-results:');
  invalidateApiCache((key) => key.startsWith('leaderboard:'));
  return response;
}
