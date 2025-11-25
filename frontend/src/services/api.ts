import type { User, Post } from '../types';

const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

// Auth API responses
interface AuthResponse {
  user: User;
  token: string;
}

interface UserResponse {
  user: User;
}

interface UsersResponse {
  users: User[];
}

interface FeedResponse {
  posts: Post[];
}

interface ProfileResponse {
  user: User;
  posts: Post[];
}

interface InviteResponse {
  code: string;
}

// Helper to get auth headers
function authHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
  };
}

function jsonHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Auth endpoints
export async function register(
  username: string,
  password: string,
  displayName: string,
  inviteCode: string,
  birthday?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ username, password, displayName, inviteCode, birthday }),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Registration failed');
  }
  
  return res.json();
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ username, password }),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Login failed');
  }
  
  return res.json();
}

export async function getMe(token: string): Promise<UserResponse> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: authHeaders(token),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch user');
  }
  
  return res.json();
}

export async function createInvite(token: string): Promise<InviteResponse> {
  const res = await fetch(`${API_URL}/api/auth/invite`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  
  if (!res.ok) {
    throw new Error('Failed to create invite');
  }
  
  return res.json();
}

// Feed endpoints
export async function getFeed(token: string): Promise<FeedResponse> {
  const res = await fetch(`${API_URL}/api/feed`, {
    headers: authHeaders(token),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch feed');
  }
  
  return res.json();
}

// Posts endpoints
export async function createPost(
  token: string,
  data: { text?: string; location?: string; linkUrl?: string; linkTitle?: string },
  mediaFiles?: File[]
): Promise<Post> {
  const formData = new FormData();
  
  if (data.text) formData.append('text', data.text);
  if (data.location) formData.append('location', data.location);
  if (data.linkUrl) formData.append('linkUrl', data.linkUrl);
  if (data.linkTitle) formData.append('linkTitle', data.linkTitle);
  
  if (mediaFiles) {
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });
  }
  
  const res = await fetch(`${API_URL}/api/posts`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create post');
  }
  
  return res.json();
}

export async function deletePost(token: string, postId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/posts/${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  
  if (!res.ok) {
    throw new Error('Failed to delete post');
  }
}

export async function addReaction(token: string, postId: string, kaomoji: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/posts/${postId}/react`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ kaomoji }),
  });
  
  if (!res.ok) {
    throw new Error('Failed to add reaction');
  }
}

export async function removeReaction(token: string, postId: string, kaomoji: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/posts/${postId}/react`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
    body: JSON.stringify({ kaomoji }),
  });
  
  if (!res.ok) {
    throw new Error('Failed to remove reaction');
  }
}

// Users endpoints
export async function getUsers(token: string): Promise<UsersResponse> {
  const res = await fetch(`${API_URL}/api/users`, {
    headers: authHeaders(token),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return res.json();
}

export async function getUserProfile(token: string, userId: string): Promise<ProfileResponse> {
  const res = await fetch(`${API_URL}/api/users/${userId}`, {
    headers: authHeaders(token),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  return res.json();
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
  
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: formData,
  });
  
  if (!res.ok) {
    throw new Error('Failed to update profile');
  }
  
  return res.json();
}

// Media URL helper
export function getMediaUrl(filename: string): string {
  return `${API_URL}/uploads/media/${filename}`;
}

export function getAvatarUrl(filename: string | null): string | null {
  if (!filename) return null;
  return `${API_URL}/uploads/avatars/${filename}`;
}
