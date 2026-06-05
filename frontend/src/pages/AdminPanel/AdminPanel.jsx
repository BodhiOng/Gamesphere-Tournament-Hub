import { useEffect, useMemo, useState } from 'react';
import {
  approveAccountRequest,
  createMatchResult,
  deleteMatchResult,
  deleteAccountRequest,
  deleteReportedAccount,
  getAccountRequests,
  getMatchResultLookups,
  getMatchResults,
  getReports,
  rejectAccountRequest,
  suspendReportedAccount,
  updateMatchResult,
} from '../../api/adminApi';
import { createTournament, getTournaments, getTournamentById, updateTournament, deleteTournament } from '../../api/tournamentApi';
import DeleteConfirm from '../../components/DeleteConfirm/DeleteConfirm';
import { useAuth } from '../../context/AuthContext';

const TOURNAMENTS_PER_PAGE = 10;
const REQUESTS_PER_PAGE = 10;
const REPORTS_PER_PAGE = 10;
const MATCH_RESULTS_PER_PAGE = 10;

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

function formatRoundLabel(round, maxRounds) {
  const roundNumber = Number(round);
  if (!Number.isFinite(roundNumber) || roundNumber <= 0) {
    return '-';
  }

  if (Number.isFinite(maxRounds) && maxRounds > 0 && roundNumber === maxRounds) {
    return 'Final Round';
  }

  return `Round ${roundNumber}`;
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
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [requestDeleteTarget, setRequestDeleteTarget] = useState(null);
  const [requestPage, setRequestPage] = useState(1);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [reportPage, setReportPage] = useState(1);
  const [reportActionBusy, setReportActionBusy] = useState('');
  const [reportSuspendUntil, setReportSuspendUntil] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [matchResults, setMatchResults] = useState([]);
  const [matchResultsLoading, setMatchResultsLoading] = useState(false);
  const [matchResultSearch, setMatchResultSearch] = useState('');
  const [matchResultPage, setMatchResultPage] = useState(1);
  const [matchResultEditorOpen, setMatchResultEditorOpen] = useState(false);
  const [matchResultEditing, setMatchResultEditing] = useState(null);
  const [matchResultDeleteTarget, setMatchResultDeleteTarget] = useState(null);
  const [matchResultActionBusy, setMatchResultActionBusy] = useState('');
  const [matchResultLookups, setMatchResultLookups] = useState({ tournaments: [], teams: [], registrations: [] });

  const truncateText = (value, maxLength = 140) => {
    const text = String(value || '').trim();
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}...`;
  };

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

  const loadReports = async () => {
    setReportsLoading(true);
    setError('');
    try {
      const data = await getReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load reports.');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadMatchResults = async () => {
    setMatchResultsLoading(true);
    setError('');
    try {
      const [results, lookups] = await Promise.all([
        getMatchResults(),
        getMatchResultLookups(),
      ]);
      setMatchResults(Array.isArray(results) ? results : []);
      setMatchResultLookups({
        tournaments: Array.isArray(lookups?.tournaments) ? lookups.tournaments : [],
        teams: Array.isArray(lookups?.teams) ? lookups.teams : [],
        registrations: Array.isArray(lookups?.registrations) ? lookups.registrations : [],
      });
    } catch (err) {
      setError(err.message || 'Failed to load match results.');
    } finally {
      setMatchResultsLoading(false);
    }
  };

  const onModerateReport = async (reportId, action) => {
    setError('');
    const token = `${action}:${reportId}`;
    setReportActionBusy(token);

    try {
      if (action === 'delete') {
        await deleteReportedAccount(reportId);
      } else {
        const localValue = reportSuspendUntil[reportId];
        if (!localValue) {
          throw new Error('Pick a suspension end date and time first.');
        }

        const utcIso = new Date(localValue).toISOString();
        await suspendReportedAccount(reportId, utcIso, user);
      }

      await loadReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport((current) => {
          if (!current) return null;
          return {
            ...current,
            status: 'Resolved',
            resolutionAction: action,
          };
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to moderate report.');
    } finally {
      setReportActionBusy('');
    }
  };

  const onSaveMatchResult = async (payload, editingId = null) => {
    setError('');
    setMatchResultActionBusy(editingId ? `save:${editingId}` : 'create');
    try {
      if (editingId) {
        await updateMatchResult(editingId, payload, user);
      } else {
        await createMatchResult(payload, user);
      }

      setMatchResultEditorOpen(false);
      setMatchResultEditing(null);
      await loadMatchResults();
    } catch (err) {
      throw err;
    } finally {
      setMatchResultActionBusy('');
    }
  };

  const onDeleteMatchResult = async (id) => {
    setError('');
    setMatchResultActionBusy(`delete:${id}`);
    try {
      await deleteMatchResult(id);
      setMatchResultDeleteTarget(null);
      await loadMatchResults();
    } catch (err) {
      setError(err.message || 'Failed to delete match result.');
    } finally {
      setMatchResultActionBusy('');
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
  const [tournamentGameFilter, setTournamentGameFilter] = useState('all');
  const [tournamentStatusFilter, setTournamentStatusFilter] = useState('all');
  const [tournamentStartDateSort, setTournamentStartDateSort] = useState('desc');
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
  const [tournamentPage, setTournamentPage] = useState(1);

  const [selected, setSelected] = useState(null); // for view details
  const [selectedImageLoadFailed, setSelectedImageLoadFailed] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso || '-';
    }
  };

  const tournamentGameOptions = Array.from(
    new Set(
      tournaments
        .map((t) => (t.game || '').trim())
        .filter((game) => game.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const tournamentStatusOptions = Array.from(
    new Set(
      tournaments
        .map((t) => (t.status || '').trim())
        .filter((status) => status.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const filteredTournaments = tournaments.filter((t) => {
    const q = (searchTerm || '').toString().trim().toLowerCase();
    const matchesSearch = !q || String(t.publicId || t.id).toLowerCase().includes(q)
      || (t.name || '').toLowerCase().includes(q)
      || (t.description || '').toLowerCase().includes(q)
      || (t.game || '').toLowerCase().includes(q)
      || (t.region || '').toLowerCase().includes(q);

    const normalizedGame = (t.game || '').trim();
    const normalizedStatus = (t.status || '').trim();
    const matchesGame = tournamentGameFilter === 'all' || normalizedGame === tournamentGameFilter;
    const matchesStatus = tournamentStatusFilter === 'all' || normalizedStatus === tournamentStatusFilter;

    return matchesSearch && matchesGame && matchesStatus;
  });

  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    const aTime = new Date(a.startDate).getTime();
    const bTime = new Date(b.startDate).getTime();
    const aValue = Number.isNaN(aTime) ? 0 : aTime;
    const bValue = Number.isNaN(bTime) ? 0 : bTime;

    return tournamentStartDateSort === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const totalTournamentPages = Math.max(1, Math.ceil(sortedTournaments.length / TOURNAMENTS_PER_PAGE));
  const paginatedTournaments = sortedTournaments.slice(
    (tournamentPage - 1) * TOURNAMENTS_PER_PAGE,
    tournamentPage * TOURNAMENTS_PER_PAGE,
  );

  const filteredRequests = requests.filter((r) => {
    const statusLabel = getRequestStatusLabel(r.status);
    if (requestStatusFilter !== 'all' && statusLabel !== requestStatusFilter) {
      return false;
    }

    const searchValue = requestSearch.trim().toLowerCase();
    if (!searchValue) return true;

    const requestId = String(r.publicId || r.id || '').toLowerCase();
    const username = String(r.username || '').toLowerCase();
    const email = String(r.email || '').toLowerCase();

    return requestId.includes(searchValue)
      || username.includes(searchValue)
      || email.includes(searchValue);
  });

  const totalRequestPages = Math.max(1, Math.ceil(filteredRequests.length / REQUESTS_PER_PAGE));
  const paginatedRequests = filteredRequests.slice(
    (requestPage - 1) * REQUESTS_PER_PAGE,
    requestPage * REQUESTS_PER_PAGE,
  );

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
    setTournamentPage(1);
  }, [searchTerm, tournamentGameFilter, tournamentStatusFilter, tournamentStartDateSort]);

  useEffect(() => {
    if (tournamentPage > totalTournamentPages) {
      setTournamentPage(totalTournamentPages);
    }
  }, [tournamentPage, totalTournamentPages]);

  useEffect(() => {
    // when switching to manage-users, refresh requests and reset filters so approved entries are visible
    if (active === 'manage-users') {
      setRequestStatusFilter('all');
      setRequestSearch('');
      setRequestPage(1);
      refreshRequests();
    }
  }, [active]);

  useEffect(() => {
    if (active === 'moderate-reports') {
      setReportPage(1);
      loadReports();
    }
  }, [active]);

  useEffect(() => {
    if (active === 'update-matches') {
      setMatchResultPage(1);
      loadMatchResults();
    }
  }, [active]);

  useEffect(() => {
    setRequestPage(1);
  }, [requestSearch, requestStatusFilter]);

  useEffect(() => {
    if (requestPage > totalRequestPages) {
      setRequestPage(totalRequestPages);
    }
  }, [requestPage, totalRequestPages]);

  useEffect(() => {
    setReportPage(1);
  }, [reportSearch, reportStatusFilter]);

  useEffect(() => {
    setSelectedImageLoadFailed(false);
  }, [selected?.id, selected?.image]);

  const filteredReports = reports.filter((report) => {
    const status = String(report?.status || '').toLowerCase();
    if (reportStatusFilter !== 'all' && status !== reportStatusFilter) {
      return false;
    }

    const query = reportSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    const reportId = String(report?.id || '').toLowerCase();
    const subject = String(report?.subject || '').toLowerCase();
    const reportedUsername = String(report?.reportedUsername || report?.reportedUserPublicId || '').toLowerCase();
    const reporterUsername = String(report?.reporterUsername || report?.reporterUserPublicId || '').toLowerCase();

    return reportId.includes(query)
      || subject.includes(query)
      || reportedUsername.includes(query)
      || reporterUsername.includes(query);
  });

  const totalReportPages = Math.max(1, Math.ceil(filteredReports.length / REPORTS_PER_PAGE));
  const paginatedReports = filteredReports.slice(
    (reportPage - 1) * REPORTS_PER_PAGE,
    reportPage * REPORTS_PER_PAGE,
  );

  const filteredMatchResults = matchResults.filter((result) => {
    const query = matchResultSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return String(result?.publicId || result?.id || '').toLowerCase().includes(query)
      || String(result?.tournamentName || result?.tournamentPublicId || '').toLowerCase().includes(query)
      || String(result?.roundNumber || '').toLowerCase().includes(query)
      || String(result?.teamAName || result?.teamAPublicId || '').toLowerCase().includes(query)
      || String(result?.teamBName || result?.teamBPublicId || '').toLowerCase().includes(query)
      || String(result?.winnerTeamName || result?.winnerTeamPublicId || '').toLowerCase().includes(query);
  });

  const totalMatchResultPages = Math.max(1, Math.ceil(filteredMatchResults.length / MATCH_RESULTS_PER_PAGE));
  const paginatedMatchResults = filteredMatchResults.slice(
    (matchResultPage - 1) * MATCH_RESULTS_PER_PAGE,
    matchResultPage * MATCH_RESULTS_PER_PAGE,
  );

  useEffect(() => {
    if (reportPage > totalReportPages) {
      setReportPage(totalReportPages);
    }
  }, [reportPage, totalReportPages]);

  useEffect(() => {
    if (matchResultPage > totalMatchResultPages) {
      setMatchResultPage(totalMatchResultPages);
    }
  }, [matchResultPage, totalMatchResultPages]);

  useEffect(() => {
    setMatchResultPage(1);
  }, [matchResultSearch]);

  return (
    <div className="admin-layout">
      {/* Sidebar removed: use horizontal quick-nav to switch single active panel */}

      <main className="admin-column">
        <div className="admin-quick-nav" role="tablist" aria-label="Admin actions">
          <button type="button" role="tab" aria-pressed={active === 'manage-tournaments'} className={`nav-chip ${active === 'manage-tournaments' ? 'active' : ''}`} onClick={() => setActive('manage-tournaments')}>Manage tournaments</button>
          <button type="button" role="tab" aria-pressed={active === 'manage-users'} className={`nav-chip ${active === 'manage-users' ? 'active' : ''}`} onClick={() => setActive('manage-users')}>Manage account requests</button>
          <button type="button" role="tab" aria-pressed={active === 'update-matches'} className={`nav-chip ${active === 'update-matches' ? 'active' : ''}`} onClick={() => setActive('update-matches')}>Manage match results</button>
          <button type="button" role="tab" aria-pressed={active === 'moderate-reports'} className={`nav-chip ${active === 'moderate-reports' ? 'active' : ''}`} onClick={() => setActive('moderate-reports')}>Manage reports</button>
        </div>
        {active === 'manage-tournaments' && (
          <section id="manage-tournaments" className="surface-card">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by tournament ID, name, game, or region" style={{ padding: '0.45rem 0.6rem', flex: '1 1 360px', minWidth: '260px' }} />
                <select value={tournamentGameFilter} onChange={(e) => setTournamentGameFilter(e.target.value)} style={{ padding: '0.45rem 0.6rem' }}>
                  <option value="all">All games</option>
                  {tournamentGameOptions.map((gameOption) => (
                    <option key={gameOption} value={gameOption}>{gameOption}</option>
                  ))}
                </select>
                <select value={tournamentStatusFilter} onChange={(e) => setTournamentStatusFilter(e.target.value)} style={{ padding: '0.45rem 0.6rem' }}>
                  <option value="all">All statuses</option>
                  {tournamentStatusOptions.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>{statusOption}</option>
                  ))}
                </select>
                <select value={tournamentStartDateSort} onChange={(e) => setTournamentStartDateSort(e.target.value)} style={{ padding: '0.45rem 0.6rem' }}>
                  <option value="desc">Start date: Newest first</option>
                  <option value="asc">Start date: Oldest first</option>
                </select>
                <button type="button" className="primary-btn" onClick={() => setCreateOpen(true)}>Create Tournament</button>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Existing tournaments</h4>
              {tLoading && <p>Loading tournaments...</p>}
              {tError && <p className="error-text">{tError}</p>}
              {!tLoading && sortedTournaments.length === 0 && <p>{searchTerm || tournamentGameFilter !== 'all' || tournamentStatusFilter !== 'all' ? 'No tournaments match your filters.' : noTournamentsMessage}</p>}

              {!tLoading && sortedTournaments.length > 0 && (
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
                      {paginatedTournaments.map((t) => (
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

                  <div className="admin-pagination-row">
                    <p className="admin-pagination-summary">
                      Showing {sortedTournaments.length === 0 ? 0 : (tournamentPage - 1) * TOURNAMENTS_PER_PAGE + 1}
                      {' '}-{' '}
                      {Math.min(tournamentPage * TOURNAMENTS_PER_PAGE, sortedTournaments.length)}
                      {' '}of {sortedTournaments.length}
                    </p>
                    <div className="admin-pagination-controls">
                      <button type="button" className="ghost-btn" disabled={tournamentPage <= 1} onClick={() => setTournamentPage((p) => Math.max(1, p - 1))}>Previous</button>
                      <span>Page {tournamentPage} of {totalTournamentPages}</span>
                      <button type="button" className="ghost-btn" disabled={tournamentPage >= totalTournamentPages} onClick={() => setTournamentPage((p) => Math.min(totalTournamentPages, p + 1))}>Next</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Create modal */}
            {createOpen && (
              <div className="surface-card" style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center center', padding: '1rem', overflowY: 'auto', background: 'rgba(2,6,12,0.55)', zIndex: 1200 }}>
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
                      <button className="ghost-btn" onClick={() => {
                        setSelected(null);
                        setSelectedImageLoadFailed(false);
                      }}>Close</button>
                    </div>
                  </div>

                  <div className="tournament-view-layout">
                    <article className="tournament-view-image-panel">
                      {selected.image && !selectedImageLoadFailed ? (
                        <img
                          src={selected.image}
                          alt={selected.name || 'Tournament'}
                          className="tournament-view-image"
                          onError={() => setSelectedImageLoadFailed(true)}
                        />
                      ) : selected.image ? (
                        <div className="tournament-view-image-placeholder failed" aria-label="Image failed to load">?</div>
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
              if (!loading && filteredRequests.length === 0) {
                return <p>No account requests match your filters.</p>;
              }

              return !loading && filteredRequests.length > 0 && (
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
                      {paginatedRequests.map((req) => {
                        const statusLabel = getRequestStatusLabel(req.status);
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

                  <div className="admin-pagination-row">
                    <p className="admin-pagination-summary">
                      Showing {filteredRequests.length === 0 ? 0 : (requestPage - 1) * REQUESTS_PER_PAGE + 1}
                      {' '}-{' '}
                      {Math.min(requestPage * REQUESTS_PER_PAGE, filteredRequests.length)}
                      {' '}of {filteredRequests.length}
                    </p>
                    <div className="admin-pagination-controls">
                      <button type="button" className="ghost-btn" disabled={requestPage <= 1} onClick={() => setRequestPage((p) => Math.max(1, p - 1))}>Previous</button>
                      <span>Page {requestPage} of {totalRequestPages}</span>
                      <button type="button" className="ghost-btn" disabled={requestPage >= totalRequestPages} onClick={() => setRequestPage((p) => Math.min(totalRequestPages, p + 1))}>Next</button>
                    </div>
                  </div>
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

        {active === 'update-matches' && (
          <section id="update-matches" className="surface-card">
            <h3>Update match results</h3>
            <p>Manually create, edit, and remove recorded match outcomes.</p>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.8rem', flexWrap: 'wrap' }}>
              <input
                type="search"
                value={matchResultSearch}
                onChange={(event) => setMatchResultSearch(event.target.value)}
                placeholder="Search by match ID, tournament, round, team, or winner"
                style={{ padding: '0.45rem 0.6rem', minWidth: '280px' }}
              />
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setMatchResultEditing(null);
                  setMatchResultEditorOpen(true);
                }}
              >
                Create Match Result
              </button>
            </div>

            {matchResultsLoading ? <p style={{ marginTop: '0.8rem' }}>Loading match results...</p> : null}
            {!matchResultsLoading && filteredMatchResults.length === 0 ? <p style={{ marginTop: '0.8rem' }}>No match results match your filters.</p> : null}

            {!matchResultsLoading && filteredMatchResults.length > 0 ? (
              <div style={{ overflowX: 'auto', marginTop: '0.8rem' }}>
                <table className="table-shell auth-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tournament</th>
                      <th>Round</th>
                      <th>Matchup</th>
                      <th>Score</th>
                      <th>Winner</th>
                      <th>Released</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMatchResults.map((result) => {
                      const scoreLabel = result.teamAScore != null && result.teamBScore != null
                        ? `${result.teamAScore} - ${result.teamBScore}`
                        : '-';

                      return (
                        <tr key={result.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{result.publicId || result.id}</td>
                          <td>{result.tournamentName || result.tournamentPublicId || '-'}</td>
                          <td>{formatRoundLabel(result.roundNumber, Math.max(1, Math.ceil(Math.log2(Math.max(2, Number(matchResultLookups.tournaments.find((tournament) => tournament.publicId === result.tournamentPublicId)?.teamSlots || 2))))))}</td>
                          <td>{`${result.teamAName || result.teamAPublicId || '-'} vs ${result.teamBName || result.teamBPublicId || '-'}`}</td>
                          <td>{scoreLabel}</td>
                          <td>{result.winnerTeamName || result.winnerTeamPublicId || '-'}</td>
                          <td>{result.createdAtUtc ? formatDate(result.createdAtUtc) : '-'}</td>
                          <td>
                            <div className="cta-row">
                              <button
                                type="button"
                                className="ghost-btn"
                                onClick={() => setMatchResultDeleteTarget(result)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="admin-pagination-row">
                  <p className="admin-pagination-summary">
                    Showing {filteredMatchResults.length === 0 ? 0 : (matchResultPage - 1) * MATCH_RESULTS_PER_PAGE + 1}
                    {' '}-{' '}
                    {Math.min(matchResultPage * MATCH_RESULTS_PER_PAGE, filteredMatchResults.length)}
                    {' '}of {filteredMatchResults.length}
                  </p>
                  <div className="admin-pagination-controls">
                    <button type="button" className="ghost-btn" disabled={matchResultPage <= 1} onClick={() => setMatchResultPage((page) => Math.max(1, page - 1))}>Previous</button>
                    <span>Page {matchResultPage} of {totalMatchResultPages}</span>
                    <button type="button" className="ghost-btn" disabled={matchResultPage >= totalMatchResultPages} onClick={() => setMatchResultPage((page) => Math.min(totalMatchResultPages, page + 1))}>Next</button>
                  </div>
                </div>
              </div>
            ) : null}

            {matchResultEditorOpen ? (
              <MatchResultEditor
                initialValue={matchResultEditing}
                lookups={matchResultLookups}
                busy={matchResultActionBusy === (matchResultEditing ? `save:${matchResultEditing.id}` : 'create')}
                onCancel={() => {
                  setMatchResultEditorOpen(false);
                  setMatchResultEditing(null);
                }}
                onSave={onSaveMatchResult}
              />
            ) : null}

            <DeleteConfirm
              open={!!matchResultDeleteTarget}
              title={matchResultDeleteTarget ? `Delete match result: ${matchResultDeleteTarget.publicId || matchResultDeleteTarget.id}` : 'Delete match result'}
              message={matchResultDeleteTarget ? 'This will permanently remove this match result entry. This action cannot be undone.' : ''}
              details={matchResultDeleteTarget ? `${matchResultDeleteTarget.teamAName || '-'} vs ${matchResultDeleteTarget.teamBName || '-'}` : ''}
              confirmLabel="Delete"
              cancelLabel="Cancel"
              onCancel={() => setMatchResultDeleteTarget(null)}
              onConfirm={async () => {
                if (!matchResultDeleteTarget) return;
                await onDeleteMatchResult(matchResultDeleteTarget.id);
              }}
            />
          </section>
        )}

        {active === 'moderate-reports' && (
          <section id="moderate-reports" className="surface-card">
            <h3>Moderate reports</h3>
            <p>Review incoming player reports and take moderation action.</p>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.8rem', flexWrap: 'wrap' }}>
              <input
                type="search"
                value={reportSearch}
                onChange={(event) => setReportSearch(event.target.value)}
                placeholder="Search by report ID, subject, reporter, or reported user"
                style={{ padding: '0.45rem 0.6rem', minWidth: '280px' }}
              />
              <select value={reportStatusFilter} onChange={(event) => setReportStatusFilter(event.target.value)} style={{ padding: '0.45rem 0.6rem' }}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {reportsLoading ? <p style={{ marginTop: '0.8rem' }}>Loading reports...</p> : null}
            {!reportsLoading && filteredReports.length === 0 ? <p style={{ marginTop: '0.8rem' }}>No reports match your filters.</p> : null}

            {!reportsLoading && filteredReports.length > 0 ? (
              <div style={{ overflowX: 'auto', marginTop: '0.8rem' }}>
                <table className="table-shell auth-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Reported User</th>
                      <th>Reporter</th>
                      <th>Subject</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReports.map((report) => {
                      const createdAtLabel = report.createdAt ? new Date(report.createdAt).toLocaleString() : '-';
                      const isResolved = String(report.status || '').toLowerCase() === 'resolved';
                      const suspendInputValue = reportSuspendUntil[report.id] || '';

                      return (
                        <tr key={report.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{report.id}</td>
                          <td>{report.reportedUsername || report.reportedUserPublicId || '-'}</td>
                          <td>{report.reporterUsername || report.reporterUserPublicId || report.reporterUserId || '-'}</td>
                          <td className="admin-report-subject-cell" title={report.subject || ''}>
                            <span className="admin-report-subject-preview">
                              {report.subject || '-'}
                            </span>
                          </td>
                          <td className="admin-report-description-cell" title={report.description || ''}>
                            <span className="admin-report-description-preview">
                              {report.description || '-'}
                            </span>
                          </td>
                          <td>
                            {report.status || '-'}
                            {report.resolutionAction ? ` (${report.resolutionAction})` : ''}
                          </td>
                          <td>{createdAtLabel}</td>
                          <td>
                            <div className="admin-report-actions">
                              <button
                                type="button"
                                className="ghost-btn"
                                onClick={() => setSelectedReport(report)}
                              >
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="admin-pagination-row">
                  <p className="admin-pagination-summary">
                    Showing {filteredReports.length === 0 ? 0 : (reportPage - 1) * REPORTS_PER_PAGE + 1}
                    {' '}-{' '}
                    {Math.min(reportPage * REPORTS_PER_PAGE, filteredReports.length)}
                    {' '}of {filteredReports.length}
                  </p>
                  <div className="admin-pagination-controls">
                    <button type="button" className="ghost-btn" disabled={reportPage <= 1} onClick={() => setReportPage((page) => Math.max(1, page - 1))}>Previous</button>
                    <span>Page {reportPage} of {totalReportPages}</span>
                    <button type="button" className="ghost-btn" disabled={reportPage >= totalReportPages} onClick={() => setReportPage((page) => Math.min(totalReportPages, page + 1))}>Next</button>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedReport ? (
              <div
                className="surface-card admin-report-modal-backdrop"
                role="presentation"
                onClick={() => setSelectedReport(null)}
              >
                <section
                  className="surface-card tournament-view-modal admin-report-modal-shell"
                  role="dialog"
                  aria-modal="true"
                  onClick={(event) => event.stopPropagation()}
                >
                    <div className="card-header">
                      <div>
                        <h3>Report details</h3>
                        <p className="tournament-view-subtitle">Report #{selectedReport.id}</p>
                      </div>
                      <div>
                        <button type="button" className="ghost-btn" onClick={() => setSelectedReport(null)}>Close</button>
                      </div>
                    </div>

                    <dl className="tournament-view-meta-grid" style={{ marginTop: '1rem' }}>
                      <div className="tournament-view-meta-item">
                        <dt>Reported User</dt>
                        <dd>{selectedReport.reportedUsername || selectedReport.reportedUserPublicId || '-'}</dd>
                      </div>
                      <div className="tournament-view-meta-item">
                        <dt>Reporter</dt>
                        <dd>{selectedReport.reporterUsername || selectedReport.reporterUserPublicId || '-'}</dd>
                      </div>
                      <div className="tournament-view-meta-item">
                        <dt>Status</dt>
                        <dd>
                          {selectedReport.status || '-'}
                          {selectedReport.resolutionAction ? ` (${selectedReport.resolutionAction})` : ''}
                        </dd>
                      </div>
                      <div className="tournament-view-meta-item">
                        <dt>Created</dt>
                        <dd>{selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleDateString() : '-'}</dd>
                      </div>
                    </dl>

                    <article className="surface-card compact admin-report-field-card" style={{ marginTop: '0.8rem' }}>
                      <h4>Subject</h4>
                      <p className="admin-report-modal-field-content">{selectedReport.subject || '-'}</p>
                    </article>

                    <article className="surface-card compact admin-report-field-card admin-report-description-card" style={{ marginTop: '0.8rem' }}>
                      <h4>Description</h4>
                      <p className="admin-report-modal-field-content admin-report-modal-description-content">{selectedReport.description || '-'}</p>
                    </article>

                    <div className="admin-report-actions" style={{ marginTop: '1rem' }}>
                      <button
                        type="button"
                        className="ghost-btn"
                        disabled={String(selectedReport.status || '').toLowerCase() === 'resolved' || reportActionBusy === `delete:${selectedReport.id}`}
                        onClick={() => onModerateReport(selectedReport.id, 'delete')}
                      >
                        {reportActionBusy === `delete:${selectedReport.id}` ? 'Deleting...' : 'Delete Account'}
                      </button>
                      <input
                        type="datetime-local"
                        value={reportSuspendUntil[selectedReport.id] || ''}
                        disabled={String(selectedReport.status || '').toLowerCase() === 'resolved' || reportActionBusy === `suspend:${selectedReport.id}`}
                        onChange={(event) => {
                          const value = event.target.value;
                          setReportSuspendUntil((current) => ({
                            ...current,
                            [selectedReport.id]: value,
                          }));
                        }}
                      />
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={String(selectedReport.status || '').toLowerCase() === 'resolved' || reportActionBusy === `suspend:${selectedReport.id}`}
                        onClick={() => onModerateReport(selectedReport.id, 'suspend')}
                      >
                        {reportActionBusy === `suspend:${selectedReport.id}` ? 'Suspending...' : 'Suspend Account'}
                      </button>
                    </div>
                </section>
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}

function MatchResultEditor({ initialValue, lookups = { tournaments: [], teams: [], registrations: [] }, busy, onCancel, onSave }) {
  const [error, setError] = useState('');
  const [tournamentPublicId, setTournamentPublicId] = useState(initialValue?.tournamentPublicId || '');
  const [roundNumber, setRoundNumber] = useState(initialValue?.roundNumber ?? '');
  const [teamAPublicId, setTeamAPublicId] = useState(initialValue?.teamAPublicId || '');
  const [teamBPublicId, setTeamBPublicId] = useState(initialValue?.teamBPublicId || '');
  const [teamAScore, setTeamAScore] = useState(initialValue?.teamAScore ?? '');
  const [teamBScore, setTeamBScore] = useState(initialValue?.teamBScore ?? '');
  const [winnerTeamPublicId, setWinnerTeamPublicId] = useState(initialValue?.winnerTeamPublicId || '');
  const tournaments = Array.isArray(lookups.tournaments) ? lookups.tournaments : [];
  const teams = Array.isArray(lookups.teams) ? lookups.teams : [];
  const registrations = Array.isArray(lookups.registrations) ? lookups.registrations : [];
  const selectedTournament = tournaments.find((tournament) => tournament.publicId === tournamentPublicId) || null;
  const teamSlotCount = Number(selectedTournament?.teamSlots ?? 2);
  const maxRounds = Math.max(1, Math.ceil(Math.log2(Math.max(2, Number.isFinite(teamSlotCount) ? teamSlotCount : 2))));
  const roundOptions = Array.from({ length: maxRounds }, (_, index) => index + 1);
  const registeredTeamPublicIds = useMemo(() => {
    if (!tournamentPublicId) {
      return new Set();
    }

    return new Set(
      registrations
        .filter((registration) => String(registration?.tournamentId || '') === tournamentPublicId)
        .map((registration) => String(registration?.teamId || '').trim())
        .filter(Boolean),
    );
  }, [registrations, tournamentPublicId]);
  const registeredTeams = useMemo(() => {
    const allowedTeamIds = registeredTeamPublicIds;
    if (!allowedTeamIds.size) {
      return [];
    }

    return teams.filter((team) => allowedTeamIds.has(String(team?.publicId || '').trim()));
  }, [teams, registeredTeamPublicIds]);
  const teamBOptions = useMemo(() => {
    if (!teamAPublicId) {
      return registeredTeams;
    }

    return registeredTeams.filter((team) => team.publicId !== teamAPublicId);
  }, [registeredTeams, teamAPublicId]);

  useEffect(() => {
    if (teamAPublicId && !registeredTeamPublicIds.has(teamAPublicId)) {
      setTeamAPublicId('');
    }
    if (teamBPublicId && !registeredTeamPublicIds.has(teamBPublicId)) {
      setTeamBPublicId('');
    }
    if (winnerTeamPublicId && !registeredTeamPublicIds.has(winnerTeamPublicId)) {
      setWinnerTeamPublicId('');
    }
  }, [registeredTeamPublicIds, teamAPublicId, teamBPublicId, winnerTeamPublicId]);

  useEffect(() => {
    if (teamAPublicId && teamBPublicId && teamAPublicId === teamBPublicId) {
      setTeamBPublicId('');
    }
  }, [teamAPublicId, teamBPublicId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!tournamentPublicId || !roundNumber || !teamAPublicId || !teamBPublicId) {
      setError('Tournament, round, and both teams are required.');
      return;
    }

    try {
      await onSave({
        tournamentPublicId,
        roundNumber: Number(roundNumber),
        teamAPublicId,
        teamBPublicId,
        teamAScore: teamAScore === '' ? null : Number(teamAScore),
        teamBScore: teamBScore === '' ? null : Number(teamBScore),
        winnerTeamPublicId: winnerTeamPublicId || null,
      }, initialValue?.id ?? null);
    } catch (err) {
      setError(err.message || 'Failed to save match result.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: '1rem', overflowY: 'auto', background: 'rgba(2,6,12,0.55)', zIndex: 1400 }}>
      <div style={{ width: 'min(980px, 96%)' }}>
        <section className="surface-card tournament-form-modal" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{initialValue ? 'Edit match result' : 'Create match result'}</h3>
            <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>
          </div>

          {tournaments.length === 0 ? (
            <p style={{ marginTop: '0.9rem' }}>Loading tournament options...</p>
          ) : null}

          <form onSubmit={handleSubmit} className="tournament-modal-form" style={{ marginTop: '1rem' }}>
            <label>
              Tournament
              <select
                value={tournamentPublicId}
                onChange={(event) => {
                  setTournamentPublicId(event.target.value);
                  setRoundNumber('');
                }}
                required
              >
                <option value="">Select tournament</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.publicId || tournament.id} value={tournament.publicId}>
                    {tournament.name} ({tournament.publicId})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Round
              <select value={roundNumber} onChange={(event) => setRoundNumber(event.target.value)} required disabled={!tournamentPublicId}>
                <option value="">{tournamentPublicId ? 'Select round' : 'Select tournament first'}</option>
                {roundOptions.map((round) => (
                  <option key={round} value={round}>
                    {formatRoundLabel(round, maxRounds)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Team A
              <select value={teamAPublicId} onChange={(event) => setTeamAPublicId(event.target.value)} required disabled={!tournamentPublicId || registeredTeams.length === 0}>
                <option value="">Select Team A</option>
                {registeredTeams.map((team) => (
                  <option key={team.publicId || team.id} value={team.publicId}>
                    {team.name} ({team.publicId})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Team B
              <select value={teamBPublicId} onChange={(event) => setTeamBPublicId(event.target.value)} required disabled={!tournamentPublicId || registeredTeams.length === 0}>
                <option value="">Select Team B</option>
                {teamBOptions.map((team) => (
                  <option key={team.publicId || team.id} value={team.publicId}>
                    {team.name} ({team.publicId})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Team A Score
              <input type="number" min="0" value={teamAScore} onChange={(event) => setTeamAScore(event.target.value)} required />
            </label>

            <label>
              Team B Score
              <input type="number" min="0" value={teamBScore} onChange={(event) => setTeamBScore(event.target.value)} required />
            </label>

            <label>
              Winner
              <select value={winnerTeamPublicId} onChange={(event) => setWinnerTeamPublicId(event.target.value)} required disabled={!teamAPublicId && !teamBPublicId}>
                <option value="">Select winner</option>
                {teamAPublicId ? <option value={teamAPublicId}>Team A</option> : null}
                {teamBPublicId ? <option value={teamBPublicId}>Team B</option> : null}
              </select>
            </label>

            {error ? <p className="error-text field-full">{error}</p> : null}

            <div className="cta-row field-full">
              <button type="submit" className="primary-btn" disabled={busy}>
                {busy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </section>
      </div>
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
