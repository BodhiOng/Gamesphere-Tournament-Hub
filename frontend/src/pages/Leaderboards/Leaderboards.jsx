import { useEffect, useState } from 'react';
import LeaderboardTable from '../../components/LeaderboardTable/LeaderboardTable';
import { getLeaderboard } from '../../api/leaderboardApi';

function Leaderboards() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getLeaderboard().then(setRows);
  }, []);

  return (
    <section>
      <h2>Leaderboards</h2>
      <p>Live updates with SignalR can be layered onto this table when backend events are ready.</p>
      <article className="surface-card">
        <LeaderboardTable rows={rows} />
      </article>
    </section>
  );
}

export default Leaderboards;
