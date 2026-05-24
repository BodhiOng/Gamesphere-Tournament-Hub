const teamRoster = [
  { id: 'p-1', gamerTag: 'AceCaptain', role: 'Captain', status: 'Active' },
  { id: 'p-2', gamerTag: 'NeonVortex', role: 'Entry Fragger', status: 'Active' },
  { id: 'p-3', gamerTag: 'PulseWave', role: 'Support', status: 'Pending Invite' },
  { id: 'p-4', gamerTag: 'ZeroPing', role: 'Analyst', status: 'Active' },
];

export async function getTeamRoster() {
  return Promise.resolve(teamRoster);
}
