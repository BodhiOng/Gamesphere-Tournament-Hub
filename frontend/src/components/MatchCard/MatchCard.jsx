function MatchCard({ match }) {
  return (
    <article className="surface-card compact">
      <h4>{match.opponent}</h4>
      <p>{match.date}</p>
      <p>Status: {match.status}</p>
      <p>Result: {match.result}</p>
      {match.stream && (
        <a className="inline-link" href={match.stream} target="_blank" rel="noreferrer">
          Watch Livestream
        </a>
      )}
    </article>
  );
}

export default MatchCard;
