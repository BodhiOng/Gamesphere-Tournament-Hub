import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/team-management', label: 'Team Management' },
  { to: '/schedule', label: 'Match Schedule' },
  { to: '/leaderboards', label: 'Leaderboard' },
  { to: '/admin', label: 'Admin Panel' },
];

function Sidebar() {
  return (
    <aside className="gs-sidebar">
      <p className="panel-title">Control Center</p>
      {links.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive ? 'side-link side-link-active' : 'side-link'
          }
        >
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}

export default Sidebar;
