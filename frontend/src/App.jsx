import { AuthProvider } from './context/AuthContext';
import { TournamentProvider } from './context/TournamentContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <AppRoutes />
      </TournamentProvider>
    </AuthProvider>
  );
}

export default App;
