import { useEffect, useMemo, useState } from 'react';
import { getPublicMatchResultFeed } from '../../api/leaderboardApi';

const PAGE_SIZE = 10;

function formatMatchTime(iso) {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatRound(roundNumber) {
  const value = Number(roundNumber);
  if (!Number.isFinite(value) || value < 1) return '-';
  return `Round ${value}`;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function formatStatus(value) {
  const normalized = normalizeText(value);
  if (!normalized) return 'Unknown';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getStatusClass(value) {
  const normalized = normalizeText(value);
  if (normalized === 'live') return 'status-live';
  if (normalized === 'completed') return 'status-completed';
  if (normalized === 'upcoming') return 'status-upcoming';
  if (normalized === 'open') return 'status-open';
  return 'status-unknown';
}

function Leaderboards() {
  const [matchResults, setMatchResults] = useState([]);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedTournament, setSelectedTournament] = useState(null);

  useEffect(() => {
    getPublicMatchResultFeed().then(setMatchResults);
  }, []);

  const allTournamentGroups = useMemo(() => {
    const allowedStatuses = new Set(['live', 'completed']);

    const byTournament = new Map();

    matchResults.forEach((item) => {
      const status = normalizeText(item?.tournament?.status);
      if (!allowedStatuses.has(status)) {
        return;
      }

      const tournamentKey = item?.tournament?.publicId || item?.tournament?.name || 'unknown';
      if (!byTournament.has(tournamentKey)) {
        byTournament.set(tournamentKey, {
          tournament: item.tournament,
          results: [],
          latestCreatedAtUtc: item.createdAtUtc || null,
        });
      }

      const group = byTournament.get(tournamentKey);
      group.results.push(item);
      if (!group.latestCreatedAtUtc || new Date(item.createdAtUtc || 0) > new Date(group.latestCreatedAtUtc || 0)) {
        group.latestCreatedAtUtc = item.createdAtUtc || null;
      }
    });

    const groups = Array.from(byTournament.values()).map((group) => {
      const results = [...group.results].sort((left, right) => {
        const leftTime = new Date(left?.createdAtUtc || 0).getTime();
        const rightTime = new Date(right?.createdAtUtc || 0).getTime();
        return rightTime - leftTime;
      });

      return { ...group, results };
    });

    groups.sort((left, right) => {
      const leftTime = new Date(left.latestCreatedAtUtc || 0).getTime();
      const rightTime = new Date(right.latestCreatedAtUtc || 0).getTime();
      return rightTime - leftTime;
    });

    return groups;
  }, [matchResults]);

  const gameOptions = useMemo(() => {
    return [...new Set(allTournamentGroups.map((group) => group?.tournament?.game).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
  }, [allTournamentGroups]);

  const regionOptions = useMemo(() => {
    return [...new Set(allTournamentGroups.map((group) => group?.tournament?.region).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
  }, [allTournamentGroups]);

  const tournamentGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allTournamentGroups.filter((group) => {
      if (statusFilter !== 'all' && normalizeText(group?.tournament?.status) !== statusFilter) {
        return false;
      }

      if (gameFilter !== 'all' && normalizeText(group?.tournament?.game) !== gameFilter) {
        return false;
      }

      if (regionFilter !== 'all' && normalizeText(group?.tournament?.region) !== regionFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const tournamentHaystack = [
        group?.tournament?.name,
        group?.tournament?.publicId,
        group?.tournament?.status,
        group?.tournament?.game,
        group?.tournament?.region,
      ]
        .filter(Boolean)
        .map(normalizeText);

      if (tournamentHaystack.some((value) => value.includes(query))) {
        return true;
      }

      return group.results.some((item) => [
        item?.publicId,
        item?.teamA?.name,
        item?.teamB?.name,
        item?.winner?.name,
        item?.roundNumber,
      ]
        .filter(Boolean)
        .map(normalizeText)
        .some((value) => value.includes(query)));
    });
  }, [allTournamentGroups, gameFilter, regionFilter, search, statusFilter]);

  const totalItems = tournamentGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = totalItems === 0 ? 0 : Math.min(safePage * PAGE_SIZE, totalItems);
  const pagedGroups = tournamentGroups.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [gameFilter, regionFilter, search, statusFilter]);

  return (
    <section className="stack-list">
      <div className="surface-card leaderboard-toolbar">
        <input
          type="text"
          className="leaderboard-search-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by tournament, team, winner, round, or match ID"
        />
        <div className="leaderboard-filter-grid">
          <label className="leaderboard-filter-field">
            <span>Game</span>
            <select value={gameFilter} onChange={(event) => setGameFilter(event.target.value)}>
              <option value="all">All games</option>
              {gameOptions.map((game) => (
                <option key={game} value={normalizeText(game)}>{game}</option>
              ))}
            </select>
          </label>
          <label className="leaderboard-filter-field">
            <span>Region</span>
            <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
              <option value="all">All regions</option>
              {regionOptions.map((region) => (
                <option key={region} value={normalizeText(region)}>{region}</option>
              ))}
            </select>
          </label>
          <label className="leaderboard-filter-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>
      </div>

      <div className="match-result-list">
        {pagedGroups.length === 0 ? (
          <p className="surface-card">No live or completed tournament match results match your search.</p>
        ) : pagedGroups.map((group) => (
          <article key={group.tournament.publicId || group.tournament.name} className="surface-card match-result-item">
            <div className="match-result-item-main">
              <div className="match-result-item-header">
                <div className="match-result-item-copy">
                  <div className="match-result-item-title-row">
                    <h3>{group.tournament.name || 'Tournament'}</h3>
                    <span className={`status-pill ${getStatusClass(group.tournament.status)}`}>
                      {formatStatus(group.tournament.status)}
                    </span>
                  </div>
                  <div className="tournament-list-meta-chips match-result-meta-chips">
                    <span>{group.tournament.game || 'Unknown game'}</span>
                    <span>{group.tournament.region || 'Unknown region'}</span>
                    <span>{group.results.length} match{group.results.length === 1 ? '' : 'es'}</span>
                  </div>
                </div>
                <div className="match-result-item-actions">
                  <span className="status-pill match-result-count-pill">
                    {group.results.length} result{group.results.length === 1 ? '' : 's'}
                  </span>
                  <button type="button" className="ghost-btn" onClick={() => setSelectedTournament(group)}>
                    View Details
                  </button>
                </div>
              </div>

              <div className="match-result-item-meta">
                <span>
                  <strong>Tournament ID</strong>
                  <em>{group.tournament.publicId || '-'}</em>
                </span>
                <span>
                  <strong>Latest Result</strong>
                  <em>{formatMatchTime(group.latestCreatedAtUtc)}</em>
                </span>
                <span>
                  <strong>Total Matches</strong>
                  <em>{group.results.length}</em>
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="roster-pagination-row">
        <span>
          Showing {totalItems === 0 ? 0 : start}-{end} of {totalItems}
        </span>
        <div className="roster-pagination-controls">
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

      {selectedTournament ? (
        <div className="tournament-modal-backdrop" role="presentation" onClick={() => setSelectedTournament(null)}>
          <article
            className="surface-card tournament-modal leaderboard-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Tournament match results details"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-header tournament-modal-head leaderboard-modal-head">
              <div className="leaderboard-modal-heading">
                <h3 className="tournament-modal-title">{selectedTournament.tournament.name || 'Tournament'}</h3>
                <p className="tournament-modal-public-id">
                  {selectedTournament.tournament.publicId || '-'}
                </p>
              </div>
              <button type="button" className="ghost-btn" onClick={() => setSelectedTournament(null)}>Close</button>
            </div>

            <dl className="tournament-modal-meta-grid leaderboard-modal-meta-grid">
              <div className="tournament-modal-meta-item">
                <dt>Status</dt>
                <dd>
                  <span className={`status-pill ${getStatusClass(selectedTournament.tournament.status)}`}>
                    {formatStatus(selectedTournament.tournament.status)}
                  </span>
                </dd>
              </div>
              <div className="tournament-modal-meta-item">
                <dt>Game</dt>
                <dd>{selectedTournament.tournament.game || '-'}</dd>
              </div>
              <div className="tournament-modal-meta-item">
                <dt>Region</dt>
                <dd>{selectedTournament.tournament.region || '-'}</dd>
              </div>
              <div className="tournament-modal-meta-item">
                <dt>Match Count</dt>
                <dd>{selectedTournament.results.length}</dd>
              </div>
            </dl>

            <article className="leaderboard-modal-results">
              <div className="leaderboard-modal-results-head">
                <div>
                  <h4>Match Results</h4>
                  <p>Latest entries for this tournament, sorted from newest to oldest.</p>
                </div>
              </div>
              <div className="table-shell leaderboard-results-shell">
                <table className="leaderboard-results-table">
                  <thead>
                    <tr>
                      <th>Match ID</th>
                      <th>Round</th>
                      <th>Matchup</th>
                      <th>Score</th>
                      <th>Winner</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTournament.results.map((item) => (
                      <tr key={item.publicId || item.id}>
                        <td>{item.publicId || item.id || '-'}</td>
                        <td>{formatRound(item.roundNumber)}</td>
                        <td>{item.teamA?.name || '-'} vs {item.teamB?.name || '-'}</td>
                        <td>{item.teamAScore} - {item.teamBScore}</td>
                        <td>{item.winner?.name || '-'}</td>
                        <td>{formatMatchTime(item.createdAtUtc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default Leaderboards;
