const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5286';
import { mockTeamMembers } from './mockData';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', ...options });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.status === 204 ? null : res.json();
}

function normalizeMember(member, index) {
  if (!member || typeof member !== 'object') {
    return mockTeamMembers[index] ?? mockTeamMembers[0];
  }

  const fallback = mockTeamMembers[index] ?? mockTeamMembers[0];

  return {
    id: member.id ?? fallback.id,
    gamerTag: member.gamerTag ?? member.username ?? fallback.gamerTag,
    role: member.role ?? fallback.role,
    status: member.status ?? fallback.status,
  };
}

export async function getTeamRoster() {
  try {
    const data = await request('/api/team/roster');
    const members = Array.isArray(data) ? data.map(normalizeMember) : [];
    return members.length > 0 ? members : mockTeamMembers;
  } catch {
    return mockTeamMembers;
  }
}
