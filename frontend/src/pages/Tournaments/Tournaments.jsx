import { useMemo, useState } from 'react';
import TournamentCard from '../../components/TournamentCard/TournamentCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useTournament } from '../../context/TournamentContext';

function Tournaments() {
  const { tournaments, isLoading } = useTournament();
  const [filters, setFilters] = useState({ search: '', game: 'all', region: 'all', status: 'all' });

  const filtered = useMemo(() => {
    return tournaments.filter((item) => {
      const bySearch = item.name.toLowerCase().includes(filters.search.toLowerCase());
      const byGame = filters.game === 'all' || item.game === filters.game;
      const byRegion = filters.region === 'all' || item.region === filters.region;
      const byStatus = filters.status === 'all' || item.status === filters.status;
      return bySearch && byGame && byRegion && byStatus;
    });
  }, [tournaments, filters]);

  const onFilterChange = (event) => {
    setFilters((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <section>
      <h2>Tournament Listing</h2>
      <div className="surface-card filter-grid">
        <input name="search" placeholder="Search tournaments" onChange={onFilterChange} value={filters.search} />
        <select name="game" onChange={onFilterChange} value={filters.game}>
          <option value="all">All Games</option>
          <option value="Valorant">Valorant</option>
          <option value="League of Legends">League of Legends</option>
          <option value="Apex Legends">Apex Legends</option>
        </select>
        <select name="region" onChange={onFilterChange} value={filters.region}>
          <option value="all">All Regions</option>
          <option value="NA">NA</option>
          <option value="EU">EU</option>
          <option value="APAC">APAC</option>
        </select>
        <select name="status" onChange={onFilterChange} value={filters.status}>
          <option value="all">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Live">Live</option>
          <option value="Upcoming">Upcoming</option>
        </select>
      </div>

      <div className="grid two">
        {filtered.map((item) => (
          <TournamentCard key={item.id} tournament={item} />
        ))}
      </div>
    </section>
  );
}

export default Tournaments;
