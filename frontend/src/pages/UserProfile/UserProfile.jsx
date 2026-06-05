import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createUserReport, getPublicUserProfile } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function UserProfile() {
  const REPORT_SUBJECT_MAX = 120;
  const REPORT_DESCRIPTION_MAX = 1000;
  const { userPublicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubject, setReportSubject] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [historyTeamFilter, setHistoryTeamFilter] = useState('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historySortOrder, setHistorySortOrder] = useState('desc');
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 10;

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (isMounted) {
        setLoading(true);
        setError('');
      }

      try {
        const result = await getPublicUserProfile(userPublicId);
        if (isMounted) {
          setProfile(result);
        }
      } catch (err) {
        if (isMounted) {
          setProfile(null);
          setError(err?.message || 'Unable to load this player profile right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [userPublicId]);

  const teams = useMemo(() => (Array.isArray(profile?.teams) ? profile.teams : []), [profile]);
  const tournamentHistory = useMemo(() => (Array.isArray(profile?.tournamentHistory) ? profile.tournamentHistory : []), [profile]);
  const historyTeamOptions = useMemo(() => {
    const uniqueTeams = Array.from(new Set(
      tournamentHistory
        .map((entry) => String(entry?.teamName || '').trim())
        .filter(Boolean)
    ));

    return uniqueTeams.sort((left, right) => left.localeCompare(right));
  }, [tournamentHistory]);
  const historyStatusOptions = useMemo(() => {
    const uniqueStatuses = Array.from(new Set(
      tournamentHistory
        .map((entry) => String(entry?.tournamentStatus || '').trim())
        .filter(Boolean)
    ));

    return uniqueStatuses.sort((left, right) => left.localeCompare(right));
  }, [tournamentHistory]);
  const filteredHistory = useMemo(() => {
    const filtered = tournamentHistory.filter((entry) => {
      const matchesTeam = historyTeamFilter === 'all' || String(entry?.teamName || '') === historyTeamFilter;
      const matchesStatus = historyStatusFilter === 'all' || String(entry?.tournamentStatus || '') === historyStatusFilter;
      return matchesTeam && matchesStatus;
    });

    return [...filtered].sort((left, right) => {
      const leftDate = left?.tournamentStartDate ? new Date(left.tournamentStartDate).getTime() : 0;
      const rightDate = right?.tournamentStartDate ? new Date(right.tournamentStartDate).getTime() : 0;
      return historySortOrder === 'desc' ? rightDate - leftDate : leftDate - rightDate;
    });
  }, [tournamentHistory, historyTeamFilter, historyStatusFilter, historySortOrder]);
  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE));
  const safeHistoryPage = Math.min(historyPage, historyTotalPages);
  const historyStart = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE;
  const pagedHistory = filteredHistory.slice(historyStart, historyStart + HISTORY_PAGE_SIZE);
  const username = profile?.user?.username || '-';
  const profilePublicId = String(profile?.user?.publicId || '').trim();
  const currentUserPublicId = String(user?.publicId || '').trim();
  const currentUserId = user?.id != null ? String(user.id) : '';
  const profileUserId = profile?.user?.id != null ? String(profile.user.id) : '';
  const isSelfProfile = Boolean(
    (currentUserPublicId && profilePublicId && currentUserPublicId === profilePublicId)
      || (currentUserId && profileUserId && currentUserId === profileUserId)
  );
  const canReportUser = Boolean(user && profilePublicId && !isSelfProfile);
  const isSubjectTooLong = reportSubject.length > REPORT_SUBJECT_MAX;
  const isDescriptionTooLong = reportDescription.length > REPORT_DESCRIPTION_MAX;
  const reportLengthError = isSubjectTooLong || isDescriptionTooLong
    ? `Keep subject under ${REPORT_SUBJECT_MAX} characters and description under ${REPORT_DESCRIPTION_MAX} characters.`
    : '';

  useEffect(() => {
    setHistoryPage(1);
  }, [historyTeamFilter, historyStatusFilter, historySortOrder, tournamentHistory]);

  const closeReportModal = () => {
    setReportOpen(false);
    setReportSubject('');
    setReportDescription('');
    setReportError('');
    setReportSuccess('');
  };

  const onSubmitReport = async (event) => {
    event.preventDefault();
    setReportError('');
    setReportSuccess('');

    if (!canReportUser) {
      setReportError('You cannot report this profile.');
      return;
    }

    if (isSubjectTooLong || isDescriptionTooLong) {
      setReportError(`Subject must be at most ${REPORT_SUBJECT_MAX} characters and description at most ${REPORT_DESCRIPTION_MAX} characters.`);
      return;
    }

    setReporting(true);
    try {
      await createUserReport(user, {
        reportedUserPublicId: profilePublicId,
        subject: reportSubject,
        description: reportDescription,
      });
      setReportSuccess('Report submitted. Admin moderators will review it.');
      setReportSubject('');
      setReportDescription('');
    } catch (err) {
      setReportError(err?.message || 'Unable to submit report right now.');
    } finally {
      setReporting(false);
    }
  };

  return (
    <section className="user-profile-page">
      <article className="surface-card user-profile-header-card">
        <div className="user-profile-header-row">
          <div>
            <h2>{username}</h2>
            {profile?.user?.publicId ? (
              <p className="user-profile-public-id">ID: {profile.user.publicId}</p>
            ) : null}
          </div>
          <div className="cta-row" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="ghost-btn danger-btn"
              disabled={!canReportUser}
              onClick={() => {
                setReportOpen(true);
                setReportError('');
                setReportSuccess('');
              }}
            >
              Report User
            </button>
          </div>
        </div>
        {!user ? <p style={{ marginTop: '0.55rem' }}>Log in to submit a report.</p> : null}
      </article>

      {loading ? (
        <article className="surface-card" style={{ marginTop: '1rem' }}>
          <p>Loading player profile...</p>
        </article>
      ) : null}

      {error ? (
        <article className="surface-card" style={{ marginTop: '1rem' }}>
          <p className="error-text">{error}</p>
        </article>
      ) : null}

      {!loading && !error ? (
        <>
          <article className="surface-card" style={{ marginTop: '1rem' }}>
            <div className="user-profile-section-head">
              <h3>Enrolled Teams</h3>
              <span>{teams.length}</span>
            </div>

            {teams.length === 0 ? (
              <p style={{ marginTop: '0.6rem' }}>No enrolled teams found.</p>
            ) : (
              <div className="user-profile-team-grid" style={{ marginTop: '0.75rem' }}>
                {teams.map((team) => (
                  <button
                    key={`${team.publicId || team.id}`}
                    type="button"
                    className="user-profile-team-chip"
                    onClick={() => navigate(`/team-management?view=discover&teamId=${team.id}`)}
                  >
                    <span>{team.name}</span>
                    <small>{team.isCaptain ? 'Captain' : 'Member'}</small>
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="surface-card" style={{ marginTop: '1rem' }}>
            <div className="user-profile-section-head">
              <h3>Tournament History</h3>
              <span>{filteredHistory.length}</span>
            </div>

            <div className="user-profile-history-controls" style={{ marginTop: '0.65rem' }}>
              <label className="team-details-tournament-filter">
                <span>Team</span>
                <select value={historyTeamFilter} onChange={(event) => setHistoryTeamFilter(event.target.value)}>
                  <option value="all">All Teams</option>
                  {historyTeamOptions.map((teamName) => (
                    <option key={teamName} value={teamName}>{teamName}</option>
                  ))}
                </select>
              </label>
              <label className="team-details-tournament-filter">
                <span>Status</span>
                <select value={historyStatusFilter} onChange={(event) => setHistoryStatusFilter(event.target.value)}>
                  <option value="all">All Statuses</option>
                  {historyStatusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setHistorySortOrder((current) => (current === 'desc' ? 'asc' : 'desc'))}
              >
                Sort Date: {historySortOrder === 'desc' ? 'Newest to Oldest' : 'Oldest to Newest'}
              </button>
            </div>

            <div className="team-details-roster-table-shell" style={{ marginTop: '0.65rem' }}>
              <table className="team-details-roster-table user-profile-history-table">
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Team</th>
                    <th>Status</th>
                    <th>Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedHistory.length > 0 ? pagedHistory.map((entry, index) => (
                    <tr
                      key={`${entry.tournamentPublicId || entry.tournamentId || index}-${entry.teamPublicId || entry.teamId || index}`}
                      className="team-details-tournament-row-item"
                      onClick={() => navigate(`/tournaments/${entry.tournamentId}`)}
                    >
                      <td>{entry.tournamentName}</td>
                      <td>{entry.teamName}</td>
                      <td className="team-details-tournament-status">{entry.tournamentStatus || '-'}</td>
                      <td>{formatDate(entry.tournamentStartDate)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4}>No tournament history found for the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="roster-pagination-row" style={{ marginTop: '0.65rem' }}>
              <span>
                Showing {filteredHistory.length === 0 ? 0 : historyStart + 1}-
                {Math.min(historyStart + HISTORY_PAGE_SIZE, filteredHistory.length)} of {filteredHistory.length}
              </span>
              <div className="roster-pagination-controls">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setHistoryPage((current) => Math.max(1, current - 1))}
                  disabled={safeHistoryPage <= 1}
                >
                  Previous
                </button>
                <span>Page {safeHistoryPage} / {historyTotalPages}</span>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setHistoryPage((current) => Math.min(historyTotalPages, current + 1))}
                  disabled={safeHistoryPage >= historyTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </article>
        </>
      ) : null}

      {reportOpen ? (
        <div className="tournament-modal-backdrop" role="presentation" onClick={closeReportModal}>
          <article className="surface-card tournament-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="team-details-modal-head">
              <h3>Report {username}</h3>
              <button type="button" className="ghost-btn" onClick={closeReportModal}>Close</button>
            </div>

            <form onSubmit={onSubmitReport} className="user-report-form">
              <label className="team-inline-field">
                Subject
                <input
                  value={reportSubject}
                  onChange={(event) => setReportSubject(event.target.value)}
                  placeholder={`Brief reason for the report (up to ${REPORT_SUBJECT_MAX} characters)`}
                  className={isSubjectTooLong ? 'team-input-error' : ''}
                  aria-invalid={isSubjectTooLong}
                  required
                />
                <span className="user-report-limit-text">
                  {reportSubject.length}/{REPORT_SUBJECT_MAX} characters
                </span>
              </label>

              <label className="team-inline-field">
                Description
                <textarea
                  value={reportDescription}
                  onChange={(event) => setReportDescription(event.target.value)}
                  rows={4}
                  placeholder={`Describe what happened (up to ${REPORT_DESCRIPTION_MAX} characters)`}
                  className={isDescriptionTooLong ? 'team-input-error' : ''}
                  aria-invalid={isDescriptionTooLong}
                  required
                />
                <span className="user-report-limit-text">
                  {reportDescription.length}/{REPORT_DESCRIPTION_MAX} characters
                </span>
              </label>

              {reportError ? <p className="error-text">{reportError}</p> : null}
              {!reportError && reportLengthError ? <p className="error-text">{reportLengthError}</p> : null}
              {reportSuccess ? <p className="success-text">{reportSuccess}</p> : null}

              <div className="team-details-modal-actions">
                <button type="submit" className="primary-btn" disabled={reporting || !canReportUser || isSubjectTooLong || isDescriptionTooLong}>
                  {reporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default UserProfile;
