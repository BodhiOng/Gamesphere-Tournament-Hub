const tournaments = [
  {
    id: 't-101',
    name: 'Valor Clash Open',
    game: 'Valorant',
    region: 'NA',
    status: 'Open',
    prizePool: '$12,000',
    startDate: '2026-06-05',
    teamSlots: '28 / 32',
  },
  {
    id: 't-102',
    name: 'Rift Rivals Series',
    game: 'League of Legends',
    region: 'EU',
    status: 'Live',
    prizePool: '$20,000',
    startDate: '2026-06-01',
    teamSlots: '16 / 16',
  },
  {
    id: 't-103',
    name: 'DropZone Championship',
    game: 'Apex Legends',
    region: 'APAC',
    status: 'Upcoming',
    prizePool: '$9,500',
    startDate: '2026-06-14',
    teamSlots: '22 / 30',
  },
];

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getTournaments() {
  await wait();
  return tournaments;
}

export async function getTournamentById(id) {
  await wait();
  return tournaments.find((item) => item.id === id) ?? null;
}
