const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5286';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', ...options });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.status === 204 ? null : res.json();
}

function normalizeMember(member, index) {
  if (!member || typeof member !== 'object') {
    return null;
  }

  return {
    id: member.id ?? member.username ?? member.gamerTag,
    gamerTag: member.gamerTag ?? member.username ?? '-',
    role: member.role ?? '-',
    status: member.status ?? '-',
  };
}

export async function getTeamRoster() {
  try {
    const data = await request('/api/team/roster');
    const members = Array.isArray(data) ? data.map(normalizeMember).filter(Boolean) : [];
    return members;
  } catch {
    return [];
  }
}
