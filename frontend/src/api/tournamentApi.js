const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5286';
import { mockTournaments, mockTournamentById } from './mockData';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', ...options });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.status === 204 ? null : res.json();
}

function normalizeTournament(item) {
  if (!item) {
    return null;
  }

  const fallback = mockTournamentById[item.id] || mockTournaments[0];

  return {
    id: item.id ?? fallback.id,
    name: item.name ?? fallback.name,
    game: item.game ?? fallback.game,
    region: item.region ?? fallback.region,
    status: item.status ?? fallback.status,
    prizePool: item.prizePool ?? fallback.prizePool,
    startDate: item.startDate ?? fallback.startDate,
    teamSlots: item.teamSlots ?? fallback.teamSlots,
  };
}

export async function getTournaments() {
  try {
    const data = await request('/api/tournament');
    const tournaments = Array.isArray(data) ? data.map(normalizeTournament).filter(Boolean) : [];
    return tournaments.length > 0 ? tournaments : mockTournaments;
  } catch {
    return mockTournaments;
  }
}

export async function getTournamentById(id) {
  try {
    const data = await request(`/api/tournament/${id}`);
    return normalizeTournament(data) ?? mockTournamentById[id] ?? mockTournaments[0];
  } catch {
    return mockTournamentById[id] ?? mockTournaments[0];
  }
}
