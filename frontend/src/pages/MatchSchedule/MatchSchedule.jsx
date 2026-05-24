import MatchCard from '../../components/MatchCard/MatchCard';

const schedule = [
  {
    opponent: 'Nova Core',
    date: 'Jun 03, 20:00 UTC',
    status: 'Scheduled',
    result: 'TBD',
    stream: 'https://www.youtube.com/',
  },
  {
    opponent: 'Velocity Unit',
    date: 'Jun 05, 18:00 UTC',
    status: 'Scheduled',
    result: 'TBD',
  },
  {
    opponent: 'Arc Syndicate',
    date: 'Jun 08, 21:00 UTC',
    status: 'Completed',
    result: '2 - 1 Win',
  },
];

function MatchSchedule() {
  return (
    <section>
      <h2>Match Schedule</h2>
      <p>Track match dates, opponents, status, and results. Countdown timers can be added next.</p>
      <div className="grid two">
        {schedule.map((item) => (
          <MatchCard key={`${item.opponent}-${item.date}`} match={item} />
        ))}
      </div>
    </section>
  );
}

export default MatchSchedule;
