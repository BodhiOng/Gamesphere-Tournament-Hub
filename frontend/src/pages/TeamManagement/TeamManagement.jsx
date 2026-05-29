import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamRoster from '../../components/TeamRoster/TeamRoster';
import { addTeamMember, assignTeamCaptain, createTeam, deleteTeam, getTeamRoster, leaveTeam, removeTeamMember, renameTeam } from '../../api/teamApi';
import { useAuth } from '../../context/AuthContext';

function TeamManagement() {
  const [members, setMembers] = useState([]);
  const [teamInfo, setTeamInfo] = useState({ teamId: null, teamName: '', captainUserId: null });
  const [teamName, setTeamName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [memberUsername, setMemberUsername] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [savingAction, setSavingAction] = useState('');
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const teamLabel = useMemo(() => teamInfo.teamName || user?.teamName || user?.team || user?.currentTeam || '', [teamInfo.teamName, user]);
  const isAssigned = Boolean(teamLabel);
  const isCaptain = Boolean(user?.id && teamInfo.captainUserId === user.id);

  useEffect(() => {
    if (!isAssigned) {
      setRenameValue('');
      return;
    }

    setRenameValue(teamLabel);
  }, [isAssigned, teamLabel]);

  useEffect(() => {
    if (!user || !isAssigned) {
      setMembers([]);
      setTeamInfo({ teamId: null, teamName: '', captainUserId: null });
      return;
    }

    let ignore = false;

    getTeamRoster(user)
      .then((result) => {
        if (!ignore) {
          setMembers(result.members || []);
          setTeamInfo({
            teamId: result.teamId,
            teamName: result.teamName,
            captainUserId: result.captainUserId,
          });
        }
      })
      .catch(() => {
        if (!ignore) {
          setMembers([]);
          setTeamInfo({ teamId: null, teamName: '', captainUserId: null });
        }
      });

    return () => {
      ignore = true;
    };

  }, [user, isAssigned]);

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setError('');
    if (!user) return;

    const trimmed = teamName.trim();
    if (!trimmed) {
      setError('Please enter a team name.');
      return;
    }

    setCreating(true);
    try {
      const created = await createTeam(user, trimmed);
      const resolvedName = created?.name || trimmed;
      const nextUser = {
        ...user,
        teamName: resolvedName,
        team: resolvedName,
        currentTeam: resolvedName,
        teamId: created?.id ?? user.teamId,
      };

      updateUser(nextUser);
      setTeamName('');

      const roster = await getTeamRoster(nextUser);
      setMembers(roster.members || []);
      setTeamInfo({
        teamId: roster.teamId,
        teamName: roster.teamName || resolvedName,
        captainUserId: roster.captainUserId ?? (created?.captainUserId ?? user.id ?? null),
      });
    } catch (err) {
      setError(err?.message || 'Failed to create team.');
    } finally {
      setCreating(false);
    }
  };

  const refreshRoster = async (activeUser = user) => {
    if (!activeUser) return;
    const roster = await getTeamRoster(activeUser);
    setMembers(roster.members || []);
    setTeamInfo({
      teamId: roster.teamId,
      teamName: roster.teamName,
      captainUserId: roster.captainUserId,
    });
  };

  const onAddMember = async (event) => {
    event.preventDefault();
    setError('');
    if (!user) return;

    setSavingAction('add');
    try {
      await addTeamMember(user, memberUsername);
      setMemberUsername('');
      await refreshRoster(user);
    } catch (err) {
      setError(err?.message || 'Failed to add member.');
    } finally {
      setSavingAction('');
    }
  };

  const onRemoveMember = async (username) => {
    setError('');
    if (!user) return;

    setSavingAction(`remove:${username}`);
    try {
      await removeTeamMember(user, username);
      await refreshRoster(user);
    } catch (err) {
      setError(err?.message || 'Failed to remove member.');
    } finally {
      setSavingAction('');
    }
  };

  const onAssignCaptain = async (username) => {
    setError('');
    if (!user) return;

    setSavingAction(`captain:${username}`);
    try {
      await assignTeamCaptain(user, username);
      await refreshRoster(user);
    } catch (err) {
      setError(err?.message || 'Failed to assign captain.');
    } finally {
      setSavingAction('');
    }
  };

  const onLeaveTeam = async () => {
    setError('');
    if (!user) return;

    if (isCaptain) {
      setError('Assign another team member as captain before leaving the team.');
      return;
    }

    setSavingAction('leave');
    try {
      await leaveTeam(user);
      updateUser({
        ...user,
        teamName: '',
        team: '',
        currentTeam: '',
        teamId: null,
      });
      setMembers([]);
      setTeamInfo({ teamId: null, teamName: '', captainUserId: null });
    } catch (err) {
      setError(err?.message || 'Failed to leave team.');
    } finally {
      setSavingAction('');
    }
  };

  const onRenameTeam = async (event) => {
    event.preventDefault();
    setError('');
    if (!user) return;

    if (!isCaptain) {
      setError('Only the captain can rename the team.');
      return;
    }

    setSavingAction('rename');
    try {
      const renamed = await renameTeam(user, renameValue);
      const resolvedName = renamed?.name || renameValue.trim();
      updateUser({
        ...user,
        teamName: resolvedName,
        team: resolvedName,
        currentTeam: resolvedName,
      });
      setTeamInfo((current) => ({
        ...current,
        teamName: resolvedName,
      }));
      setRenameValue(resolvedName);
    } catch (err) {
      setError(err?.message || 'Failed to rename team.');
    } finally {
      setSavingAction('');
    }
  };

  const onDeleteTeam = async () => {
    setError('');
    if (!user) return;

    if (!isCaptain) {
      setError('Only the captain can delete the team.');
      return;
    }

    setSavingAction('delete');
    try {
      await deleteTeam(user);
      updateUser({
        ...user,
        teamName: '',
        team: '',
        currentTeam: '',
        teamId: null,
      });
      setMembers([]);
      setTeamInfo({ teamId: null, teamName: '', captainUserId: null });
      setRenameValue('');
      setMemberUsername('');
    } catch (err) {
      setError(err?.message || 'Failed to delete team.');
    } finally {
      setSavingAction('');
    }
  };

  return (
    <section className="team-management-page">
      {!isAssigned ? (
        <article className="surface-card team-empty-card" style={{ marginTop: '1rem' }}>
          <div className="team-empty-state">
            <div className="team-empty-state-copy">
              <h3>You're not assigned to any team</h3>
              <p>
                Create a team to start inviting players and managing your roster.
              </p>
            </div>

            <form onSubmit={handleCreateTeam} className="team-empty-form">
              <label>
                Team name
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter a team name" />
              </label>
              <div className="cta-row">
                <button type="submit" className="primary-btn team-empty-submit" disabled={creating}>{creating ? 'Creating...' : 'Create Team'}</button>
              </div>
            </form>

            {error && <p className="error-text team-empty-error">{error}</p>}
          </div>
        </article>
      ) : null}

      {isAssigned ? (
        <article className="surface-card team-summary-card" style={{ marginTop: '1rem' }}>
          <div className="team-summary-content">
            <div className="team-action-panel">
              {isCaptain ? (
                <>
                  <form onSubmit={onRenameTeam} className="team-action-row">
                    <label className="team-inline-field">
                      Team name
                      <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="Enter a team name" />
                    </label>
                    <button type="submit" className="primary-btn" disabled={savingAction === 'rename'}>
                      {savingAction === 'rename' ? 'Saving...' : 'Rename Team'}
                    </button>
                  </form>

                  <form onSubmit={onAddMember} className="team-action-row">
                    <label className="team-inline-field">
                      Add member by username
                      <input value={memberUsername} onChange={(e) => setMemberUsername(e.target.value)} placeholder="Enter username" />
                    </label>
                    <button type="submit" className="primary-btn" disabled={savingAction === 'add'}>
                      {savingAction === 'add' ? 'Adding...' : 'Add Member'}
                    </button>
                  </form>

                  <div className="team-action-row team-action-row-end">
                    <button type="button" className="ghost-btn danger-btn" onClick={onLeaveTeam} disabled={savingAction === 'leave'}>
                      {savingAction === 'leave' ? 'Leaving...' : 'Leave Team'}
                    </button>
                    <button type="button" className="ghost-btn danger-btn" onClick={onDeleteTeam} disabled={savingAction === 'delete'}>
                      {savingAction === 'delete' ? 'Deleting...' : 'Delete Team'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="team-summary-note">
                  <p>Only the captain can add/remove members or assign a new captain.</p>
                  <button type="button" className="ghost-btn danger-btn" onClick={onLeaveTeam} disabled={savingAction === 'leave'}>
                    {savingAction === 'leave' ? 'Leaving...' : 'Leave Team'}
                  </button>
                </div>
              )}
            </div>

            {error ? <p className="error-text" style={{ marginTop: '0.85rem' }}>{error}</p> : null}

            <div className="team-roster-block">
              <h3>Roster Table</h3>
              {members.length > 0 ? (
                <TeamRoster
                  members={members}
                  captainUserId={teamInfo.captainUserId}
                  canManage={isCaptain}
                  savingAction={savingAction}
                  currentUserId={user?.id ?? null}
                  currentUsername={user?.username ?? user?.gamerTag ?? ''}
                  onRemoveMember={onRemoveMember}
                  onAssignCaptain={onAssignCaptain}
                />
              ) : <p style={{ marginTop: '0.5rem' }}>No roster members available right now.</p>}
            </div>
          </div>
        </article>
      ) : null}
    </section>
  );
}

export default TeamManagement;