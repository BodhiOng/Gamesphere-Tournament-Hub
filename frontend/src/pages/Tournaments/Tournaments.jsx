import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useTournament } from '../../context/TournamentContext';

function Tournaments() {
  const { tournaments, isLoading } = useTournament();
  const navigate = useNavigate();
  const TOURNAMENTS_PAGE_SIZE = 10;
  const [filters, setFilters] = useState({ search: '', game: 'all', region: 'all', status: 'all' });
  const [page, setPage] = useState(1);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [failedListImageIds, setFailedListImageIds] = useState(new Set());
  const [selectedImageLoadFailed, setSelectedImageLoadFailed] = useState(false);

  useEffect(() => {
    setSelectedImageLoadFailed(false);
  }, [selectedTournament?.id, selectedTournament?.image]);

  const isApplyOpen = (status) => String(status || '').trim().toLowerCase() === 'open';
  const getStatusClass = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'completed') return 'status-completed';
    if (normalized === 'live') return 'status-live';
    if (normalized === 'open') return 'status-open';
    if (normalized === 'upcoming') return 'status-upcoming';
    return 'status-unknown';
  };

  const truncatePreview = (value, maxLength = 220) => {
    const text = (value || '').trim();
    if (!text) return 'No description available for this tournament yet.';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
  };

  const formatStart = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const formatDateOnly = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  };

  const filterOptions = useMemo(() => {
    const games = new Set();
    const regions = new Set();
    const statuses = new Set();

    tournaments.forEach((item) => {
      if (item?.game) {
        games.add(item.game);
      }

      if (item?.region) {
        regions.add(item.region);
      }

      if (item?.status) {
        statuses.add(item.status);
      }
    });

    return {
      games: [...games].sort((a, b) => a.localeCompare(b)),
      regions: [...regions].sort((a, b) => a.localeCompare(b)),
      statuses: [...statuses].sort((a, b) => a.localeCompare(b)),
    };
  }, [tournaments]);

  const filtered = useMemo(() => {
    return tournaments.filter((item) => {
      const name = item?.name || '';
      const description = item?.description || '';
      const game = item?.game || '';
      const region = item?.region || '';
      const status = item?.status || '';

      const query = filters.search.trim().toLowerCase();
      const bySearch = name.toLowerCase().includes(query)
        || description.toLowerCase().includes(query);
      const byGame = filters.game === 'all' || item.game === filters.game;
      const byRegion = filters.region === 'all' || item.region === filters.region;
      const byStatus = filters.status === 'all' || item.status === filters.status;

      return bySearch
        && (filters.game === 'all' || game === filters.game)
        && (filters.region === 'all' || region === filters.region)
        && (filters.status === 'all' || status === filters.status);
    });
  }, [tournaments, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / TOURNAMENTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * TOURNAMENTS_PAGE_SIZE;
  const pagedTournaments = filtered.slice(pageStart, pageStart + TOURNAMENTS_PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const onFilterChange = (event) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <section className="tournaments-page">
      <div className="surface-card filter-grid tournaments-filter-grid leaderboard-toolbar">
        <input
          name="search"
          placeholder="Search tournaments"
          onChange={onFilterChange}
          value={filters.search}
        />
        <select name="game" onChange={onFilterChange} value={filters.game}>
          <option value="all">All Games</option>
          {filterOptions.games.map((game) => (
            <option key={game} value={game}>{game}</option>
          ))}
        </select>
        <select name="region" onChange={onFilterChange} value={filters.region}>
          <option value="all">All Regions</option>
          {filterOptions.regions.map((region) => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
        <select name="status" onChange={onFilterChange} value={filters.status}>
          <option value="all">All Statuses</option>
          {filterOptions.statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="tournament-list-single">
        {filtered.length === 0 ? <p>No tournaments found for your current filters.</p> : null}

        {pagedTournaments.map((item) => (
          <div key={item.id} className="surface-card tournament-list-item">
            <span className={`status-pill tournament-card-status ${getStatusClass(item.status)}`}>{item.status || 'Unknown'}</span>

            <div className="tournament-list-media">
              {item.image && !failedListImageIds.has(item.id) ? (
                <img
                  src={item.image}
                  alt={item.name || 'Tournament'}
                  className="tournament-list-image"
                  onError={() => {
                    setFailedListImageIds((prev) => {
                      const next = new Set(prev);
                      next.add(item.id);
                      return next;
                    });
                  }}
                />
              ) : item.image ? (
                <div className="tournament-list-image-placeholder failed">?</div>
              ) : (
                <div className="tournament-list-image-placeholder">No image</div>
              )}
            </div>

            <div className="tournament-list-main">
              <div className="tournament-list-header">
                <h3>{item.name || 'Untitled Tournament'}</h3>
              </div>

              <p className="tournament-list-description">
                {truncatePreview(item.description)}
              </p>

              <div className="tournament-list-meta-chips">
                <span>{item.game || '-'}</span>
                <span>{item.region || '-'}</span>
                <span>Slots: {item.teamSlots ?? '-'}</span>
                <span>Prize: {item.prizePool || '-'}</span>
                <span>Date: {formatDateOnly(item.startDate)}</span>
              </div>
            </div>

            <div className="tournament-list-actions">
              <button type="button" className="primary-btn" onClick={() => setSelectedTournament(item)}>
                View Details
              </button>
            </div>
          </div>
        ))}

        {filtered.length > 0 ? (
          <div className="admin-pagination-row">
            <p className="admin-pagination-summary">
              Showing {pageStart + 1}-{Math.min(pageStart + TOURNAMENTS_PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
              >
                Previous
              </button>
              <span>Page {safePage} / {totalPages}</span>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {selectedTournament ? (
        <div className="tournament-modal-backdrop" role="presentation" onClick={() => {
          setSelectedTournament(null);
          setSelectedImageLoadFailed(false);
        }}>
          <article
            className="surface-card tournament-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Tournament details"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-header tournament-modal-head">
              <h3 className="tournament-modal-title">{selectedTournament.name || 'Untitled Tournament'}</h3>
              <span className="tournament-modal-public-id">{selectedTournament.publicId || '-'}</span>
              <button type="button" className="ghost-btn" onClick={() => {
                setSelectedTournament(null);
                setSelectedImageLoadFailed(false);
              }}>Close</button>
            </div>

            <div className="tournament-modal-layout">
              <article className="tournament-modal-image-panel">
                {selectedTournament.image && !selectedImageLoadFailed ? (
                  <img
                    src={selectedTournament.image}
                    alt={selectedTournament.name || 'Tournament'}
                    className="tournament-modal-image"
                    onError={() => setSelectedImageLoadFailed(true)}
                  />
                ) : selectedTournament.image ? (
                  <div className="tournament-modal-image-placeholder failed">?</div>
                ) : (
                  <div className="tournament-modal-image-placeholder">No image provided</div>
                )}
              </article>

              <article className="tournament-modal-copy-panel">
                <h4>Description</h4>
                <p className="tournament-modal-description">{selectedTournament.description || 'No description available.'}</p>
              </article>
            </div>

            <dl className="tournament-modal-meta-grid">
              <div className="tournament-modal-meta-item">
                <dt>Game</dt>
                <dd>{selectedTournament.game || '-'}</dd>
              </div>
              <div className="tournament-modal-meta-item">
                <dt>Region</dt>
                <dd>{selectedTournament.region || '-'}</dd>
              </div>
              <div className="tournament-modal-meta-item">
                <dt>Status</dt>
                <dd>{selectedTournament.status || '-'}</dd>
              </div>
              <div className="tournament-modal-meta-item">
                <dt>Start Date</dt>
                <dd>{formatStart(selectedTournament.startDate)}</dd>
              </div>
              <div className="tournament-modal-meta-item">
                <dt>Prize Pool</dt>
                <dd>{selectedTournament.prizePool || '-'}</dd>
              </div>
              <div className="tournament-modal-meta-item">
                <dt>Team Slots</dt>
                <dd>{selectedTournament.teamSlots ?? '-'}</dd>
              </div>
              <div className="tournament-modal-meta-item">
                <dt>Teams Registered</dt>
                <dd>{selectedTournament.teamsCount ?? 0}</dd>
              </div>
              <button
                type="button"
                className="primary-btn tournament-modal-apply-btn team-details-disabled-btn"
                disabled={!isApplyOpen(selectedTournament?.status)}
                onClick={() => {
                  if (!selectedTournament?.id) {
                    return;
                  }

                  setSelectedTournament(null);
                  navigate(`/tournaments/${selectedTournament.publicId || selectedTournament.id}`);
                }}
              >
                Apply
              </button>
            </dl>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default Tournaments;
