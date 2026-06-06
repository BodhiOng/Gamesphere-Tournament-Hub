import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../layouts/AdminLayout';
import MainLayout from '../layouts/MainLayout';
import AdminPanel from '../pages/AdminPanel/AdminPanel';
import Home from '../pages/Home/Home';
import Leaderboards from '../pages/Leaderboards/Leaderboards';
import Login from '../pages/Login/Login';
import MatchSchedule from '../pages/MatchSchedule/MatchSchedule';
import Profile from '../pages/Profile/Profile';
import Register from '../pages/Register/Register';
import TeamManagement from '../pages/TeamManagement/TeamManagement';
import TournamentDetails from '../pages/TournamentDetails/TournamentDetails';
import Tournaments from '../pages/Tournaments/Tournaments';
import UserProfile from '../pages/UserProfile/UserProfile';

function RequireAdmin({ children }) {
  const { user, isAuthReady, isSessionActive } = useAuth();

  if (!isAuthReady) {
    return null;
  }

  if (!user || !user.isAdmin || !isSessionActive) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RequireActiveUser({ children }) {
  const { user, isAuthReady, isSessionActive } = useAuth();

  if (!isAuthReady) {
    return null;
  }

  if (!user || !isSessionActive) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:publicId" element={<TournamentDetails />} />
        <Route path="/team-management" element={<RequireActiveUser><TeamManagement /></RequireActiveUser>} />
        <Route path="/schedule" element={<MatchSchedule />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/profile" element={<RequireActiveUser><Profile /></RequireActiveUser>} />
        <Route path="/users/:userPublicId" element={<UserProfile />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
