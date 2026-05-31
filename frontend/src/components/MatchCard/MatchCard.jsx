function MatchCard({ match }) {
  return (
    <article className="surface-card compact">
      {match.tournamentName && (
        <p style={{ color: 'var(--muted)', fontSize: '0.8em', marginBottom: '0.25rem' }}>
          {match.tournamentName}
          {match.teamName ? ` — ${match.teamName}` : ''}
        </p>
      )}
      <h4>{match.heading || (match.opponent ? `vs ${match.opponent}` : 'Schedule Entry')}</h4>
      {match.detail ? <p>{match.detail}</p> : null}
      <p>{match.date}</p>
      <p>Status: {match.status}</p>
      {match.venue ? (
        <button
          type="button"
          className="ghost-btn"
          onClick={match.onCopyVenue}
          style={{ marginTop: '0.45rem' }}
          title="Click to copy venue"
        >
          {match.copyLabel || `Copy Venue: ${match.venue}`}
        </button>
      ) : null}
      {match.stream && (
        <a className="inline-link" href={match.stream} target="_blank" rel="noreferrer">
          Watch Livestream
        </a>
      )}
    </article>
  );
}

export default MatchCard;
