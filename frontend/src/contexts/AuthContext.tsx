import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AuthState } from '../types';
import * as api from '../services/api';

const AUTH_TOKEN_KEY = 'druzi_token';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string, inviteCode: string, birthday?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { user } = await api.getMe(token);
        setUser(user);
      } catch {
        // Token invalid, clear it
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const { user, token } = await api.login(username, password);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setToken(token);
    setUser(user);
  }, []);

  const register = useCallback(async (
    username: string,
    password: string,
    displayName: string,
    inviteCode: string,
    birthday?: string
  ) => {
    const { user, token } = await api.register(username, password, displayName, inviteCode, birthday);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

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
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

