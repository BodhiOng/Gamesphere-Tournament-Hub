const leaderboard = [
  { rank: 1, team: 'Nova Core', wins: 14, losses: 2, points: 42, kd: 1.39 },
  { rank: 2, team: 'Quantum Five', wins: 12, losses: 4, points: 37, kd: 1.24 },
  { rank: 3, team: 'Arc Syndicate', wins: 11, losses: 5, points: 34, kd: 1.19 },
  { rank: 4, team: 'Velocity Unit', wins: 9, losses: 7, points: 28, kd: 1.06 },
];

export async function getLeaderboard() {
  return Promise.resolve(leaderboard);
}
