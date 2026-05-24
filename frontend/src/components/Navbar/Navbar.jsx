import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/leaderboards', label: 'Leaderboards' },
  { to: '/profile', label: 'Profile' },
];

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="gs-navbar">
      <div className="brand-block">
        <p className="brand-chip">GameSphere</p>
        <h1>Tournament Hub</h1>
      </div>

      <nav>
        {navItems.map((item) => (
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
            <button type="button" onClick={logout} className="ghost-btn">
              Log out
            </button>
          </>
        ) : (
          <NavLink to="/login" className="ghost-btn">
            Log in
          </NavLink>
        )}
      </div>
    </header>
  );
}

export default Navbar;
