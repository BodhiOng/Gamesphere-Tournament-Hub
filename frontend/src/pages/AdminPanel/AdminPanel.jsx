import { useEffect, useState } from 'react';
import { approveAccountRequest, deleteAccountRequest, getAccountRequests, rejectAccountRequest } from '../../api/adminApi';
import { createTournament, getTournaments, getTournamentById, updateTournament, deleteTournament } from '../../api/tournamentApi';
import DeleteConfirm from '../../components/DeleteConfirm/DeleteConfirm';

const actions = [
  'Create tournaments',
  'Manage users',
  'Approve teams',
  'Update match results',
  'Moderate reports',
];

function formatDateInputValue(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatTimeInputValue(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(11, 16);
}

function composeLocalDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  const combined = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(combined.getTime())) return null;
  return combined.toISOString();
}

const regionOptions = [
  'Global',
  'N/A',
  'EU',
  'SEA',
  'East Asia',
  'South Asia',
  'LATAM',
  'MENA',
  'OCE'
];

function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [requestDeleteTarget, setRequestDeleteTarget] = useState(null);

  const getRequestStatusLabel = (status) => {
    if (typeof status === 'string') {
      const normalized = status.trim().toLowerCase();
      if (normalized === '1' || normalized === 'approved') return 'approved';
      if (normalized === '2' || normalized === 'rejected') return 'rejected';
      if (normalized === '0' || normalized === 'pending') return 'pending';
      return normalized;
    }

    if (status === 1) return 'approved';
    if (status === 2) return 'rejected';
    if (status === 0) return 'pending';
    return String(status ?? '').toLowerCase();
  };

  useEffect(() => {
    let ignore = false;

    async function loadRequests() {
      try {
        const data = await getAccountRequests();
        if (!ignore) {
          setRequests(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      ignore = true;
    };
  }, []);

  const refreshRequests = async () => {
    setError('');
    const data = await getAccountRequests();
    setRequests(data);
  };

  const handleDecision = async (id, decision) => {
    setError('');
    try {
      if (decision === 'approve') {
        await approveAccountRequest(id);
      } else {
        await rejectAccountRequest(id);
      }

      await refreshRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRequest = async (id) => {
    setError('');
    try {
      await deleteAccountRequest(id);
      setRequestDeleteTarget(null);
      await refreshRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  // Create tournament form state
  const [tName, setTName] = useState('');
  const [tImage, setTImage] = useState('');
  const [tDescription, setTDescription] = useState('');
  const [tStartDate, setTStartDate] = useState('');
  const [tStartTime, setTStartTime] = useState('');
  const [tSlots, setTSlots] = useState(16);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tGame, setTGame] = useState('');
  const [tRegion, setTRegion] = useState('');
  const [tStatus, setTStatus] = useState('');
  const [tPrize, setTPrize] = useState('');
  const [tVenue, setTVenue] = useState('');
  const [noTournamentsMessage, setNoTournamentsMessage] = useState('No tournament entry is available right now.');

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const startDateTime = composeLocalDateTime(tStartDate, tStartTime);
      if (!startDateTime) {
        setCreateError('Please choose both a start date and time.');
        setCreating(false);
        return;
      }

      const payload = {
        name: tName,
        image: tImage || null,
        description: tDescription || null,
        startDate: startDateTime,
        teamSlots: Number(tSlots),
        game: tGame || null,
        region: tRegion || null,
        status: tStatus || null,
        prizePool: tPrize !== '' ? String(tPrize) : null,
        Venue: tVenue || null,
      };

      await createTournament(payload);
      setTName('');
      setTImage('');
      setTDescription('');
      setTStartDate('');
      setTStartTime('');
      setTSlots(16);
      setTGame('');
      setTRegion('');
      setTStatus('');
      setTPrize('');
      setTVenue('');
      await loadTournaments();
      // optionally refresh tournaments list (not implemented)
    } catch (err) {
      setCreateError(err.message || 'Failed to create tournament');
    } finally {
      setCreating(false);
    }
  };

  const [active, setActive] = useState('manage-tournaments');
  // tournaments list state
  const [tournaments, setTournaments] = useState([]);
  const [tLoading, setTLoading] = useState(false);
  const [tError, setTError] = useState('');

  const [selected, setSelected] = useState(null); // for view details
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso || '-';
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    const q = (searchTerm || '').toString().trim().toLowerCase();
    if (!q) return true;
    return String(t.publicId || t.id).toLowerCase().includes(q)
      || (t.name || '').toLowerCase().includes(q)
      || (t.description || '').toLowerCase().includes(q)
      || (t.game || '').toLowerCase().includes(q)
      || (t.region || '').toLowerCase().includes(q);
  });

  const loadTournaments = async () => {
    setTLoading(true);
    setTError('');
    try {
      const data = await getTournaments();
      setTournaments(data);
      setNoTournamentsMessage('No tournament entry is available right now.');
    } catch (err) {
      setTError(err.message || 'Failed to load tournaments');
    } finally {
      setTLoading(false);
    }
  };

  useEffect(() => {
    // load tournaments when entering the manage tournaments panel
    if (active === 'manage-tournaments') {
      loadTournaments();
    }
  }, [active]);

  useEffect(() => {
    // when switching to manage-users, refresh requests and reset filters so approved entries are visible
    if (active === 'manage-users') {
      setRequestStatusFilter('all');
      setRequestSearch('');
      refreshRequests();
    }
  }, [active]);

  return (
    <div className="admin-layout">
      {/* Sidebar removed: use horizontal quick-nav to switch single active panel */}

      <main className="admin-column">
        <div className="admin-quick-nav" role="tablist" aria-label="Admin actions">
          <button type="button" role="tab" aria-pressed={active === 'manage-tournaments'} className={`nav-chip ${active === 'manage-tournaments' ? 'active' : ''}`} onClick={() => setActive('manage-tournaments')}>Manage tournaments</button>
          <button type="button" role="tab" aria-pressed={active === 'manage-users'} className={`nav-chip ${active === 'manage-users' ? 'active' : ''}`} onClick={() => setActive('manage-users')}>Manage account requests</button>
          <button type="button" role="tab" aria-pressed={active === 'approve-teams'} className={`nav-chip ${active === 'approve-teams' ? 'active' : ''}`} onClick={() => setActive('approve-teams')}>Manage teams</button>
          <button type="button" role="tab" aria-pressed={active === 'update-matches'} className={`nav-chip ${active === 'update-matches' ? 'active' : ''}`} onClick={() => setActive('update-matches')}>Manage match results</button>
          <button type="button" role="tab" aria-pressed={active === 'moderate-reports'} className={`nav-chip ${active === 'moderate-reports' ? 'active' : ''}`} onClick={() => setActive('moderate-reports')}>Manage reports</button>
        </div>
        {active === 'manage-tournaments' && (
          <section id="manage-tournaments" className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div />

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by tournament ID, name, game, or region" style={{ padding: '0.45rem 0.6rem', minWidth: '260px' }} />
                <button type="button" className="primary-btn" onClick={() => setCreateOpen(true)}>Create Tournament</button>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Existing tournaments</h4>
              {tLoading && <p>Loading tournaments...</p>}
              {tError && <p className="error-text">{tError}</p>}
              {!tLoading && filteredTournaments.length === 0 && <p>{searchTerm ? 'No tournaments match your search.' : noTournamentsMessage}</p>}

              {!tLoading && filteredTournaments.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table-shell auth-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Game</th>
                        <th>Start</th>
                        <th>Slots</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTournaments.map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{t.publicId || t.id}</td>
                          <td>{t.name}</td>
                          <td>{t.game || '-'}</td>
                          <td>{formatDate(t.startDate)}</td>
                          <td>{t.teamSlots ?? t.teamSlots === 0 ? t.teamSlots : (t.teamSlots ?? t.teamSlots)}</td>
                          <td>{t.status ?? '-'}</td>
                          <td>
                            <div className="cta-row">
                              <button type="button" className="ghost-btn" onClick={async () => { const d = await getTournamentById(t.id); setSelected(d); }}>View</button>
                              <button type="button" className="primary-btn" onClick={() => setEditingId(t.id)}>Edit</button>
                              <button type="button" className="ghost-btn" onClick={async () => {
                                try {
                                  const details = await getTournamentById(t.id);
                                  setDeleteTarget({ id: t.id, publicId: details.publicId || t.publicId || t.id, name: t.name, teamsCount: details.teamsCount });
                                } catch (err) {
                                  setTError(err.message || 'Failed to load details');
                                }
                              }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Create modal */}
            {createOpen && (
              <div className="surface-card" style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'start center', padding: '1rem', overflowY: 'auto', background: 'rgba(2,6,12,0.55)', zIndex: 1200 }}>
                <div style={{ width: 'min(980px, 96%)' }}>
                  <section className="surface-card tournament-form-modal" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>Create tournament</h3>
                      <div>
                        <button className="ghost-btn" onClick={() => setCreateOpen(false)}>Cancel</button>
                      </div>
                    </div>

                    <form onSubmit={async (e) => { await handleCreateTournament(e); setCreateOpen(false); }} className="tournament-modal-form">
                      <label>
                        Tournament name
                        <input value={tName} onChange={(e) => setTName(e.target.value)} placeholder="Name" required />
                      </label>

                      <label>
                        Image URL
                        <input value={tImage} onChange={(e) => setTImage(e.target.value)} placeholder="https://..." />
                      </label>

                      <label className="field-full">
                        Description
                        <textarea value={tDescription} onChange={(e) => setTDescription(e.target.value)} placeholder="Tournament description" rows={3} />
                      </label>

                      <label>
                        Start date
                        <input type="date" value={tStartDate} onChange={(e) => setTStartDate(e.target.value)} required />
                      </label>

                      <label>
                        Start time
                        <input type="time" value={tStartTime} onChange={(e) => setTStartTime(e.target.value)} required />
                      </label>

                      <label>
                        Game
                        <input value={tGame} onChange={(e) => setTGame(e.target.value)} placeholder="Game (e.g., Valorant)" />
                      </label>

                      <label>
                        Region
                        <select value={tRegion} onChange={(e) => setTRegion(e.target.value)}>
                          <option value="">Select region</option>
                          {regionOptions.map((region) => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Status
                        <select value={tStatus} onChange={(e) => setTStatus(e.target.value)}>
                          <option value="">Select status</option>
                          <option value="Open">Open</option>
                          <option value="Upcoming">Upcoming</option>
                          <option value="Live">Live</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </label>

                      <label>
                        Prize pool
                        <input type="number" min="0" step="0.01" value={tPrize} onChange={(e) => setTPrize(e.target.value)} placeholder="Prize pool amount" />
                      </label>

                      <label>
                        Venue
                        <input value={tVenue} onChange={(e) => setTVenue(e.target.value)} placeholder="Venue / location" />
                      </label>

                      <label>
                        Team slots
                        <input type="number" min="2" max="1024" value={tSlots} onChange={(e) => setTSlots(e.target.value)} required />
                      </label>

                      {createError && <p className="error-text field-full">{createError}</p>}

                      <div className="cta-row field-full">
                        <button type="submit" className="primary-btn" disabled={creating}>Create Tournament</button>
                      </div>
                    </form>
                  </section>
                </div>
              </div>
            )}
            {/* Delete confirmation modal */}
            <DeleteConfirm
              open={!!deleteTarget}
              title={deleteTarget ? `Delete tournament: ${deleteTarget.name}` : 'Delete tournament'}
              message={deleteTarget ? 'Deleting this tournament will also delete any teams connected to this tournament. This action cannot be undone.' : ''}
              details={deleteTarget ? `ID: ${deleteTarget.publicId || deleteTarget.id}` : ''}
              confirmLabel="Delete"
              cancelLabel="Cancel"
              onCancel={() => setDeleteTarget(null)}
              onConfirm={async () => {
                if (!deleteTarget) return;
                try {
                  await deleteTournament(deleteTarget.id, true);
                  setDeleteTarget(null);
                  await loadTournaments();
                } catch (err) {
                  setTError(err.message || 'Failed to delete');
                }
              }}
            />
          </section>
        )}

          {/* Details modal */}
          {selected && (
            <div className="surface-card" style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'start center', padding: '1rem', overflowY: 'auto', background: 'rgba(2,6,12,0.55)', zIndex: 1200 }}>
              <div style={{ width: 'min(1080px, 97%)' }}>
                <section className="surface-card tournament-view-modal" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
                  <div className="card-header">
                    <div>
                      <h3>Tournament details</h3>
                      <p className="tournament-view-subtitle">{selected.name || 'Untitled Tournament'}</p>
                    </div>
                    <div>
                      <button className="ghost-btn" onClick={() => setSelected(null)}>Close</button>
                    </div>
                  </div>

                  <div className="tournament-view-layout">
                    <article className="tournament-view-image-panel">
                      {selected.image ? (
                        <img
                          src={selected.image}
                          alt={selected.name || 'Tournament'}
                          className="tournament-view-image"
                        />
                      ) : (
                        <div className="tournament-view-image-placeholder">No image provided</div>
                      )}
                    </article>

                    <article className="tournament-view-copy-panel">
                      <h4>Description</h4>
                      <p className="tournament-view-description">{selected.description || 'No description available.'}</p>
                    </article>
                  </div>

                  <dl className="tournament-view-meta-grid">
                    <div className="tournament-view-meta-item">
                      <dt>ID</dt>
                      <dd>{selected.publicId || selected.id}</dd>
                    </div>
                    <div className="tournament-view-meta-item">
                      <dt>Name</dt>
                      <dd>{selected.name || '-'}</dd>
                    </div>
                    <div className="tournament-view-meta-item">
                      <dt>Game</dt>
                      <dd>{selected.game || '-'}</dd>
                    </div>
                    <div className="tournament-view-meta-item">
                      <dt>Region</dt>
                      <dd>{selected.region || '-'}</dd>
                    </div>
                    <div className="tournament-view-meta-item">
                      <dt>Start</dt>
                      <dd>{formatDate(selected.startDate)}</dd>
                    </div>
                    <div className="tournament-view-meta-item">
                      <dt>Team slots</dt>
                      <dd>{selected.teamSlots ?? '-'}</dd>
                    </div>
                    <div className="tournament-view-meta-item">
                      <dt>Prize pool</dt>
                      <dd>{selected.prizePool ?? '-'}</dd>
                    </div>
                    <div className="tournament-view-meta-item">
                      <dt>Venue</dt>
                      <dd>{selected.venue ?? '-'}</dd>
                    </div>
                    <div className="tournament-view-meta-item">
                      <dt>Status</dt>
                      <dd>{selected.status || '-'}</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>
          )}

          {/* Edit inline panel */}
          {editingId && (
            <EditTournament id={editingId} onClose={async () => { setEditingId(null); await loadTournaments(); }} />
          )}

        {active === 'manage-users' && (
          <section id="manage-users" className="surface-card">
          <div style={{ marginTop: '1.25rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>User account requests</h4>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
              <input
                type="search"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search by ID, username, or email"
                style={{ padding: '0.45rem 0.6rem', minWidth: '280px' }}
              />
              <select value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value)} style={{ padding: '0.45rem 0.6rem' }}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {loading && <p>Loading requests...</p>}
            {error && <p className="error-text">{error}</p>}

            {(() => {
              const searchValue = requestSearch.trim().toLowerCase();
              const visibleRequests = requests.filter((r) => {
                const statusLabel = getRequestStatusLabel(r.status);
                if (requestStatusFilter !== 'all' && statusLabel !== requestStatusFilter) {
                  return false;
                }

                if (!searchValue) return true;

                const requestId = String(r.publicId || r.id || '').toLowerCase();
                const username = String(r.username || '').toLowerCase();
                const email = String(r.email || '').toLowerCase();

                return requestId.includes(searchValue)
                  || username.includes(searchValue)
                  || email.includes(searchValue);
              });

              if (!loading && visibleRequests.length === 0) {
                return <p>No account requests match your filters.</p>;
              }

              return !loading && visibleRequests.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table-shell auth-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Requested</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRequests.map((req) => {
                        const statusLabel = getRequestStatusLabel(req.status);
                        const isPending = statusLabel === 'pending';
                        const requestedAt = req.requestedAt ? new Date(req.requestedAt).toLocaleString() : '-';
                        const requestId = req.publicId || req.id;
                        return (
                          <tr key={requestId}>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{requestId}</td>
                            <td>{req.username}</td>
                            <td>{req.email}</td>
                            <td>{requestedAt}</td>
                            <td>{statusLabel}</td>
                            <td>
                              <div className="cta-row">
                                <button type="button" className="primary-btn" onClick={() => handleDecision(requestId, 'approve')} disabled={statusLabel === 'approved'}>
                                  Approve
                                </button>
                                        <button type="button" className="ghost-btn" onClick={() => handleDecision(requestId, 'reject')} disabled={statusLabel === 'rejected'}>
                                  Reject
                                </button>
                                <button type="button" className="ghost-btn" onClick={() => setRequestDeleteTarget({ id: requestId, username: req.username, email: req.email })}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <DeleteConfirm
              open={!!requestDeleteTarget}
              title={requestDeleteTarget ? `Delete account request: ${requestDeleteTarget.username}` : 'Delete account request'}
              message={requestDeleteTarget ? 'This will permanently remove this account request entry. This action cannot be undone.' : ''}
              details={requestDeleteTarget ? `ID: ${requestDeleteTarget.id} | Email: ${requestDeleteTarget.email}` : ''}
              confirmLabel="Delete"
              cancelLabel="Cancel"
              onCancel={() => setRequestDeleteTarget(null)}
              onConfirm={async () => {
                if (!requestDeleteTarget) return;
                await handleDeleteRequest(requestDeleteTarget.id);
              }}
            />
          </div>
          </section>
        )}

        {active === 'approve-teams' && (
          <section id="approve-teams" className="surface-card">
            <h3>Approve teams</h3>
            <p>Approve or reject team registrations and manage team metadata.</p>
            <div className="cta-row" style={{ marginTop: '1rem' }}>
              <button type="button" className="primary-btn">Review Team Approvals</button>
            </div>
          </section>
        )}

        {active === 'update-matches' && (
          <section id="update-matches" className="surface-card">
            <h3>Update match results</h3>
            <p>Manually update match outcomes, correct scores, and resolve disputes.</p>
            <div className="cta-row" style={{ marginTop: '1rem' }}>
              <button type="button" className="primary-btn">Manage Matches</button>
            </div>
          </section>
        )}

        {active === 'moderate-reports' && (
          <section id="moderate-reports" className="surface-card">
            <h3>Moderate reports</h3>
            <p>Review player reports, ban appeals, and moderation history.</p>
            <div className="cta-row" style={{ marginTop: '1rem' }}>
              <button type="button" className="ghost-btn">Review Reports</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function EditTournament({ id, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [teamSlots, setTeamSlots] = useState(16);
  const [game, setGame] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [venue, setVenue] = useState('');

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const t = await getTournamentById(id);
        if (!ignore) {
          setName(t.name || '');
          setImage(t.image || '');
          setDescription(t.description || '');
          setStartDate(formatDateInputValue(t.startDate));
          setStartTime(formatTimeInputValue(t.startDate));
          setTeamSlots(t.teamSlots ?? t.teamSlots ?? 16);
          setGame(t.game ?? '');
          setRegion(t.region ?? '');
          setStatus(t.status ?? '');
          setPrizePool(t.prizePool ?? '');
          setVenue(t.venue ?? '');
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const startDateTime = composeLocalDateTime(startDate, startTime);
      if (!startDateTime) {
        setError('Please choose both a start date and time.');
        return;
      }

      await updateTournament(id, {
        Name: name,
        Image: image || null,
        Description: description || null,
        StartDate: startDateTime,
        TeamSlots: Number(teamSlots),
        Game: game || null,
        Region: region || null,
        Status: status || null,
        PrizePool: prizePool !== '' ? String(prizePool) : null,
        Venue: venue || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update');
    }
  };

  return (
    <div className="surface-card" style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'start center', padding: '1rem', overflowY: 'auto', background: 'rgba(2,6,12,0.55)', zIndex: 1200 }}>
      <div style={{ width: 'min(980px, 96%)' }}>
        <section className="surface-card tournament-form-modal" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Edit tournament</h3>
            <div>
              <button className="ghost-btn" onClick={onClose}>Cancel</button>
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={handleSave} className="tournament-modal-form">
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>

              <label>
                Image URL
                <input value={image} onChange={(e) => setImage(e.target.value)} />
              </label>

              <label className="field-full">
                Description
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </label>

              <label>
                Start date
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>

              <label>
                Start time
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </label>

              <label>
                Game
                <input value={game} onChange={(e) => setGame(e.target.value)} />
              </label>

              <label>
                Region
                <select value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option value="">Select region</option>
                  {regionOptions.map((regionOption) => (
                    <option key={regionOption} value={regionOption}>{regionOption}</option>
                  ))}
                </select>
              </label>

              <label>
                Team slots
                <input type="number" min="2" max="1024" value={teamSlots} onChange={(e) => setTeamSlots(e.target.value)} required />
              </label>

              <label>
                Prize pool
                <input type="number" min="0" step="0.01" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} />
              </label>

              <label>
                Venue
                <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue / location" />
              </label>

              <label>
                Status
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Select status</option>
                  <option value="Open">Open</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>

              {error && <p className="error-text field-full">{error}</p>}

              <div className="cta-row field-full">
                <button type="submit" className="primary-btn">Save</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminPanel;
