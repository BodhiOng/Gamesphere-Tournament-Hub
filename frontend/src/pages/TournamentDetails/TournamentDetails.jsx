import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeaderboardTable from '../../components/LeaderboardTable/LeaderboardTable';
import { getLeaderboard } from '../../api/leaderboardApi';
import { getTournamentById, deleteTournament } from '../../api/tournamentApi';
import DeleteConfirm from '../../components/DeleteConfirm/DeleteConfirm';

const schedules = [
  'Quarterfinals: Jun 6, 18:00 UTC',
  'Semifinals: Jun 7, 18:00 UTC',
  'Grand Final: Jun 8, 20:00 UTC',
];

function TournamentDetails() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getTournamentById(id).then(setTournament);
    getLeaderboard().then(setLeaderboard);
  }, [id]);

  if (!tournament) {
    return <p>There is no tournament entry available right now.</p>;
  }

  return (
    <section>
      <h2>{tournament.name}</h2>
      <p style={{ fontFamily: 'monospace', marginTop: '0.25rem' }}>ID: {tournament.publicId || tournament.id}</p>
      {tournament.image ? (
        <img
          src={tournament.image}
          alt={tournament.name || 'Tournament'}
          style={{ marginTop: '0.75rem', width: '100%', maxWidth: '460px', maxHeight: '260px', objectFit: 'cover', borderRadius: '0.6rem' }}
        />
      ) : null}
      {tournament.description ? <p style={{ marginTop: '0.75rem' }}>{tournament.description}</p> : null}
      <div style={{ marginTop: '0.6rem' }}>
        <button type="button" className="ghost-btn" onClick={() => setDeleteOpen(true)}>Delete Tournament</button>
      </div>

      <DeleteConfirm
        open={deleteOpen}
        title={`Delete tournament: ${tournament?.name}`}
        message={tournament ? 'Deleting this tournament will also delete any teams connected to this tournament. This action cannot be undone.' : ''}
        details={tournament ? `ID: ${tournament.publicId || tournament.id}` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deleteTournament(tournament.id, true);
            navigate('/admin');
          } catch (err) {
            alert(err.message || 'Failed to delete tournament');
          }
        }}
      />
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
