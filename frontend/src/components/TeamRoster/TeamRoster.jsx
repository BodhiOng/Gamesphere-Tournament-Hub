function TeamRoster({ members }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Gamer Tag</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.gamerTag}</td>
              <td>{member.role}</td>
              <td>{member.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TeamRoster;
