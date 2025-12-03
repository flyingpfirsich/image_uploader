/**
 * Authentication API functions
 */
import { apiGet, apiPost, authHeaders, jsonHeaders } from './client';
import type { AuthResponse, RefreshResponse, UserResponse, InviteResponse } from './types';

export async function register(
  username: string,
  password: string,
  displayName: string,
  inviteCode: string,
  birthday?: string
): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/register', {
    headers: jsonHeaders(),
    body: { username, password, displayName, inviteCode, birthday },
    errorMessage: 'Registration failed',
  });
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/login', {
    headers: jsonHeaders(),
    body: { username, password },
    errorMessage: 'Login failed',
  });
}

export async function getMe(token: string): Promise<UserResponse> {
  return apiGet<UserResponse>('/api/auth/me', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch user',
  });
}

export async function createInvite(token: string): Promise<InviteResponse> {
  return apiPost<InviteResponse>('/api/auth/invite', {
    headers: authHeaders(token),
    errorMessage: 'Failed to create invite',
  });
}

export async function refreshTokens(refreshToken: string): Promise<RefreshResponse> {
  return apiPost<RefreshResponse>('/api/auth/refresh', {
    headers: jsonHeaders(),
    body: { refreshToken },
    errorMessage: 'Token refresh failed',
  });
}

export async function logoutEverywhere(token: string): Promise<void> {
  return apiPost<void>('/api/auth/logout', {
    headers: authHeaders(token),
    errorMessage: 'Logout failed',
  });
}
