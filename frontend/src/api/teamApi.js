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

export async function getTeamRoster(user) {
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

  const suffix = query.toString();

  try {
    const data = await request(`/api/team/roster${suffix ? `?${suffix}` : ''}`);
    const members = Array.isArray(data?.members) ? data.members.map(normalizeMember).filter(Boolean) : [];
    return {
      teamId: data?.teamId ?? null,
      teamName: data?.teamName ?? '',
      captainUserId: data?.captainUserId ?? null,
      members,
    };
  } catch {
    return { teamId: null, teamName: '', captainUserId: null, members: [] };
  }
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

export async function addTeamMember(user, username) {
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
      username: trimmed,
    }),
  });
}

export async function removeTeamMember(user, username) {
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
      username: trimmed,
    }),
  });
}

export async function assignTeamCaptain(user, username) {
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
      username: trimmed,
    }),
  });
}

export async function leaveTeam(user) {
  if (!user) {
    throw new Error('You must be logged in to leave a team.');
  }

  return request('/api/team/leave', {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
    }),
  });
}

export async function renameTeam(user, teamName) {
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
      name,
    }),
  });
}

export async function deleteTeam(user) {
  if (!user) {
    throw new Error('You must be logged in to delete a team.');
  }

  return request('/api/team/delete', {
    method: 'POST',
    body: JSON.stringify({
      actorUserId: user.id,
      actorEmail: user.email,
    }),
  });
}
