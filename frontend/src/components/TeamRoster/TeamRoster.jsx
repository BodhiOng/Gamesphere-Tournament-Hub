import { useEffect, useMemo, useState } from 'react';

function TeamRoster({ members, captainUserId, canManage, savingAction, onRemoveMember, onAssignCaptain, currentUserId, currentUsername }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const normalizedCurrentUsername = (currentUsername || '').trim().toLowerCase();

  const orderedMembers = useMemo(() => {
    const list = Array.isArray(members) ? [...members] : [];
    return list.sort((a, b) => {
      const aIsCaptain = (a?.id != null && captainUserId != null && String(a.id) === String(captainUserId))
        || String(a?.role || '').toLowerCase() === 'captain';
      const bIsCaptain = (b?.id != null && captainUserId != null && String(b.id) === String(captainUserId))
        || String(b?.role || '').toLowerCase() === 'captain';

      if (aIsCaptain && !bIsCaptain) {
        return -1;
      }

      if (!aIsCaptain && bIsCaptain) {
        return 1;
      }

      return String(a?.gamerTag || a?.username || '').localeCompare(String(b?.gamerTag || b?.username || ''));
    });
  }, [members, captainUserId]);

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

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return orderedMembers;
    }

    return orderedMembers.filter((member) => {
      const username = String(member?.username || '').toLowerCase();
      const gamerTag = String(member?.gamerTag || '').toLowerCase();
      const role = String(member?.role || '').toLowerCase();
      const status = String(member?.status || '').toLowerCase();
      return username.includes(query)
        || gamerTag.includes(query)
        || role.includes(query)
        || status.includes(query);
    });
  }, [orderedMembers, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, pageSize, members, captainUserId]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedMembers = filteredMembers.slice(start, start + pageSize);

  return (
    <div className="table-shell">
      <div className="roster-toolbar">
        <label className="roster-search-field">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by username, role, status"
          />
        </label>

        <label className="roster-page-size-field">
          Rows
          <select value={String(pageSize)} onChange={(event) => setPageSize(Number(event.target.value))}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
      </div>

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
          {pagedMembers.map((member) => {
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

      <div className="roster-pagination-row">
        <span>Showing {filteredMembers.length === 0 ? 0 : start + 1}-{Math.min(start + pageSize, filteredMembers.length)} of {filteredMembers.length}</span>
        <div className="roster-pagination-controls">
          <button type="button" className="ghost-btn" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage <= 1}>Previous</button>
          <span>Page {safePage} / {totalPages}</span>
          <button type="button" className="ghost-btn" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={safePage >= totalPages}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default TeamRoster;
