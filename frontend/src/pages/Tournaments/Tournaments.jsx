import { useMemo, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useTournament } from '../../context/TournamentContext';

function Tournaments() {
  const { tournaments, isLoading } = useTournament();
  const [filters, setFilters] = useState({ search: '', game: 'all', region: 'all', status: 'all' });
  const [selectedTournament, setSelectedTournament] = useState(null);

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
      const game = item?.game || '';
      const region = item?.region || '';
      const status = item?.status || '';

      const bySearch = name.toLowerCase().includes(filters.search.trim().toLowerCase());
      const byGame = filters.game === 'all' || item.game === filters.game;
      const byRegion = filters.region === 'all' || item.region === filters.region;
      const byStatus = filters.status === 'all' || item.status === filters.status;

      return bySearch
        && (filters.game === 'all' || game === filters.game)
        && (filters.region === 'all' || region === filters.region)
        && (filters.status === 'all' || status === filters.status);
    });
  }, [tournaments, filters]);

  const onFilterChange = (event) => {
    setFilters((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <section className="tournaments-page">
      <div className="surface-card filter-grid tournaments-filter-grid">
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

        {filtered.map((item) => (
          <div key={item.id} className="surface-card tournament-list-item">
            <div className="tournament-list-main">
              <h3>{item.name || 'Untitled Tournament'}</h3>
              <p>
                {item.game || '-'} | {item.region || '-'} | {item.status || '-'}
              </p>
              <p>
                Start: {item.startDate || '-'} | Prize: {item.prizePool || '-'}
              </p>
            </div>
            <div className="tournament-list-actions">
              <button type="button" className="primary-btn" onClick={() => setSelectedTournament(item)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedTournament ? (
        <div className="tournament-modal-backdrop" role="presentation" onClick={() => setSelectedTournament(null)}>
          <article
            className="surface-card tournament-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Tournament details"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-header">
              <h3>{selectedTournament.name || 'Untitled Tournament'}</h3>
              <button type="button" className="ghost-btn" onClick={() => setSelectedTournament(null)}>Close</button>
            </div>

            <div className="tournament-modal-grid">
              <p><strong>Game:</strong> {selectedTournament.game || '-'}</p>
              <p><strong>Region:</strong> {selectedTournament.region || '-'}</p>
              <p><strong>Status:</strong> {selectedTournament.status || '-'}</p>
              <p><strong>Start Date:</strong> {selectedTournament.startDate || '-'}</p>
              <p><strong>Prize Pool:</strong> {selectedTournament.prizePool || '-'}</p>
              <p><strong>Team Slots:</strong> {selectedTournament.teamSlots ?? '-'}</p>
              <p><strong>Teams Registered:</strong> {selectedTournament.teamsCount ?? 0}</p>
              <p><strong>Public ID:</strong> {selectedTournament.publicId || '-'}</p>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default Tournaments;
