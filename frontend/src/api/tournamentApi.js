const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5286';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', ...options });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.status === 204 ? null : res.json();
}

function normalizeTournament(item) {
  if (!item) {
    return null;
  }

  return {
    id: item.id,
    publicId: item.publicId,
    name: item.name,
    game: item.game,
    region: item.region,
    status: item.status,
    prizePool: item.prizePool,
    startDate: item.startDate,
    teamSlots: item.teamSlots,
    teamsCount: Array.isArray(item.teams) ? item.teams.length : (item.teamsCount ?? 0),
  };
}

export async function getTournaments() {
  try {
    const data = await request('/api/tournament');
    const tournaments = Array.isArray(data) ? data.map(normalizeTournament).filter(Boolean) : [];
    return tournaments;
  } catch {
    return [];
  }
}

export async function getTournamentById(id) {
  try {
    const data = await request(`/api/tournament/${id}`);
    return normalizeTournament(data);
  } catch {
    return null;
  }
}

export async function createTournament(payload) {
  try {
    const data = await request('/api/tournament', {
      method: 'POST',
      body: JSON.stringify({
        Name: payload.name,
        StartDate: payload.startDate,
        TeamSlots: payload.teamSlots,
        Game: payload.game,
        Region: payload.region,
        Status: payload.status,
        PrizePool: payload.prizePool,
      }),
    });
    return normalizeTournament(data);
  } catch (err) {
    throw err;
  }
}

export async function updateTournament(id, payload) {
  return request(`/api/tournament/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteTournament(id, cascade = false) {
  const qs = cascade ? '?cascade=true' : '';
  return request(`/api/tournament/${id}${qs}`, { method: 'DELETE' });
}
