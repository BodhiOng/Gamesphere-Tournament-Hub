import { useEffect, useMemo, useState } from 'react';
import MatchCard from '../../components/MatchCard/MatchCard';
import { getMyMatches } from '../../api/matchApi';
import { useAuth } from '../../context/AuthContext';

function MatchSchedule() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ game: 'all', status: 'all', sort: 'closest' });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [copiedVenueKey, setCopiedVenueKey] = useState('');

  const pageSize = 8;

  const formatDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setEntries([]);
      return;
    }

    let active = true;

    setLoading(true);
    setError('');

    getMyMatches(user, {
      page: 1,
      pageSize: 1000,
    })
      .then((data) => {
        if (!active) {
          return;
        }

        setEntries(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setEntries([]);
        setError('Unable to load your schedule right now.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = entries.filter((item) => {
      const tournamentStatus = String(item?.tournamentStatus || '').trim().toLowerCase();
      if (tournamentStatus !== 'open' && tournamentStatus !== 'live') {
        return false;
      }

      if (filters.game !== 'all' && item?.tournamentGame !== filters.game) {
        return false;
      }

      if (filters.status === 'open' && tournamentStatus !== 'open') {
        return false;
      }

      if (filters.status === 'live' && tournamentStatus !== 'live') {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        item?.tournamentName,
        item?.teamName,
        item?.tournamentGame,
        item?.tournamentRegion,
        item?.tournamentVenue,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });

    filtered.sort((left, right) => {
      const leftTime = new Date(left?.tournamentStartDate || 0).getTime();
      const rightTime = new Date(right?.tournamentStartDate || 0).getTime();
      const leftSafe = Number.isNaN(leftTime) ? 0 : leftTime;
      const rightSafe = Number.isNaN(rightTime) ? 0 : rightTime;

      if (filters.sort === 'farthest') {
        return rightSafe - leftSafe;
      }

      return leftSafe - rightSafe;
    });

    return filtered;
  }, [entries, filters.game, filters.sort, filters.status, searchQuery]);

  const totalItems = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(safePage * pageSize, totalItems);
  const pagedEntries = filteredEntries.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const onFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const gameOptions = [...new Set(entries
    .filter((item) => {
      const tournamentStatus = String(item?.tournamentStatus || '').trim().toLowerCase();
      return tournamentStatus === 'open' || tournamentStatus === 'live';
    })
    .map((item) => item?.tournamentGame)
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  const copyVenue = async (entry) => {
    const venue = String(entry?.tournamentVenue || '').trim();
    if (!venue) {
      return;
    }

    const key = `${entry?.id ?? ''}:${entry?.teamId ?? ''}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(venue);
      } else {
        const temp = document.createElement('textarea');
        temp.value = venue;
        temp.setAttribute('readonly', 'readonly');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }

      setCopiedVenueKey(key);
      window.setTimeout(() => {
        setCopiedVenueKey((current) => (current === key ? '' : current));
      }, 1400);
    } catch {
      setError('Unable to copy venue address.');
    }
  };

  return (
    <section className="stack-list">
      <input
        type="text"
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search by tournament, team, game, region, or venue"
      />

      <div className="filter-grid">
        <select name="game" onChange={onFilterChange} value={filters.game}>
          <option value="all">All Games</option>
          {gameOptions.map((game) => (
            <option key={game} value={game}>{game}</option>
          ))}
        </select>
        <select name="status" onChange={onFilterChange} value={filters.status}>
          <option value="all">Open + Live</option>
          <option value="open">Open</option>
          <option value="live">Live</option>
        </select>
        <select name="sort" onChange={onFilterChange} value={filters.sort}>
          <option value="closest">Date: Closest</option>
          <option value="farthest">Date: Farthest</option>
        </select>
      </div>

      {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}

      {loading ? (
        <p>Loading schedule…</p>
      ) : filteredEntries.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>
          No open or live tournament registrations found for your teams.
        </p>
      ) : (
        <div className="grid two">
          {pagedEntries.map((item) => (
            <MatchCard
              key={item.id}
              match={{
                heading: item.tournamentName || 'Tournament',
                date: formatDate(item.tournamentStartDate),
                status: item.tournamentStatus || 'Unknown',
                tournamentName: item.tournamentGame || 'Unknown Game',
                teamName: item.teamName,
                venue: item.tournamentVenue,
                copyLabel:
                  copiedVenueKey === `${item.id}:${item.teamId}`
                    ? 'Venue copied'
                    : `Venue: ${item.tournamentVenue || 'N/A'}`,
                onCopyVenue: () => copyVenue(item),
              }}
            />
          ))}
        </div>
      )}

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
    </section>
  );
}

export default MatchSchedule;
