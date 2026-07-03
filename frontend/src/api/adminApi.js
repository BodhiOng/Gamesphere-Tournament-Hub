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

export async function getAccountRequests() {
  return request('/api/admin/account-requests');
}

export async function approveAccountRequest(id, promoteToAdmin = false) {
  const query = new URLSearchParams({
    promoteToAdmin: promoteToAdmin ? 'true' : 'false',
  });

  return request(`/api/admin/account-requests/${id}/approve?${query.toString()}`, {
    method: 'POST',
  });
}

export async function rejectAccountRequest(id) {
  return request(`/api/admin/account-requests/${id}/reject`, { method: 'POST' });
}

export async function getReports() {
  return request('/api/admin/reports');
}

export async function deleteReportedAccount(reportId) {
  return request(`/api/admin/reports/${reportId}/delete-account`, { method: 'POST' });
}

export async function suspendReportedAccount(reportId, suspendedUntilUtc, actorUser) {
  const actorUserId = actorUser?.id ?? null;
  const actorUserPublicId = actorUser?.publicId ?? null;
  const actorEmail = actorUser?.email ?? null;

  return request(`/api/admin/reports/${reportId}/suspend-account`, {
    method: 'POST',
    body: JSON.stringify({
      actorUserId,
      actorUserPublicId,
      actorEmail,
      suspendedUntilUtc,
    }),
  });
}

export async function getMatchResults() {
  return request('/api/admin/match-results');
}

export async function getMatchResultLookups() {
  return request('/api/admin/match-results/lookups');
}

export async function createMatchResult(payload, actorUser) {
  return request('/api/admin/match-results', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      actorUserId: actorUser?.id ?? null,
      actorUserPublicId: actorUser?.publicId ?? null,
      actorEmail: actorUser?.email ?? null,
    }),
  });
}

export async function updateMatchResult(id, payload, actorUser) {
  return request(`/api/admin/match-results/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...payload,
      actorUserId: actorUser?.id ?? null,
      actorUserPublicId: actorUser?.publicId ?? null,
      actorEmail: actorUser?.email ?? null,
    }),
  });
}

export async function deleteMatchResult(id) {
  return request(`/api/admin/match-results/${id}`, {
    method: 'DELETE',
  });
}
