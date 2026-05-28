export const mockTournaments = [
  {
    id: 1,
    name: 'Valor Clash Spring Cup',
    game: 'Valorant',
    region: 'NA',
    status: 'Live',
    prizePool: '$25,000',
    startDate: 'May 28, 2026',
    teamSlots: 16,
  },
  {
    id: 2,
    name: 'Apex Rift Championship',
    game: 'Apex Legends',
    region: 'APAC',
    status: 'Upcoming',
    prizePool: '$18,000',
    startDate: 'Jun 03, 2026',
    teamSlots: 20,
  },
  {
    id: 3,
    name: 'Summoner Series Circuit',
    game: 'League of Legends',
    region: 'EU',
    status: 'Open',
    prizePool: '$40,000',
    startDate: 'Jun 08, 2026',
    teamSlots: 12,
  },
];

export const mockLeaderboardRows = [
  { rank: 1, team: 'Nova Core', wins: 14, losses: 2, points: 42, kd: 1.39 },
  { rank: 2, team: 'Quantum Five', wins: 12, losses: 4, points: 37, kd: 1.24 },
  { rank: 3, team: 'Arc Syndicate', wins: 11, losses: 5, points: 34, kd: 1.19 },
  { rank: 4, team: 'Velocity Unit', wins: 9, losses: 7, points: 28, kd: 1.06 },
];

export const mockTeamMembers = [
  { id: 1, gamerTag: 'AceCaptain', role: 'Captain', status: 'Active' },
  { id: 2, gamerTag: 'PulseWave', role: 'Entry Fragger', status: 'Active' },
  { id: 3, gamerTag: 'FrostAim', role: 'Support', status: 'Active' },
  { id: 4, gamerTag: 'NullVector', role: 'IGL', status: 'Bench' },
];

export const mockTournamentById = {
  1: mockTournaments[0],
  2: mockTournaments[1],
  3: mockTournaments[2],
};
