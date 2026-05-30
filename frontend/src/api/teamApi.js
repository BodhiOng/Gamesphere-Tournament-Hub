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
    id: member.id ?? member.username ?? member.gamerTag ?? index,
    username: member.username ?? member.gamerTag ?? '-',
    gamerTag: member.gamerTag ?? member.username ?? '-',
    role: member.role ?? '-',
    status: member.status ?? '-',
  };
}

function normalizeTournament(item, index) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  return {
    id: item.id ?? item.publicId ?? index,
    publicId: item.publicId ?? '',
    name: item.name ?? '-',
    startDate: item.startDate ?? null,
    approved: Boolean(item.approved),
  };
}

function normalizeTeamSummary(item, index) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const preferredGames = Array.isArray(item.preferredGames)
    ? item.preferredGames.filter((entry) => typeof entry === 'string' && entry.trim())
    : [];

  const enlistedTournaments = Array.isArray(item.enlistedTournaments)
    ? item.enlistedTournaments.map(normalizeTournament).filter(Boolean)
    : [];

  return {
    id: item.id ?? index,
    name: item.name ?? '-',
    logoUrl: item.logoUrl ?? '',
    description: item.description ?? '',
    preferredGames,
    enlistedTournaments,
    isCaptain: Boolean(item.isCaptain),
    isActive: Boolean(item.isActive),
    memberCount: item.memberCount ?? 0,
    hasPendingRequest: Boolean(item.hasPendingRequest),
    isMember: Boolean(item.isMember),
  };
}

export async function getTeamRoster(user, teamId = null) {
  if (!user) {
    return { teamId: null, teamName: '', captainUserId: null, members: [] };
  }

  const query = new URLSearchParams();
  if (user.id != null) {
    query.set('userId', String(user.id));
  }

  if (user.email) {
    query.set('email', user.email);
  }

  if (teamId != null) {
    query.set('teamId', String(teamId));
  }

  const suffix = query.toString();

  try {
    const data = await request(`/api/team/roster${suffix ? `?${suffix}` : ''}`);
    const members = Array.isArray(data?.members) ? data.members.map(normalizeMember).filter(Boolean) : [];
    return {
      teamId: data?.teamId ?? null,
      teamName: data?.teamName ?? data?.name ?? data?.team ?? '',
      teamLogoUrl: data?.teamLogoUrl ?? '',
      teamDescription: data?.teamDescription ?? '',
      preferredGames: Array.isArray(data?.preferredGames) ? data.preferredGames : [],
      enlistedTournaments: Array.isArray(data?.enlistedTournaments) ? data.enlistedTournaments.map(normalizeTournament).filter(Boolean) : [],
      captainUserId: data?.captainUserId ?? null,
      members,
    };
  } catch {
    return {
      teamId: null,
      teamName: '',
      teamLogoUrl: '',
      teamDescription: '',
      preferredGames: [],
      enlistedTournaments: [],
      captainUserId: null,
      members: [],
    };
  }
}

export async function getMyTeams(user) {
  if (!user) {
    return [];
  }

  const query = new URLSearchParams();
  if (user.id != null) {
    query.set('userId', String(user.id));
  }

  if (user.email) {
    query.set('email', user.email);
  }

  const suffix = query.toString();

  try {
    const data = await request(`/api/team/mine${suffix ? `?${suffix}` : ''}`);
    return Array.isArray(data)
      ? data.map(normalizeTeamSummary).filter((item) => item && item.id != null)
      : [];
  } catch {
    return [];
  }
}

export async function updateTeamProfile(user, payload, teamId = null) {
  if (!user) {
    throw new Error('You must be logged in to update a team profile.');
  }

  return request('/api/team/profile', {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
      teamId,
      logoUrl: payload?.logoUrl ?? '',
      description: payload?.description ?? '',
      preferredGames: payload?.preferredGames ?? '',
    }),
  });
}

export async function discoverTeams(user) {
  if (!user) {
    return { canRequestJoin: false, teams: [] };
  }

  const query = new URLSearchParams();
  if (user.id != null) {
    query.set('userId', String(user.id));
  }

  if (user.email) {
    query.set('email', user.email);
  }

  const suffix = query.toString();
  const data = await request(`/api/team/discover${suffix ? `?${suffix}` : ''}`);
  return {
    canRequestJoin: Boolean(data?.canRequestJoin),
    teams: Array.isArray(data?.teams) ? data.teams.map(normalizeTeamSummary).filter(Boolean) : [],
  };
}

