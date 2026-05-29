function TeamRoster({ members, captainUserId, canManage, savingAction, onRemoveMember, onAssignCaptain }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            {canManage ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.gamerTag}</td>
              <td>{member.role}</td>
              <td>{member.status}</td>
              {canManage ? (
                <td>
                  <div className="roster-actions-row">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => onAssignCaptain(member.username)}
                      disabled={member.id === captainUserId || savingAction === `captain:${member.username}`}
                    >
                      {savingAction === `captain:${member.username}` ? 'Assigning...' : 'Make Captain'}
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => onRemoveMember(member.username)}
                      disabled={member.id === captainUserId || savingAction === `remove:${member.username}`}
                    >
                      {savingAction === `remove:${member.username}` ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TeamRoster;
