import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';

function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="content-shell">
        <Sidebar />
        <main className="page-shell">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
