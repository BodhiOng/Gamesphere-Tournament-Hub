function TeamRoster({ members, captainUserId, canManage, savingAction, onRemoveMember, onAssignCaptain, currentUserId, currentUsername }) {
  const normalizedCurrentUsername = (currentUsername || '').trim().toLowerCase();

  const isSelfMember = (member) => {
    if (!member || typeof member !== 'object') {
      return false;
    }

    const memberId = member.id != null ? String(member.id) : '';
    const selfId = currentUserId != null ? String(currentUserId) : '';
    if (memberId && selfId && memberId === selfId) {
      return true;
    }

    const memberUsername = (member.username || member.gamerTag || '').trim().toLowerCase();
    return Boolean(memberUsername && normalizedCurrentUsername && memberUsername === normalizedCurrentUsername);
  };

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
          {members.map((member) => {
            const selfEntry = isSelfMember(member);

            return (
              <tr key={member.id}>
                <td>{member.gamerTag}</td>
                <td>{member.role}</td>
                <td>{member.status}</td>
                {canManage ? (
                  <td>
                    {selfEntry ? (
                      <span className="roster-self-action-note">Not available</span>
                    ) : (
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
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TeamRoster;
