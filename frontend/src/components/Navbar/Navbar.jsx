import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard', authRequired: true },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/team-management', label: 'Team Management', authRequired: true },
  { to: '/schedule', label: 'Schedule', authRequired: true },
  { to: '/leaderboards', label: 'Leaderboards' },
  { to: '/profile', label: 'Profile',  authRequired: true },
  { to: '/admin', label: 'Admin Panel', authRequired: true, adminOnly: true },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // determine which nav items to show based on role
  const isAdmin = !!user?.isAdmin;
  const displayedItems = isAdmin
    ? navItems.filter((item) => item.to === '/admin' || item.to === '/profile')
    : navItems.filter((item) => (!item.authRequired || user) && !item.adminOnly);

  return (
    <header className="gs-navbar">
      <div className="brand-block">
        <p className="brand-chip">GameSphere</p>
        <h1>Tournament Hub</h1>
      </div>

      <nav>
        {displayedItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="user-tools">
        {user ? (
          <>
            <span>{user.gamerTag}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/', { replace: true });
              }}
              className="ghost-btn"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="ghost-btn">
              Log in
            </NavLink>
            <NavLink to="/register" className="primary-btn">
              Create account
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
