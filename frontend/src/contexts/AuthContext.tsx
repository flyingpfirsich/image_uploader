import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { User, AuthState } from '../types';
import * as api from '../services/api';

const ACCESS_TOKEN_KEY = 'druzi_access_token';
const REFRESH_TOKEN_KEY = 'druzi_refresh_token';

// Token refresh buffer - refresh 1 minute before expiry
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    displayName: string,
    inviteCode: string,
    birthday?: string
  ) => Promise<void>;
  logout: () => void;
  logoutEverywhere: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Parse JWT to get expiry time
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    localStorage.getItem(REFRESH_TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  // Use refs to avoid stale closures in callbacks
  const tokenRef = useRef(token);
  const refreshTokenRef = useRef(refreshToken);
  tokenRef.current = token;
  refreshTokenRef.current = refreshToken;

  /**
   * Clear auth state and storage
   */
  const clearAuth = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  /**
   * Set auth tokens in state and storage
   */
  const setAuthTokens = useCallback((accessToken: string, newRefreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
  }, []);

  /**
   * Perform token refresh
   */
  const performTokenRefresh = useCallback(
    async (currentRefreshToken: string) => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;

      try {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          await api.refreshTokens(currentRefreshToken);

        setAuthTokens(newAccessToken, newRefreshToken);

        // Schedule next refresh
        scheduleTokenRefresh(newAccessToken, newRefreshToken);
      } catch {
        // Refresh failed, logout user
        clearAuth();
      } finally {
        isRefreshingRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- circular dependency with scheduleTokenRefresh is intentional
    [setAuthTokens, clearAuth]
  );

  /**
   * Schedule token refresh before expiry (internal, uses performTokenRefresh)
   */
  const scheduleTokenRefresh = useCallback(
    (accessToken: string, currentRefreshToken: string) => {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const expiry = getTokenExpiry(accessToken);
      if (!expiry) return;

      const now = Date.now();
      const timeUntilRefresh = expiry - now - TOKEN_REFRESH_BUFFER_MS;

      if (timeUntilRefresh <= 0) {
        // Token already expired or about to expire, refresh immediately
        performTokenRefresh(currentRefreshToken);
        return;
      }

      refreshTimeoutRef.current = setTimeout(() => {
        performTokenRefresh(currentRefreshToken);
      }, timeUntilRefresh);
    },
    [performTokenRefresh]
  );

  // Verify token on mount and setup refresh
  useEffect(() => {
    const initialToken = tokenRef.current;
    const initialRefreshToken = refreshTokenRef.current;

    const verifyToken = async () => {
      if (!initialToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { user } = await api.getMe(initialToken);
        setUser(user);

        // Schedule token refresh if we have a refresh token
        if (initialRefreshToken) {
          scheduleTokenRefresh(initialToken, initialRefreshToken);
        }
      } catch {
        // Token invalid, try to refresh
        if (initialRefreshToken) {
          try {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
              await api.refreshTokens(initialRefreshToken);
            setAuthTokens(newAccessToken, newRefreshToken);

            const { user } = await api.getMe(newAccessToken);
            setUser(user);
            scheduleTokenRefresh(newAccessToken, newRefreshToken);
          } catch {
            // Refresh also failed, clear everything
            clearAuth();
          }
        } else {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          setToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();

    // Cleanup timeout on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [scheduleTokenRefresh, setAuthTokens, clearAuth]);

  const login = useCallback(
    async (username: string, password: string) => {
      const {
        user,
        accessToken,
        refreshToken: newRefreshToken,
      } = await api.login(username, password);
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(user);
      scheduleTokenRefresh(accessToken, newRefreshToken);
    },
    [scheduleTokenRefresh]
  );

  const register = useCallback(
    async (
      username: string,
      password: string,
      displayName: string,
      inviteCode: string,
      birthday?: string
    ) => {
      const {
        user,
        accessToken,
        refreshToken: newRefreshToken,
      } = await api.register(username, password, displayName, inviteCode, birthday);
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(user);
      scheduleTokenRefresh(accessToken, newRefreshToken);
    },
    [scheduleTokenRefresh]
  );

  const logout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const logoutEverywhere = useCallback(async () => {
    if (token) {
      try {
        await api.logoutEverywhere(token);
      } catch {
        // Continue with local logout even if server call fails
      }
    }
    logout();
  }, [token, logout]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    logoutEverywhere,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
