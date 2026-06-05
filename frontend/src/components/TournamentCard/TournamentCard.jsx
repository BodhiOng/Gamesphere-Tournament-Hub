import { Link } from 'react-router-dom';

function TournamentCard({ tournament }) {
  return (
    <article className="surface-card">
      <div className="card-header">
        <h3>{tournament.name}</h3>
        <span className="status-pill">{tournament.status}</span>
      </div>
      <p>{tournament.game} • {tournament.region}</p>
      <ul className="detail-list">
        <li>Prize Pool: {tournament.prizePool}</li>
        <li>Start Date: {tournament.startDate}</li>
        <li>Team Slots: {tournament.teamSlots}</li>
      </ul>
      <Link to={`/tournaments/${tournament.publicId || tournament.id}`} className="primary-btn">
        View Details
      </Link>
    </article>
  );
}

export default TournamentCard;
