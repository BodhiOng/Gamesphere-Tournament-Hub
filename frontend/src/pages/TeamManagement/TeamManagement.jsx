import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamRoster from '../../components/TeamRoster/TeamRoster';
import {
  addTeamMember,
  approveTeamJoinRequest,
  assignTeamCaptain,
  createTeam,
  deleteTeam,
  discoverTeams,
  getMyTeams,
  getTeamJoinRequests,
  getTeamRoster,
  leaveTeam,
  rejectTeamJoinRequest,
  removeTeamMember,
  renameTeam,
  requestTeamJoin,
  updateTeamProfile,
} from '../../api/teamApi';
import { useAuth } from '../../context/AuthContext';

function TeamManagement() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [enlistedSearch, setEnlistedSearch] = useState('');
  const [enlistedPage, setEnlistedPage] = useState(0);
  const ENLISTED_COLS = 3;
  const [myTeams, setMyTeams] = useState([]);
  const [discoverFeed, setDiscoverFeed] = useState([]);
  const [canRequestJoin, setCanRequestJoin] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamInfo, setTeamInfo] = useState({
    teamId: null,
    teamName: '',
    teamLogoUrl: '',
    teamDescription: '',
    preferredGames: [],
    enlistedTournaments: [],
    captainUserId: null,
  });
  const [teamName, setTeamName] = useState('');
  const [joinTeamName, setJoinTeamName] = useState('');
  const [joinRequestMessage, setJoinRequestMessage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [preferredGamesInput, setPreferredGamesInput] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [memberUsername, setMemberUsername] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [savingAction, setSavingAction] = useState('');
  const { user, updateUser } = useAuth();

  const teamLabel = useMemo(() => teamInfo.teamName || user?.teamName || user?.team || user?.currentTeam || '', [teamInfo.teamName, user]);
  const isAssigned = Boolean(teamLabel);
  const isCaptain = Boolean(user?.id && teamInfo.captainUserId === user.id);
  const activeTeamId = teamInfo.teamId ?? selectedTeamId ?? null;

  useEffect(() => {
    if (!isAssigned) {
      setRenameValue('');
      return;
    }

    setRenameValue(teamLabel);
  }, [isAssigned, teamLabel]);

  useEffect(() => {
    if (!isAssigned) {
      setLogoUrl('');
      setDescription('');
      setPreferredGamesInput('');
      return;
    }

    setLogoUrl(teamInfo.teamLogoUrl || '');
    setDescription(teamInfo.teamDescription || '');
    setPreferredGamesInput(Array.isArray(teamInfo.preferredGames) ? teamInfo.preferredGames.join(', ') : '');
  }, [isAssigned, teamInfo.teamLogoUrl, teamInfo.teamDescription, teamInfo.preferredGames]);

  useEffect(() => {
    if (!user || !isAssigned) {
      setMembers([]);
      setTeamInfo({ teamId: null, teamName: '', captainUserId: null });
      return;
    }

    let ignore = false;

    getTeamRoster(user, selectedTeamId)
      .then((result) => {
        if (!ignore) {
          setMembers(result.members || []);
          setTeamInfo({
            teamId: result.teamId,
            teamName: result.teamName,
            teamLogoUrl: result.teamLogoUrl || '',
            teamDescription: result.teamDescription || '',
            preferredGames: Array.isArray(result.preferredGames) ? result.preferredGames : [],
            enlistedTournaments: Array.isArray(result.enlistedTournaments) ? result.enlistedTournaments : [],
            captainUserId: result.captainUserId,
          });
          setSelectedTeamId(result.teamId ?? null);
        }
      })
      .catch(() => {
        if (!ignore) {
          setMembers([]);
          setTeamInfo({
            teamId: null,
            teamName: '',
            teamLogoUrl: '',
            teamDescription: '',
            preferredGames: [],
            enlistedTournaments: [],
            captainUserId: null,
          });
          setSelectedTeamId(null);
        }
      });

    return () => {
      ignore = true;
    };

  }, [user, isAssigned, selectedTeamId]);

  useEffect(() => {
    if (!user) {
      setMyTeams([]);
      setDiscoverFeed([]);
      setCanRequestJoin(false);
      return;
    }

    let ignore = false;
    getMyTeams(user)
      .then((teams) => {
        if (!ignore) {
          setMyTeams(teams);
          if (teams.length === 0) {
            setSelectedTeamId(null);
            return;
          }

          if (selectedTeamId != null && teams.some((team) => team.id === selectedTeamId)) {
            return;
          }

          setSelectedTeamId(teams[0].id);
        }
      })
      .catch(() => {
        if (!ignore) {
          setMyTeams([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, [user, teamInfo.teamId, selectedTeamId]);

  useEffect(() => {
    if (!user) {
      setDiscoverFeed([]);
      setCanRequestJoin(false);
      return;
    }

    let ignore = false;
    discoverTeams(user)
      .then((result) => {
        if (!ignore) {
          setDiscoverFeed(Array.isArray(result?.teams) ? result.teams : []);
          setCanRequestJoin(Boolean(result?.canRequestJoin));
        }
      })
      .catch(() => {
        if (!ignore) {
          setDiscoverFeed([]);
          setCanRequestJoin(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [user, myTeams.length, selectedTeamId]);

  useEffect(() => {
    if (!user || !isCaptain || activeTeamId == null) {
      setJoinRequests([]);
      return;
    }

    let ignore = false;
    getTeamJoinRequests(user, activeTeamId)
      .then((items) => {
        if (!ignore) {
          setJoinRequests(Array.isArray(items) ? items : []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setJoinRequests([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, [user, isCaptain, activeTeamId, savingAction]);

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
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
        teamLogoUrl: roster.teamLogoUrl || '',
        teamDescription: roster.teamDescription || '',
        preferredGames: Array.isArray(roster.preferredGames) ? roster.preferredGames : [],
        enlistedTournaments: Array.isArray(roster.enlistedTournaments) ? roster.enlistedTournaments : [],
        captainUserId: roster.captainUserId ?? (created?.captainUserId ?? user.id ?? null),
      });
      setSelectedTeamId(roster.teamId ?? created?.id ?? null);
      const teams = await getMyTeams(nextUser);
      setMyTeams(teams);
      const discover = await discoverTeams(nextUser);
      setDiscoverFeed(discover.teams || []);
      setCanRequestJoin(Boolean(discover.canRequestJoin));
    } catch (err) {
      setError(err?.message || 'Failed to create team.');
    } finally {
      setCreating(false);
    }
  };

  const refreshRoster = async (activeUser = user, requestedTeamId = selectedTeamId) => {
    if (!activeUser) return;
    const [roster, teams, discover] = await Promise.all([
      getTeamRoster(activeUser, requestedTeamId),
      getMyTeams(activeUser),
      discoverTeams(activeUser),
    ]);
    setMembers(roster.members || []);
    setTeamInfo({
      teamId: roster.teamId,
      teamName: roster.teamName,
      teamLogoUrl: roster.teamLogoUrl || '',
      teamDescription: roster.teamDescription || '',
      preferredGames: Array.isArray(roster.preferredGames) ? roster.preferredGames : [],
      enlistedTournaments: Array.isArray(roster.enlistedTournaments) ? roster.enlistedTournaments : [],
      captainUserId: roster.captainUserId,
    });
    setSelectedTeamId(roster.teamId ?? null);
    setMyTeams(teams);
    setDiscoverFeed(discover.teams || []);
    setCanRequestJoin(Boolean(discover.canRequestJoin));
    return { roster, teams, discover };
  };

  const onSelectTeam = async (teamId) => {
    setError('');
    setNotice('');
    if (!user) return;

    setSelectedTeamId(teamId);
    try {
      await refreshRoster(user, teamId);
    } catch {
      setError('Failed to load the selected team roster.');
    }
  };

  const onAddMember = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!user) return;

    setSavingAction('add');
    try {
      await addTeamMember(user, memberUsername, activeTeamId);
      setMemberUsername('');
      await refreshRoster(user, activeTeamId);
    } catch (err) {
      setError(err?.message || 'Failed to add member.');
    } finally {
      setSavingAction('');
    }
  };

  const onRemoveMember = async (username) => {
    setError('');
    setNotice('');
    if (!user) return;

    setSavingAction(`remove:${username}`);
    try {
      await removeTeamMember(user, username, activeTeamId);
      await refreshRoster(user, activeTeamId);
    } catch (err) {
      setError(err?.message || 'Failed to remove member.');
    } finally {
      setSavingAction('');
    }
  };

  const onAssignCaptain = async (username) => {
    setError('');
    setNotice('');
    if (!user) return;

    setSavingAction(`captain:${username}`);
    try {
      await assignTeamCaptain(user, username, activeTeamId);
      await refreshRoster(user, activeTeamId);
    } catch (err) {
      setError(err?.message || 'Failed to assign captain.');
    } finally {
      setSavingAction('');
    }
  };

  const onLeaveTeam = async () => {
    setError('');
    setNotice('');
    if (!user) return;

    if (isCaptain) {
      setError('Assign another team member as captain before leaving the team.');
      return;
    }

    setSavingAction('leave');
    try {
      await leaveTeam(user, activeTeamId);
      const { roster } = await refreshRoster(user);
      updateUser({
        ...user,
        teamName: roster.teamName || '',
        team: roster.teamName || '',
        currentTeam: roster.teamName || '',
        teamId: roster.teamId ?? null,
      });
    } catch (err) {
      setError(err?.message || 'Failed to leave team.');
    } finally {
      setSavingAction('');
    }
  };

  const onRenameTeam = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!user) return;

    if (!isCaptain) {
      setError('Only the captain can rename the team.');
      return;
    }

    setSavingAction('rename');
    try {
      const renamed = await renameTeam(user, renameValue, activeTeamId);
      const resolvedName = renamed?.name || renameValue.trim();
      if ((user?.teamId ?? null) === activeTeamId) {
        updateUser({
          ...user,
          teamName: resolvedName,
          team: resolvedName,
          currentTeam: resolvedName,
        });
      }
      setTeamInfo((current) => ({
        ...current,
        teamName: resolvedName,
      }));
      setRenameValue(resolvedName);
      const teams = await getMyTeams(user);
      setMyTeams(teams);
      setNotice('Team renamed successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to rename team.');
    } finally {
      setSavingAction('');
    }
  };

  const onSaveTeamProfile = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!user) return;

    if (!isCaptain) {
      setError('Only the captain can update team profile details.');
      return;
    }

    setSavingAction('profile');
    try {
      await updateTeamProfile(user, {
        logoUrl,
        description,
        preferredGames: preferredGamesInput,
      }, activeTeamId);
      await refreshRoster(user, activeTeamId);
      setNotice('Team profile updated.');
    } catch (err) {
      setError(err?.message || 'Failed to update team profile.');
    } finally {
      setSavingAction('');
    }
  };

  const onRequestJoinByName = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!user) return;

    const teamNameValue = joinTeamName.trim();
    if (!teamNameValue) {
      setError('Enter a team name to request joining.');
      return;
    }

    setSavingAction('joinByName');
    try {
      await requestTeamJoin(user, {
        teamName: teamNameValue,
        message: joinRequestMessage,
      });
      setJoinTeamName('');
      setJoinRequestMessage('');
      setNotice('Your request will be reviewed by the team captain.');
      const discover = await discoverTeams(user);
      setDiscoverFeed(discover.teams || []);
      setCanRequestJoin(Boolean(discover.canRequestJoin));
    } catch (err) {
      setError(err?.message || 'Failed to send join request.');
    } finally {
      setSavingAction('');
    }
  };

  const onRequestJoinFromFeed = async (teamId) => {
    setError('');
    setNotice('');
    if (!user) return;

    setSavingAction(`join:${teamId}`);
    try {
      await requestTeamJoin(user, {
        teamId,
        message: joinRequestMessage,
      });
      setNotice('Your request will be reviewed by the team captain.');
      const discover = await discoverTeams(user);
      setDiscoverFeed(discover.teams || []);
      setCanRequestJoin(Boolean(discover.canRequestJoin));
    } catch (err) {
      setError(err?.message || 'Failed to send join request.');
    } finally {
      setSavingAction('');
    }
  };

  const onReviewJoinRequest = async (requestId, action) => {
    setError('');
    setNotice('');
    if (!user) return;

    const token = `${action}:${requestId}`;
    setSavingAction(token);
    try {
      if (action === 'approve') {
        await approveTeamJoinRequest(user, requestId, activeTeamId);
      } else {
        await rejectTeamJoinRequest(user, requestId, activeTeamId);
      }

      await refreshRoster(user, activeTeamId);
      const requests = await getTeamJoinRequests(user, activeTeamId);
      setJoinRequests(requests);
      setNotice(`Join request ${action}d successfully.`);
    } catch (err) {
      setError(err?.message || 'Failed to review join request.');
    } finally {
      setSavingAction('');
    }
  };

  const onDeleteTeam = async () => {
    setError('');
    setNotice('');
    if (!user) return;

    if (!isCaptain) {
      setError('Only the captain can delete the team.');
      return;
    }

    setSavingAction('delete');
    try {
      await deleteTeam(user, activeTeamId);
      const { roster } = await refreshRoster(user);
      updateUser({
        ...user,
        teamName: roster.teamName || '',
        team: roster.teamName || '',
        currentTeam: roster.teamName || '',
        teamId: roster.teamId ?? null,
      });
      setRenameValue('');
      setMemberUsername('');
      setNotice('Team deleted.');
    } catch (err) {
      setError(err?.message || 'Failed to delete team.');
    } finally {
      setSavingAction('');
    }
  };

  return (
    <section className="team-management-page">
      <article className="surface-card" style={{ marginTop: '1rem' }}>
        <h3>My Teams</h3>
        {myTeams.length === 0 ? (
          <p style={{ marginTop: '0.55rem' }}>You are not enrolled in any teams yet.</p>
        ) : (
          <div className="my-teams-list" style={{ marginTop: '0.7rem' }}>
            {myTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                className={`my-teams-chip ${activeTeamId === team.id ? 'is-active' : ''}`}
                onClick={() => onSelectTeam(team.id)}
              >
                {team.name}
                {team.isCaptain ? ' (Captain)' : ''}
              </button>
            ))}
          </div>
        )}
      </article>

      {notice ? (
        <article className="surface-card" style={{ marginTop: '1rem' }}>
          <p className="team-notice-text">{notice}</p>
        </article>
      ) : null}

      {!isAssigned ? (
        <article className="surface-card team-empty-card" style={{ marginTop: '1rem' }}>
          <div className="team-empty-state">
            <div className="team-empty-state-copy">
              <h3>You're not assigned to any team</h3>
              <p>
                Create a team or request to join an existing team.
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

            <form onSubmit={onRequestJoinByName} className="team-empty-form">
              <label>
                Join team by name
                <input
                  value={joinTeamName}
                  onChange={(e) => setJoinTeamName(e.target.value)}
                  placeholder="Enter exact team name"
                  disabled={!canRequestJoin || savingAction === 'joinByName'}
                />
              </label>
              <label>
                Optional join request message
                <input
                  value={joinRequestMessage}
                  onChange={(e) => setJoinRequestMessage(e.target.value)}
                  placeholder="Tell the captain why you want to join"
                  disabled={!canRequestJoin || savingAction === 'joinByName'}
                />
              </label>
              <div className="cta-row">
                <button type="submit" className="primary-btn team-empty-submit" disabled={!canRequestJoin || savingAction === 'joinByName'}>
                  {savingAction === 'joinByName' ? 'Requesting...' : 'Request to Join'}
                </button>
              </div>
              {!canRequestJoin ? (
                <p className="team-join-disabled-note">Join requests are available only when you are not enrolled in any team.</p>
              ) : null}
            </form>

            <div className="team-discover-block">
              <h3>Browse Existing Teams</h3>
              <div className="team-discover-grid">
                {discoverFeed.map((team) => (
                  <article key={team.id} className="team-discover-card">
                    <div className="team-discover-header">
                      <h4>{team.name}</h4>
                      <span>{team.memberCount} members</span>
                    </div>
                    {team.description ? <p>{team.description}</p> : <p>No description yet.</p>}
                    {team.preferredGames.length > 0 ? (
                      <p>Preferred games: {team.preferredGames.join(', ')}</p>
                    ) : null}
                    {team.enlistedTournaments.length > 0 ? (
                      <p>Enlisted tournaments: {team.enlistedTournaments.map((entry) => entry.name).join(', ')}</p>
                    ) : null}

                    <button
                      type="button"
                      className="ghost-btn"
                      disabled={!canRequestJoin || team.hasPendingRequest || savingAction === `join:${team.id}`}
                      onClick={() => onRequestJoinFromFeed(team.id)}
                    >
                      {team.hasPendingRequest
                        ? 'Request Pending'
                        : savingAction === `join:${team.id}`
                          ? 'Requesting...'
                          : 'Join Team'}
                    </button>
                  </article>
                ))}
              </div>
            </div>

            {error && <p className="error-text team-empty-error">{error}</p>}
          </div>
        </article>
      ) : null}

      {error ? <p className="error-text" style={{ marginTop: '0.85rem' }}>{error}</p> : null}

      {isAssigned ? (
        <article className="surface-card team-profile-card" style={{ marginTop: '1rem' }}>
          <div className={`team-profile-preview ${!isCaptain ? 'is-member-scroll' : ''}`}>
            {teamInfo.teamLogoUrl ? <img src={teamInfo.teamLogoUrl} alt={`${teamInfo.teamName} logo`} /> : null}
            <div>
              <h4>{teamInfo.teamName || 'Team'}</h4>
              <p>{teamInfo.teamDescription || 'No team description yet.'}</p>
              {teamInfo.preferredGames.length > 0 ? (
                <p style={{ marginTop: '0.5rem' }}><strong>Preferred games:</strong> {teamInfo.preferredGames.join(', ')}</p>
              ) : null}
            </div>
          </div>
          {!isCaptain ? (
            <div className="team-roster-inline-note">
              <p>Only captains can add/remove members or assign a new captain.</p>
              <button type="button" className="ghost-btn danger-btn" onClick={onLeaveTeam} disabled={savingAction === 'leave'}>
                {savingAction === 'leave' ? 'Leaving...' : 'Leave Team'}
              </button>
            </div>
          ) : null}
        </article>
      ) : null}

      {isAssigned && isCaptain ? (
        <div className="surface-card team-action-panel-card" style={{ marginTop: '1rem' }}>
          <div className="team-action-panel">
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

            <form onSubmit={onSaveTeamProfile} className="team-profile-form">
                    <label className="team-inline-field">
                      Team logo URL
                      <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
                    </label>
                    <label className="team-inline-field">
                      Team description
                      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your team" />
                    </label>
                    <label className="team-inline-field">
                      Preferred games (comma separated)
                      <input value={preferredGamesInput} onChange={(e) => setPreferredGamesInput(e.target.value)} placeholder="Valorant, CS2, Apex" />
                    </label>
                    <div className="team-action-row team-action-row-end">
                      <button type="submit" className="primary-btn" disabled={savingAction === 'profile'}>
                        {savingAction === 'profile' ? 'Saving...' : 'Save Team Profile'}
                      </button>
                    </div>
            </form>

            <div className="team-requests-block">
                <h4>Join Requests</h4>
                {joinRequests.length === 0 ? (
                  <p>No pending join requests.</p>
                ) : (
                  <div className="team-requests-list">
                    {joinRequests.map((request) => (
                      <article key={request.id} className="team-request-row">
                        <div>
                          <strong>{request.requesterUsername}</strong>
                          <p>{request.requesterEmail}</p>
                          {request.message ? <p>{request.message}</p> : null}
                        </div>
                        <div className="team-request-actions">
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => onReviewJoinRequest(request.id, 'approve')}
                            disabled={savingAction === `approve:${request.id}` || savingAction === `reject:${request.id}`}
                          >
                            {savingAction === `approve:${request.id}` ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="ghost-btn danger-btn"
                            onClick={() => onReviewJoinRequest(request.id, 'reject')}
                            disabled={savingAction === `approve:${request.id}` || savingAction === `reject:${request.id}`}
                          >
                            {savingAction === `reject:${request.id}` ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
            </div>

            <div className="team-action-row team-action-row-end">
                <button type="button" className="ghost-btn danger-btn" onClick={onLeaveTeam} disabled={savingAction === 'leave'}>
                  {savingAction === 'leave' ? 'Leaving...' : 'Leave Team'}
                </button>
                <button type="button" className="ghost-btn danger-btn" onClick={onDeleteTeam} disabled={savingAction === 'delete'}>
                  {savingAction === 'delete' ? 'Deleting...' : 'Delete Team'}
                </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAssigned ? (
        <article className="surface-card team-roster-card" style={{ marginTop: '1rem' }}>
          <h3>Roster Table</h3>
          <p className="team-roster-context">
            Viewing roster for: <strong>{teamInfo.teamName || 'No team selected'}</strong>
          </p>
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
        </article>
      ) : null}

      {isAssigned ? (() => {
        const filteredEnlisted = teamInfo.enlistedTournaments.filter((entry) =>
          entry.name.toLowerCase().includes(enlistedSearch.toLowerCase().trim())
        );
        const totalEnlistedPages = Math.max(1, Math.ceil(filteredEnlisted.length / ENLISTED_COLS));
        const safeEnlistedPage = Math.min(enlistedPage, totalEnlistedPages - 1);
        const enlistedSlice = filteredEnlisted.slice(
          safeEnlistedPage * ENLISTED_COLS,
          safeEnlistedPage * ENLISTED_COLS + ENLISTED_COLS
        );

        return (
          <article className="surface-card team-enlisted-card" style={{ marginTop: '1rem' }}>
            <div className="team-enlisted-header">
              <h3>Enlisted Tournaments</h3>
              <label className="team-enlisted-search-field">
                <input
                  type="text"
                  value={enlistedSearch}
                  onChange={(e) => { setEnlistedSearch(e.target.value); setEnlistedPage(0); }}
                  placeholder="Search tournaments..."
                />
              </label>
            </div>

            {filteredEnlisted.length === 0 ? (
              <p style={{ marginTop: '0.6rem' }}>
                {teamInfo.enlistedTournaments.length === 0 ? 'No tournament enlistments yet.' : 'No tournaments match your search.'}
              </p>
            ) : (
              <div className="team-enlisted-carousel">
                <button
                  type="button"
                  className="ghost-btn team-enlisted-nav"
                  onClick={() => setEnlistedPage((p) => Math.max(0, p - 1))}
                  disabled={safeEnlistedPage === 0}
                  aria-label="Previous tournaments"
                >
                  &#8249;
                </button>

                <div className="team-enlisted-grid">
                  {enlistedSlice.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="team-enlisted-cell"
                      onClick={() => navigate(`/tournaments/${entry.id}`)}
                    >
                      <div className="team-enlisted-cell-img">
                        {entry.image
                          ? <img src={entry.image} alt={entry.name} />
                          : <span className="team-enlisted-cell-no-img">?</span>}
                      </div>
                      <span className="team-enlisted-cell-name">{entry.name}</span>
                      <span className="team-enlisted-cell-desc">
                        {entry.description?.trim() || 'No description available.'}
                      </span>
                      <span className={`team-enlisted-status ${entry.approved ? 'is-approved' : 'is-pending'}`}>
                        {entry.approved ? 'Approved' : 'Pending'}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="ghost-btn team-enlisted-nav"
                  onClick={() => setEnlistedPage((p) => Math.min(totalEnlistedPages - 1, p + 1))}
                  disabled={safeEnlistedPage >= totalEnlistedPages - 1}
                  aria-label="Next tournaments"
                >
                  &#8250;
                </button>
              </div>
            )}

            {filteredEnlisted.length > 0 ? (
              <p className="team-enlisted-page-indicator">
                Page {safeEnlistedPage + 1} / {totalEnlistedPages}
              </p>
            ) : null}
          </article>
        );
      })() : null}
    </section>
  );
}

export default TeamManagement;