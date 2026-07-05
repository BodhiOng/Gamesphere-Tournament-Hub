import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTournament } from '../../context/TournamentContext';
import { getPublicMatchResultFeed } from '../../api/leaderboardApi';
import { useAuth } from '../../context/AuthContext';

const CAROUSEL_STEP = 340;

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCarouselStatus(item) {
  return normalizeText(item?.status || item?.tournament?.status);
}

function Home() {
  const { tournaments, isLoading } = useTournament();
  const { user, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const tournamentsTrackRef = useRef(null);
  const leaderboardTrackRef = useRef(null);
  const [leaderboardGroups, setLeaderboardGroups] = useState([]);

  useEffect(() => {
    let active = true;
    getPublicMatchResultFeed({ page: 1, pageSize: 10 })
      .then((data) => {
        if (active) {
          setLeaderboardGroups(Array.isArray(data?.items) ? data.items : []);
        }
      })
      .catch(() => {
        if (active) {
          setLeaderboardGroups([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const overview = useMemo(() => {
    const items = Array.isArray(tournaments) ? tournaments : [];
    const liveCount = items.filter((item) => normalizeText(item.status) === 'live').length;
    const upcomingCount = items.filter((item) => normalizeText(item.status) === 'upcoming').length;
    const completedCount = items.filter((item) => normalizeText(item.status) === 'completed').length;

    return {
      total: items.length,
      liveCount,
      upcomingCount,
      completedCount,
    };
  }, [tournaments]);

  const tournamentCards = useMemo(() => {
    const items = Array.isArray(tournaments) ? tournaments : [];
    return [...items]
      .sort((left, right) => {
        const leftTime = new Date(left?.startDate || 0).getTime();
        const rightTime = new Date(right?.startDate || 0).getTime();
        return rightTime - leftTime;
      })
      .slice(0, 10);
  }, [tournaments]);

  const leaderboardCards = useMemo(() => leaderboardGroups, [leaderboardGroups]);

  const scrollCarousel = (ref, direction) => {
    ref.current?.scrollBy({ left: direction * CAROUSEL_STEP, behavior: 'smooth' });
  };

  const handleCreateTeam = () => {
    if (!isAuthReady) {
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: '/team-management' } });
      return;
    }

    navigate('/team-management');
  };

  return (
    <>
      <section className="hero-banner">
        <p className="eyebrow">Cloud-Powered Esports Platform</p>
        <h2>Run tournaments, rally teams, and dominate leaderboards in one hub.</h2>
        <div className="cta-row">
          <button type="button" className="primary-btn" onClick={handleCreateTeam}>Create Team</button>
          <button type="button" className="ghost-btn" onClick={() => navigate('/tournaments')}>Browse Tournaments</button>
        </div>
      </section>

      <section className="surface-card home-carousel-section">
        <div className="carousel-header">
          <div>
            <h3>Available Tournaments</h3>
            <p style={{ marginTop: '0.5rem' }}>
              Browse the tournament catalog, filter by game or region, and open any event to view its details and registration status.
            </p>
          </div>
          <div className="carousel-controls">
            <button type="button" className="carousel-arrow-btn" onClick={() => scrollCarousel(tournamentsTrackRef, -1)} aria-label="Scroll tournaments left">
              ←
            </button>
            <button type="button" className="carousel-arrow-btn" onClick={() => scrollCarousel(tournamentsTrackRef, 1)} aria-label="Scroll tournaments right">
              →
            </button>
          </div>
        </div>

        <div className="carousel-track" ref={tournamentsTrackRef}>
          {isLoading ? (
            <div className="carousel-empty">Loading tournaments...</div>
          ) : tournamentCards.length > 0 ? (
            <>
              {tournamentCards.map((tournament) => (
                <article key={tournament.publicId || tournament.id} className="surface-card compact carousel-card">
                  <div className="card-header">
                    <h4>{tournament.name || 'Tournament'}</h4>
                    <span className="status-pill">{tournament.status || 'Unknown'}</span>
                  </div>
                  <p>{tournament.game || 'Unknown game'} · {tournament.region || 'Unknown region'}</p>
                  <ul className="detail-list">
                    <li>Start Date: {formatDate(tournament.startDate)}</li>
                    <li>Prize Pool: {tournament.prizePool || '-'}</li>
                    <li>Team Slots: {tournament.teamSlots || '-'}</li>
                  </ul>
                </article>
              ))}
              <Link to="/tournaments" className="surface-card compact carousel-card carousel-action-card">
                <div className="card-header">
                  <h4>Browse Tournaments</h4>
                  <span className="status-pill">Explore</span>
                </div>
                <p>Open the full tournament directory and browse every live, upcoming, and completed event.</p>
                <span className="carousel-action-link">Open tournaments →</span>
              </Link>
            </>
          ) : (
            <Link to="/tournaments" className="surface-card compact carousel-card carousel-action-card">
              <div className="card-header">
                <h4>Browse Tournaments</h4>
                <span className="status-pill">Explore</span>
              </div>
              <p>Open the full tournament directory and browse every live, upcoming, and completed event.</p>
              <span className="carousel-action-link">Open tournaments →</span>
            </Link>
          )}
        </div>
      </section>

      <section className="surface-card home-carousel-section">
        <div className="carousel-header">
          <div>
            <h3>Leaderboards</h3>
            <p style={{ marginTop: '0.5rem' }}>
              Check live and completed match results, search by tournament or team, and follow the current competitive picture without logging in.
            </p>
          </div>
          <div className="carousel-controls">
            <button type="button" className="carousel-arrow-btn" onClick={() => scrollCarousel(leaderboardTrackRef, -1)} aria-label="Scroll leaderboards left">
              ←
            </button>
            <button type="button" className="carousel-arrow-btn" onClick={() => scrollCarousel(leaderboardTrackRef, 1)} aria-label="Scroll leaderboards right">
              →
            </button>
          </div>
        </div>

        <div className="carousel-track" ref={leaderboardTrackRef}>
          {leaderboardCards.length > 0 ? (
            <>
              {leaderboardCards.map((group) => (
                <article key={group.tournament?.publicId || group.tournament?.name} className="surface-card compact carousel-card">
                  <div className="card-header">
                    <h4>{group.tournament?.name || 'Tournament'}</h4>
                    <span className={`status-pill status-${getCarouselStatus(group) || 'unknown'}`}>
                      {group.tournament?.status || 'Unknown'}
                    </span>
                  </div>
                  <p>{group.tournament?.game || 'Unknown game'} · {group.tournament?.region || 'Unknown region'}</p>
                  <ul className="detail-list">
                    <li>Matches: {group.matchCount}</li>
                    <li>Latest update: {formatDate(group.latestCreatedAtUtc)}</li>
                    <li>Public leaderboard feed</li>
                  </ul>
                </article>
              ))}
              <Link to="/leaderboards" className="surface-card compact carousel-card carousel-action-card">
                <div className="card-header">
                  <h4>Open Leaderboards</h4>
                  <span className="status-pill">Live Feed</span>
                </div>
                <p>Jump to the public leaderboard feed for live and completed match results.</p>
                <span className="carousel-action-link">Open leaderboards →</span>
              </Link>
            </>
          ) : (
            <Link to="/leaderboards" className="surface-card compact carousel-card carousel-action-card">
              <div className="card-header">
                <h4>Open Leaderboards</h4>
                <span className="status-pill">Live Feed</span>
              </div>
              <p>Jump to the public leaderboard feed for live and completed match results.</p>
              <span className="carousel-action-link">Open leaderboards →</span>
            </Link>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
