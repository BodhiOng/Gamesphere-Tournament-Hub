import MatchCard from '../../components/MatchCard/MatchCard';
import TournamentCard from '../../components/TournamentCard/TournamentCard';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../../context/TournamentContext';

const liveMatches = [
  { opponent: 'Nova Core', date: 'Today, 7:30 PM', status: 'Live', result: 'In Progress', stream: 'https://www.twitch.tv/' },
  { opponent: 'Arc Syndicate', date: 'Tomorrow, 6:00 PM', status: 'Scheduled', result: 'TBD' },
];

const topTeams = ['Nova Core', 'Quantum Five', 'Arc Syndicate'];

function Home() {
  const { tournaments } = useTournament();
  const navigate = useNavigate();

  return (
    <>
      <section className="hero-banner">
        <p className="eyebrow">Cloud-Powered Esports Platform</p>
        <h2>Run tournaments, rally teams, and dominate leaderboards in one hub.</h2>
        <div className="cta-row">
          <button type="button" className="primary-btn" onClick={() => navigate('/team-management')}>Create Team</button>
          <button type="button" className="ghost-btn">Browse Tournaments</button>
        </div>
      </section>

      <section className="grid two">
        <article className="surface-card">
          <h3>Upcoming Tournaments</h3>
          <div className="stack-list">
            {tournaments.slice(0, 2).map((item) => (
              <TournamentCard key={item.id} tournament={item} />
            ))}
          </div>
        </article>

        <article className="surface-card">
          <h3>Top Teams</h3>
          <ul className="detail-list">
            {topTeams.map((team) => (
              <li key={team}>{team}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <h3>Live Matches</h3>
        <div className="grid two">
          {liveMatches.map((match) => (
            <MatchCard key={match.opponent} match={match} />
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;
