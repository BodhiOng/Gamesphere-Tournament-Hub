import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getTournaments } from '../api/tournamentApi';

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTournaments()
      .then((data) => setTournaments(data))
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo(
    () => ({ tournaments, isLoading, setTournaments }),
    [tournaments, isLoading],
  );

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);

  if (!context) {
    throw new Error('useTournament must be used inside TournamentProvider.');
  }

  return context;
}
