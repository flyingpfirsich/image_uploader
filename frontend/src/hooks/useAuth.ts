import { useState, useCallback } from 'react';
import { login as apiLogin } from '../services/api';
import { TEXT } from '../constants/text';
import type { Status } from '../types';

const AUTH_TOKEN_KEY = 'auth_token';

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ type: '', message: '' });

  const login = useCallback(async (password: string) => {
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const data = await apiLogin(password);
      if (data.success) {
        setToken(password);
        localStorage.setItem(AUTH_TOKEN_KEY, password);
        setStatus({ type: '', message: '' });
        return true;
      } else {
        setStatus({ type: 'error', message: TEXT.login.error });
        return false;
      }
    } catch {
      setStatus({ type: 'error', message: TEXT.login.serverError });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setStatus({ type: '', message: '' });
  }, []);

  const clearStatus = useCallback(() => {
    setStatus({ type: '', message: '' });
  }, []);

  return {
    token,
    isLoading,
    status,
    login,
    logout,
    clearStatus,
  };
}

