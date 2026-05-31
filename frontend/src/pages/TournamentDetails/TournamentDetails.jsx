import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeaderboardTable from '../../components/LeaderboardTable/LeaderboardTable';
import { getLeaderboard } from '../../api/leaderboardApi';
import {
  getTournamentById,
  deleteTournament,
  registerTeamForTournament,
  leaveTeamFromTournament,
  getTournamentRegistrations,
} from '../../api/tournamentApi';
import { getMyTeams } from '../../api/teamApi';
import DeleteConfirm from '../../components/DeleteConfirm/DeleteConfirm';
import { useAuth } from '../../context/AuthContext';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <p style={{ margin: '0.25rem 0' }}>
      <span style={{ color: 'var(--muted)', marginRight: '0.4rem' }}>{label}:</span>
      <span>{value}</span>
    </p>
  );
}

function TournamentDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [registering, setRegistering] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getTournamentById(id).then(setTournament);
    getTournamentRegistrations(id).then(setRegistrations);
  }, [id]);

  useEffect(() => {
    const status = String(tournament?.status || '').trim().toLowerCase();
    if (!tournament || status === 'open') {
      setLeaderboard([]);
      return;
    }
    getLeaderboard().then(setLeaderboard);
  }, [tournament]);

  useEffect(() => {
    if (!user) return;
    getMyTeams(user).then((teams) => {
      const captainTeams = teams.filter((t) => t.isCaptain);
      setMyTeams(captainTeams);
      if (captainTeams.length > 0) {
        setSelectedTeamId(String(captainTeams[0].id));
      }
    });
  }, [user]);

  const registeredTeamIds = useMemo(
    () => new Set(registrations.map((r) => r.teamId)),
    [registrations],
  );

  const canSeeVenue = useMemo(() => {
    const status = String(tournament?.status || '').trim().toLowerCase();
    if (status !== 'open' || !myTeams.length || !registeredTeamIds.size) {
      return false;
    }

    return myTeams.some((team) => registeredTeamIds.has(team.id));
  }, [myTeams, registeredTeamIds, tournament]);

  const selectedAlreadyRegistered = useMemo(
    () => Boolean(selectedTeamId && registeredTeamIds.has(Number(selectedTeamId))),
    [selectedTeamId, registeredTeamIds],
  );

  async function handleRegister() {
    if (!selectedTeamId) return;
    setRegistering(true);
    setRegisterError('');
    setRegisterSuccess('');
    try {
      await registerTeamForTournament(id, {
        actorUserId: user?.id ?? null,
        actorEmail: user?.email ?? null,
        teamId: Number(selectedTeamId),
      });
      const updated = await getTournamentRegistrations(id);
      setRegistrations(updated);
      const teamName = myTeams.find((t) => String(t.id) === selectedTeamId)?.name ?? 'Your team';
      setRegisterSuccess(`${teamName} has been registered.`);
    } catch (err) {
      setRegisterError(err.message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  }

  async function handleLeave() {
    if (!selectedTeamId) return;
    setLeaving(true);
    setRegisterError('');
    setRegisterSuccess('');
    try {
      await leaveTeamFromTournament(id, {
        actorUserId: user?.id ?? null,
        actorEmail: user?.email ?? null,
        teamId: Number(selectedTeamId),
      });
      const updated = await getTournamentRegistrations(id);
      setRegistrations(updated);
      const teamName = myTeams.find((t) => String(t.id) === selectedTeamId)?.name ?? 'Your team';
      setRegisterSuccess(`${teamName} has left this tournament.`);
    } catch (err) {
      setRegisterError(err.message || 'Unable to leave the tournament.');
    } finally {
      setLeaving(false);
    }
  }

  if (!tournament) {
    return <p>There is no tournament entry available right now.</p>;
  }

  const spotsLeft = tournament.teamSlots != null ? tournament.teamSlots - registrations.length : null;
  const isAdminUser = Boolean(user?.isAdmin);
  const isOpenStatus = String(tournament?.status || '').trim().toLowerCase() === 'open';

  const openTeamDetails = (team) => {
    if (!team?.teamId) {
      return;
    }

    navigate(`/team-management?view=discover&teamId=${team.teamId}`);
  };

  return (
    <section style={{ maxWidth: '1120px', margin: '0 auto' }}>
      <article className="surface-card">
        <h2>{tournament.name}</h2>
        <p style={{ fontFamily: 'monospace', marginTop: '0.25rem', color: 'var(--muted)' }}>
          ID: {tournament.publicId || tournament.id}
        </p>

        <div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.85rem' }}>
          <div>
            {tournament.image ? (
              <img
                src={tournament.image}
                alt={tournament.name || 'Tournament'}
                style={{
                  width: '100%',
                  maxHeight: '420px',
                  objectFit: 'contain',
                  borderRadius: '0.6rem',
                }}
              />
            ) : (
              <div
                style={{
                  minHeight: '240px',
                  borderRadius: '0.6rem',
                  border: '1px solid var(--panel-border)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--muted)',
                }}
              >
                No tournament image
              </div>
            )}
          </div>

          <div>
            {tournament.description ? (
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  paddingRight: '0.35rem',
                }}
              >
                <p style={{ marginTop: 0, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{tournament.description}</p>
              </div>
            ) : (
              <p style={{ marginTop: 0, color: 'var(--muted)' }}>No description available.</p>
            )}

            {isAdminUser ? (
              <div style={{ marginTop: '0.75rem' }}>
                <button type="button" className="ghost-btn" onClick={() => setDeleteOpen(true)}>
                  Delete Tournament
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {isAdminUser ? (
        <DeleteConfirm
          open={deleteOpen}
          title={`Delete tournament: ${tournament?.name}`}
          message={
            tournament
              ? 'Deleting this tournament will also delete any teams connected to this tournament. This action cannot be undone.'
              : ''
          }
          details={tournament ? `ID: ${tournament.publicId || tournament.id}` : ''}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onCancel={() => setDeleteOpen(false)}
          onConfirm={async () => {
            try {
              await deleteTournament(tournament.id, true);
              navigate('/admin');
            } catch (err) {
              alert(err.message || 'Failed to delete tournament');
            }
          }}
        />
      ) : null}

      <div className="grid" style={{ marginTop: '1.5rem' }}>
        <article className="surface-card">
          <h3>Overview</h3>
          <Field label="Game" value={tournament.game} />
          <Field label="Region" value={tournament.region} />
          <Field label="Status" value={tournament.status} />
          <Field label="Prize pool" value={tournament.prizePool} />
          {canSeeVenue ? <Field label="Venue" value={tournament.venue} /> : null}
          <Field label="Start date" value={formatDate(tournament.startDate)} />
          <Field
            label="Team slots"
            value={
              tournament.teamSlots != null
                ? `${registrations.length} / ${tournament.teamSlots} enrolled${spotsLeft != null ? ` (${spotsLeft} left)` : ''}`
                : undefined
            }
          />

          {registrations.length > 0 ? (
            <>
              <h3 style={{ marginTop: '1rem' }}>Participating Teams</h3>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                {registrations.map((team, index) => (
                  <span key={team.id}>
                    {index > 0 ? ', ' : ''}
                    <button
                      type="button"
                      onClick={() => openTeamDetails(team)}
                      className="inline-link"
                      style={{
                        background: 'none',
                        border: 0,
                        padding: 0,
                        font: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      {team.teamName || 'Unknown Team'}
                    </button>
                  </span>
                ))}
              </p>
            </>
          ) : null}

          {user && myTeams.length > 0 ? (
            <>
              <h3 style={{ marginTop: '1.25rem' }}>Register Your Team</h3>
              {registerSuccess ? (
                <p style={{ color: 'var(--accent)' }}>{registerSuccess}</p>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.6rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      marginTop: '0.5rem',
                    }}
                  >
                    <select
                      value={selectedTeamId}
                      onChange={(e) => {
                        setSelectedTeamId(e.target.value);
                        setRegisterError('');
                      }}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: '0.4rem',
                        background: 'var(--panel)',
                        color: 'var(--ink)',
                        border: '1px solid var(--muted)',
                      }}
                    >
                      {myTeams.map((team) => (
                        <option key={team.id} value={String(team.id)}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={selectedAlreadyRegistered ? 'ghost-btn danger-btn' : 'primary-btn'}
                      disabled={registering || leaving}
                      onClick={selectedAlreadyRegistered ? handleLeave : handleRegister}
                    >
                      {selectedAlreadyRegistered
                        ? (leaving ? 'Leaving...' : 'Leave Tournament')
                        : registering
                          ? 'Registering...'
                          : 'Confirm Registration'}
                    </button>
                  </div>
                  {registerError ? (
                    <p style={{ color: 'var(--danger)', marginTop: '0.4rem', fontSize: '0.875rem' }}>
                      {registerError}
                    </p>
                  ) : null}
                  <p style={{ color: 'var(--muted)', marginTop: '0.45rem', fontSize: '0.875rem' }}>
                    You can only register teams that you are the captain of. If the selected team is already enrolled, use Leave Tournament to withdraw it.
                  </p>
                </>
              )}
            </>
          ) : null}

          {user && myTeams.length === 0 ? (
            <p style={{ color: 'var(--muted)', marginTop: '1rem', fontSize: '0.875rem' }}>
              You must be a team captain to register a team for this tournament.
            </p>
          ) : null}
        </article>
      </div>

      {!isOpenStatus ? (
        <article className="surface-card">
          <h3>Leaderboard</h3>
          <LeaderboardTable rows={leaderboard} />
        </article>
      ) : null}
    </section>
  );
}

export default TournamentDetails;
