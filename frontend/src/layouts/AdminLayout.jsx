import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';

function AdminLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell wide">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
