/**
 * Unit tests for AuthContext
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import type { ReactNode } from 'react';

// Mock the API module
vi.mock('../services/api', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  refreshTokens: vi.fn(),
  logoutEverywhere: vi.fn(),
}));

import * as api from '../services/api';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should start with no user when no token in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should verify token from localStorage on mount', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
        avatar: null,
        birthday: null,
        createdAt: new Date(),
      };

      localStorage.setItem('druzi_access_token', 'valid-token');
      localStorage.setItem('druzi_refresh_token', 'valid-refresh-token');
      vi.mocked(api.getMe).mockResolvedValueOnce({ user: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.getMe).toHaveBeenCalledWith('valid-token');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear invalid token from localStorage', async () => {
      localStorage.setItem('druzi_access_token', 'invalid-token');
      localStorage.setItem('druzi_refresh_token', 'invalid-refresh-token');
      vi.mocked(api.getMe).mockRejectedValueOnce(new Error('Invalid token'));
      vi.mocked(api.refreshTokens).mockRejectedValueOnce(new Error('Invalid refresh token'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(localStorage.getItem('druzi_access_token')).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('should call API and set user on successful login', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
        avatar: null,
        birthday: null,
        createdAt: new Date(),
      };
      const mockToken = 'new-token';

      vi.mocked(api.login).mockResolvedValueOnce({
        user: mockUser,
        accessToken: mockToken,
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      expect(api.login).toHaveBeenCalledWith('testuser', 'password123');
      expect(result.current.user).toEqual(mockUser);
    });

    it('should propagate login errors', async () => {
      vi.mocked(api.login).mockRejectedValueOnce(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('wrong', 'wrong');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
    });
  });

  describe('register', () => {
    it('should call API and set user on successful register', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'newuser',
        displayName: 'New User',
        avatar: null,
        birthday: '1990-01-01',
        createdAt: new Date(),
      };
      const mockToken = 'new-token';

      vi.mocked(api.register).mockResolvedValueOnce({
        user: mockUser,
        accessToken: mockToken,
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register('newuser', 'password123', 'New User', 'INVITE', '1990-01-01');
      });

      expect(api.register).toHaveBeenCalledWith(
        'newuser',
        'password123',
        'New User',
        'INVITE',
        '1990-01-01'
      );
      expect(result.current.user).toEqual(mockUser);
    });

    it('should register without birthday', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'newuser',
        displayName: 'New User',
        avatar: null,
        birthday: null,
        createdAt: new Date(),
      };
      const mockToken = 'new-token';

      vi.mocked(api.register).mockResolvedValueOnce({
        user: mockUser,
        accessToken: mockToken,
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register('newuser', 'password123', 'New User', 'INVITE');
      });

      expect(api.register).toHaveBeenCalledWith(
        'newuser',
        'password123',
        'New User',
        'INVITE',
        undefined
      );
    });
  });

  describe('logout', () => {
    it('should clear user and token on logout', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
        avatar: null,
        birthday: null,
        createdAt: new Date(),
      };

      localStorage.setItem('druzi_access_token', 'valid-token');
      localStorage.setItem('druzi_refresh_token', 'valid-refresh-token');
      vi.mocked(api.getMe).mockResolvedValueOnce({ user: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('druzi_access_token')).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
        avatar: null,
        birthday: null,
        createdAt: new Date(),
      };

      localStorage.setItem('druzi_access_token', 'valid-token');
      localStorage.setItem('druzi_refresh_token', 'valid-refresh-token');
      vi.mocked(api.getMe).mockResolvedValueOnce({ user: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      const updatedUser = {
        ...mockUser,
        displayName: 'Updated Name',
        avatar: 'avatar.jpg',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.user?.displayName).toBe('Updated Name');
      expect(result.current.user?.avatar).toBe('avatar.jpg');
    });
  });

  describe('useAuth outside provider', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
