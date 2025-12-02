/**
 * Users API functions
 */
import { apiGet, apiPatchForm, authHeaders } from './client';
import type { UsersResponse, UserResponse, ProfileResponse } from './types';

export async function getUsers(token: string): Promise<UsersResponse> {
  return apiGet<UsersResponse>('/api/users', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch users',
  });
}

export async function getUserProfile(token: string, userId: string): Promise<ProfileResponse> {
  return apiGet<ProfileResponse>('/api/users/' + userId, {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch profile',
  });
}

export async function updateProfile(
  token: string,
  data: { displayName?: string; birthday?: string },
  avatarFile?: File
): Promise<UserResponse> {
  const formData = new FormData();

  if (data.displayName) formData.append('displayName', data.displayName);
  if (data.birthday) formData.append('birthday', data.birthday);
  if (avatarFile) formData.append('avatar', avatarFile);

  return apiPatchForm<UserResponse>('/api/users/me', {
    headers: authHeaders(token),
    body: formData,
    errorMessage: 'Failed to update profile',
  });
}
