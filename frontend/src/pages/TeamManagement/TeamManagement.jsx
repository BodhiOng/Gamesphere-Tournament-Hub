import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamRoster from '../../components/TeamRoster/TeamRoster';
import { getTeamRoster } from '../../api/teamApi';
import { useAuth } from '../../context/AuthContext';

function TeamManagement() {
  const [members, setMembers] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [teamMessage, setTeamMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const teamLabel = useMemo(() => user?.teamName || user?.team || user?.currentTeam || '', [user]);
  const isAssigned = Boolean(teamLabel);

  useEffect(() => {
    getTeamRoster().then(setMembers);
  }, []);

  const handleCreateTeam = (event) => {
    event.preventDefault();
    const trimmed = teamName.trim();
    if (!trimmed) return;

    setTeamMessage(`Team "${trimmed}" is ready to create once team creation is connected to the backend.`);
  };

  return (
    <section>
      <h2>Team Management</h2>

      {!isAssigned ? (
        <article className="surface-card" style={{ marginTop: '1rem' }}>
          <h3>You're not assigned to any team</h3>
          <p style={{ marginTop: '0.5rem' }}>
            Create a team to start inviting players and managing your roster.
          </p>

          <form onSubmit={handleCreateTeam} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem', maxWidth: '420px' }}>
            <label>
              Team name
              <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter a team name" />
            </label>
            <div className="cta-row">
              <button type="submit" className="primary-btn">Create Team</button>
              <button type="button" className="ghost-btn" onClick={() => navigate('/profile')}>View Profile</button>
            </div>
          </form>

          {teamMessage && <p className="success-text" style={{ marginTop: '0.85rem' }}>{teamMessage}</p>}
        </article>
      ) : (
        <div className="grid two">
          <article className="surface-card">
            <h3>Team Overview</h3>
            <p>Team: {teamLabel}</p>
            <p>Manage members and coordination from this section.</p>
          </article>

          <article className="surface-card">
            <h3>Team Actions</h3>
            <ul className="detail-list">
              <li>Invite players</li>
              <li>Remove members</li>
              <li>Assign captain</li>
              <li>Review roster updates</li>
            </ul>
          </article>
        </div>
      )}

      <article className="surface-card">
        <h3>Roster Table</h3>
        {members.length > 0 ? <TeamRoster members={members} /> : <p style={{ marginTop: '0.5rem' }}>No roster members available right now.</p>}
      </article>
    </section>
  );
}

export default TeamManagement;
