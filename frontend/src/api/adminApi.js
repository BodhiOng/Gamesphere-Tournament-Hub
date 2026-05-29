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

export async function getAccountRequests() {
  return request('/api/admin/account-requests');
}

export async function approveAccountRequest(id) {
  return request(`/api/admin/account-requests/${id}/approve`, { method: 'POST' });
}

export async function rejectAccountRequest(id) {
  return request(`/api/admin/account-requests/${id}/reject`, { method: 'POST' });
}

export async function deleteAccountRequest(id) {
  return request(`/api/admin/account-requests/${id}`, { method: 'DELETE' });
}