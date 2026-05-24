import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import MainLayout from '../layouts/MainLayout';
import AdminPanel from '../pages/AdminPanel/AdminPanel';
import Dashboard from '../pages/Dashboard/Dashboard';
import Home from '../pages/Home/Home';
import Leaderboards from '../pages/Leaderboards/Leaderboards';
import Login from '../pages/Login/Login';
import MatchSchedule from '../pages/MatchSchedule/MatchSchedule';
import Profile from '../pages/Profile/Profile';
import Register from '../pages/Register/Register';
import TeamManagement from '../pages/TeamManagement/TeamManagement';
import TournamentDetails from '../pages/TournamentDetails/TournamentDetails';
import Tournaments from '../pages/Tournaments/Tournaments';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetails />} />
        <Route path="/team-management" element={<TeamManagement />} />
        <Route path="/schedule" element={<MatchSchedule />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminPanel />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
