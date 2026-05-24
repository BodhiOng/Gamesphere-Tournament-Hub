import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';

function AdminLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell wide">
        <section className="surface-card">
          <h2>Admin Operations</h2>
          <p>Manage tournaments, users, moderation, and match integrity workflows.</p>
        </section>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