export async function requestTeamJoin(user, payload) {
  if (!user) {
    throw new Error('You must be logged in to request joining a team.');
  }

  return request('/api/team/join/request', {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
      teamId: payload?.teamId ?? null,
      teamName: payload?.teamName ?? '',
      message: payload?.message ?? '',
    }),
  });
}

export async function getTeamJoinRequests(user, teamId = null) {
  if (!user) {
    return [];
  }

  const query = new URLSearchParams();
  if (user.id != null) {
    query.set('userId', String(user.id));
  }

  if (user.email) {
    query.set('email', user.email);
  }

  if (teamId != null) {
    query.set('teamId', String(teamId));
  }

  const suffix = query.toString();
  const data = await request(`/api/team/requests${suffix ? `?${suffix}` : ''}`);
  return Array.isArray(data)
    ? data.map((item) => ({
      id: item?.id ?? null,
      teamId: item?.teamId ?? null,
      requesterUserId: item?.requesterUserId ?? null,
      requesterUsername: item?.requesterUsername ?? '-',
      requesterEmail: item?.requesterEmail ?? '-',
      message: item?.message ?? '',
      requestedAt: item?.requestedAt ?? null,
      status: item?.status ?? 'Pending',
    })).filter((item) => item.id != null)
    : [];
}

async function reviewJoinRequest(user, requestId, teamId, action) {
  if (!user) {
    throw new Error('You must be logged in to review join requests.');
  }

  return request(`/api/team/requests/${action}`, {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
      teamId,
      requestId,
    }),
  });
}

export function approveTeamJoinRequest(user, requestId, teamId = null) {
  return reviewJoinRequest(user, requestId, teamId, 'approve');
}

export function rejectTeamJoinRequest(user, requestId, teamId = null) {
  return reviewJoinRequest(user, requestId, teamId, 'reject');
}

export async function createTeam(user, teamName) {
  if (!user) {
    throw new Error('You must be logged in to create a team.');
  }

  const name = teamName?.trim();
  if (!name) {
    throw new Error('Team name is required.');
  }

  return request('/api/team', {
    method: 'POST',
    body: JSON.stringify({
      name,
      userId: user.id,
      email: user.email,
    }),
  });
}

export async function addTeamMember(user, username, teamId = null) {
  if (!user) {
    throw new Error('You must be logged in to manage team members.');
  }

  const trimmed = username?.trim();
  if (!trimmed) {
    throw new Error('Username is required.');
  }

  return request('/api/team/members', {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
      teamId,
      username: trimmed,
    }),
  });
}

export async function removeTeamMember(user, username, teamId = null) {
  if (!user) {
    throw new Error('You must be logged in to manage team members.');
  }

  const trimmed = username?.trim();
  if (!trimmed) {
    throw new Error('Username is required.');
  }

  return request('/api/team/members/remove', {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
      teamId,
      username: trimmed,
    }),
  });
}

export async function assignTeamCaptain(user, username, teamId = null) {
  if (!user) {
    throw new Error('You must be logged in to manage team members.');
  }

  const trimmed = username?.trim();
  if (!trimmed) {
    throw new Error('Username is required.');
  }

  return request('/api/team/captain', {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
      teamId,
      username: trimmed,
    }),
  });
}

export async function leaveTeam(user, teamId = null) {
  if (!user) {
    throw new Error('You must be logged in to leave a team.');
  }

  return request('/api/team/leave', {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
      teamId,
    }),
  });
}

export async function renameTeam(user, teamName, teamId = null) {
  if (!user) {
    throw new Error('You must be logged in to rename a team.');
  }

  const name = teamName?.trim();
  if (!name) {
    throw new Error('Team name is required.');
  }

  return request('/api/team/rename', {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
      teamId,
      name,
    }),
  });
}

export async function deleteTeam(user, teamId = null) {
  if (!user) {
    throw new Error('You must be logged in to delete a team.');
  }

  return request('/api/team/delete', {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
      teamId,
    }),
  });
}
