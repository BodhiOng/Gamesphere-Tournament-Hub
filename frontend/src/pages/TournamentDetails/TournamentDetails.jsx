import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LeaderboardTable from '../../components/LeaderboardTable/LeaderboardTable';
import { getLeaderboard } from '../../api/leaderboardApi';
import { getTournamentById } from '../../api/tournamentApi';

const schedules = [
  'Quarterfinals: Jun 6, 18:00 UTC',
  'Semifinals: Jun 7, 18:00 UTC',
  'Grand Final: Jun 8, 20:00 UTC',
];

function TournamentDetails() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    getTournamentById(id).then(setTournament);
    getLeaderboard().then(setLeaderboard);
  }, [id]);

  if (!tournament) {
    return <p>Tournament not found.</p>;
  }

  return (
    <section>
      <h2>{tournament.name}</h2>
      <div className="grid two">
        <article className="surface-card">
          <h3>Overview</h3>
          <p>{tournament.game} tournament for {tournament.region} with {tournament.teamSlots} slots.</p>
          <h3>Rules</h3>
          <p>Double elimination, best-of-three through semifinals, best-of-five finals.</p>
          <h3>Participating Teams</h3>
          <p>Nova Core, Quantum Five, Arc Syndicate, Velocity Unit and more.</p>
          <button type="button" className="primary-btn">Register Team</button>
        </article>

        <article className="surface-card">
          <h3>Bracket & Match Schedules</h3>
          <ul className="detail-list">
            {schedules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>Bracket progression visualization is planned for the next iteration.</p>
        </article>
      </div>

      <article className="surface-card">
        <h3>Leaderboard</h3>
        <LeaderboardTable rows={leaderboard} />
      </article>
    </section>
  );
}

export default TournamentDetails;
