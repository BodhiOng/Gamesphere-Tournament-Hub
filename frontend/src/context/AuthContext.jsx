import { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { loginUser, registerUser } from '../api/authApi';
import { getCurrentUserProfile } from '../api/userApi';

const AuthContext = createContext(null);
const SUSPENSION_CHECK_INTERVAL_MS = 10_000;

function areUsersEqual(left, right) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return left.id === right.id
    && left.publicId === right.publicId
    && left.username === right.username
    && left.email === right.email
    && left.gamerTag === right.gamerTag
    && left.createdAt === right.createdAt
    && Boolean(left.isAdmin) === Boolean(right.isAdmin)
    && Boolean(left.isBanned) === Boolean(right.isBanned)
    && (left.suspendedUntilUtc ?? null) === (right.suspendedUntilUtc ?? null);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const suspensionCheckToken = useRef(0);

  const logout = useCallback(() => {
    suspensionCheckToken.current += 1;
    setUser(null);
    try {
      localStorage.removeItem('gs_user');
    } catch {}
  }, []);

  const syncStoredUser = useCallback((nextUser) => {
    suspensionCheckToken.current += 1;
    setUser(nextUser);
    try {
      localStorage.setItem('gs_user', JSON.stringify(nextUser));
    } catch {}
  }, []);

  const refreshSuspensionState = useCallback(async (currentUser) => {
    if (!currentUser) {
      return;
    }

    const checkToken = suspensionCheckToken.current;

    try {
      const freshProfile = await getCurrentUserProfile(currentUser);
      if (checkToken !== suspensionCheckToken.current) {
        return;
      }

      if (!freshProfile) {
        return;
      }

      const suspendedUntilUtc = freshProfile.suspendedUntilUtc ? new Date(freshProfile.suspendedUntilUtc) : null;
      const now = new Date();
      if (suspendedUntilUtc && !Number.isNaN(suspendedUntilUtc.getTime()) && suspendedUntilUtc > now) {
        logout();
        return;
      }

      if (checkToken !== suspensionCheckToken.current) {
        return;
      }

      const nextUser = {
        ...currentUser,
        ...freshProfile,
      };

      if (!areUsersEqual(currentUser, nextUser)) {
        syncStoredUser(nextUser);
      }
    } catch {
      // Keep the current session if the profile refresh temporarily fails.
    }
  }, [logout, syncStoredUser]);

  // restore user from localStorage on mount so session survives refresh
  useEffect(() => {
    try {
      const raw = localStorage.getItem('gs_user');
      if (raw) {
        const restoredUser = JSON.parse(raw);
        setUser(restoredUser);
        void refreshSuspensionState(restoredUser);
      }
    } catch (e) {
      // ignore parse errors
    } finally {
      setIsAuthReady(true);
    }
  }, [refreshSuspensionState]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    void refreshSuspensionState(user);

    const intervalId = window.setInterval(() => {
      void refreshSuspensionState(user);
    }, SUSPENSION_CHECK_INTERVAL_MS);

    const handleWindowFocus = () => {
      void refreshSuspensionState(user);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshSuspensionState(user);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshSuspensionState]);

  const value = useMemo(
    () => ({
      user,
      isAuthReady,
      isAuthenticated: Boolean(user),
      isSuspended: Boolean(
        user?.suspendedUntilUtc
        && !Number.isNaN(new Date(user.suspendedUntilUtc).getTime())
        && new Date(user.suspendedUntilUtc) > new Date()
      ),
      isSessionActive: Boolean(
        user
        && !user.isBanned
        && (
          !user.suspendedUntilUtc
          || Number.isNaN(new Date(user.suspendedUntilUtc).getTime())
          || new Date(user.suspendedUntilUtc) <= new Date()
        )
      ),
      async login(credentials) {
        const response = await loginUser(credentials);
        syncStoredUser(response.user);
        return response;
      },
      async register(payload) {
        return registerUser(payload);
      },
      updateUser(nextUser) {
        syncStoredUser(nextUser);
      },
      logout,
    }),
    [user, isAuthReady, logout, syncStoredUser],
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
