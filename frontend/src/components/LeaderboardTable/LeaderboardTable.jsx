function LeaderboardTable({ rows }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>W-L</th>
            <th>Points</th>
            <th>KD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.team}>
              <td>{row.rank}</td>
              <td>{row.team}</td>
              <td>{row.wins}-{row.losses}</td>
              <td>{row.points}</td>
              <td>{row.kd}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeaderboardTable;
