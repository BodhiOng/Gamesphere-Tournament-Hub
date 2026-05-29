import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // restore user from localStorage on mount so session survives refresh
  useEffect(() => {
    try {
      const raw = localStorage.getItem('gs_user');
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (e) {
      // ignore parse errors
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthReady,
      isAuthenticated: Boolean(user),
      async login(credentials) {
        const response = await loginUser(credentials);
        setUser(response.user);
        try {
          localStorage.setItem('gs_user', JSON.stringify(response.user));
        } catch {}
        return response;
      },
      async register(payload) {
        return registerUser(payload);
      },
      updateUser(nextUser) {
        setUser(nextUser);
        try {
          localStorage.setItem('gs_user', JSON.stringify(nextUser));
        } catch {}
      },
      logout() {
        setUser(null);
        try {
          localStorage.removeItem('gs_user');
        } catch {}
      },
    }),
    [user, isAuthReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
