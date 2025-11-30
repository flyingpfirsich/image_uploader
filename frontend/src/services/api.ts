import type { User, Post, SpotifyTrack, MusicShare } from '../types';

const API_URL = import.meta.env.PROD ? '' : import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    Authorization: `Bearer ${token}`,
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
  data: {
    text?: string;
    location?: string;
    linkUrl?: string;
    linkTitle?: string;
    hasMusic?: boolean;
  },
  mediaFiles?: File[]
): Promise<Post> {
  const formData = new FormData();

  if (data.text) formData.append('text', data.text);
  if (data.location) formData.append('location', data.location);
  if (data.linkUrl) formData.append('linkUrl', data.linkUrl);
  if (data.linkTitle) formData.append('linkTitle', data.linkTitle);
  if (data.hasMusic) formData.append('hasMusic', 'true');

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

export async function removeReaction(
  token: string,
  postId: string,
  kaomoji: string
): Promise<void> {
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

// Notification types
export interface NotificationPreferences {
  userId: string;
  dailyReminder: boolean;
  friendPosts: boolean;
}

// Notification endpoints
export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_URL}/api/notifications/vapid-public-key`);

  if (!res.ok) {
    throw new Error('Failed to get VAPID key');
  }

  const data = await res.json();
  return data.key;
}

export async function subscribeToNotifications(
  token: string,
  subscription: PushSubscription
): Promise<void> {
  const res = await fetch(`${API_URL}/api/notifications/subscribe`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  if (!res.ok) {
    throw new Error('Failed to subscribe');
  }
}

export async function unsubscribeFromNotifications(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/notifications/subscribe`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error('Failed to unsubscribe');
  }
}

export async function getNotificationPreferences(token: string): Promise<NotificationPreferences> {
  const res = await fetch(`${API_URL}/api/notifications/preferences`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error('Failed to get preferences');
  }

  return res.json();
}

export async function updateNotificationPreferences(
  token: string,
  updates: { dailyReminder?: boolean; friendPosts?: boolean }
): Promise<NotificationPreferences> {
  const res = await fetch(`${API_URL}/api/notifications/preferences`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    throw new Error('Failed to update preferences');
  }

  return res.json();
}

export async function getScheduledNotificationTime(token: string): Promise<Date | null> {
  const res = await fetch(`${API_URL}/api/notifications/scheduled-time`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error('Failed to get scheduled time');
  }

  const data = await res.json();
  return data.scheduledTime ? new Date(data.scheduledTime) : null;
}

// ============================================
// ADMIN API TYPES
// ============================================

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalReactions: number;
  totalMedia: number;
  pushSubscriptions: number;
  postsToday: number;
  activeUsersThisWeek: number;
}

export interface ActivityDay {
  date: string;
  posts: number;
  signups: number;
}

export interface TopPoster {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  } | null;
  postCount: number;
}

export interface EngagementStats {
  topEngagedPosts: {
    post: { id: string; text: string | null; createdAt: Date } | null;
    user: { id: string; username: string; displayName: string } | null;
    reactionCount: number;
  }[];
  avgReactionsPerPost: number;
  topKaomoji: { kaomoji: string; count: number }[];
}

export interface AdminUser extends User {
  postCount: number;
  reactionCount: number;
  hasPushSubscription: boolean;
}

export interface AdminInviteCode {
  code: string;
  createdBy: string | null;
  usedBy: string | null;
  usedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  createdByUser: { id: string; username: string; displayName: string } | null;
  usedByUser: { id: string; username: string; displayName: string } | null;
  status: 'active' | 'used' | 'expired';
}

export interface SystemInfo {
  vapidConfigured: boolean;
  scheduledNotificationTime: string | null;
  nodeVersion: string;
  uptime: number;
}

// ============================================
// ADMIN API FUNCTIONS
// ============================================

// Analytics
export async function getAdminStats(token: string): Promise<AdminStats> {
  const res = await fetch(`${API_URL}/api/admin/stats`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch stats');
  }

  return res.json();
}

export async function getAdminActivity(token: string): Promise<{ activity: ActivityDay[] }> {
  const res = await fetch(`${API_URL}/api/admin/activity`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch activity');
  }

  return res.json();
}

export async function getAdminTopPosters(token: string): Promise<{ topPosters: TopPoster[] }> {
  const res = await fetch(`${API_URL}/api/admin/top-posters`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch top posters');
  }

  return res.json();
}

export async function getAdminEngagement(token: string): Promise<EngagementStats> {
  const res = await fetch(`${API_URL}/api/admin/engagement`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch engagement');
  }

  return res.json();
}

// User Management
export async function getAdminUsers(token: string): Promise<{ users: AdminUser[] }> {
  const res = await fetch(`${API_URL}/api/admin/users`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch users');
  }

  return res.json();
}

export async function deleteAdminUser(
  token: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete user');
  }

  return res.json();
}

export async function resetUserPassword(
  token: string,
  userId: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ newPassword }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to reset password');
  }

  return res.json();
}

// Invite Codes
export async function getAdminInviteCodes(
  token: string
): Promise<{ inviteCodes: AdminInviteCode[] }> {
  const res = await fetch(`${API_URL}/api/admin/invite-codes`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch invite codes');
  }

  return res.json();
}

export async function createAdminInviteCode(
  token: string,
  expiresInDays?: number
): Promise<{ code: string; expiresAt: string; message: string }> {
  const res = await fetch(`${API_URL}/api/admin/invite-codes`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ expiresInDays }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to create invite code');
  }

  return res.json();
}

export async function deleteAdminInviteCode(
  token: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/api/admin/invite-codes/${code}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete invite code');
  }

  return res.json();
}

// Testing
export async function sendTestNotification(
  token: string,
  type: 'daily' | 'friend_post'
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/api/admin/test-notification`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ type }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to send test notification');
  }

  return res.json();
}

export async function sendDailyReminders(
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/api/admin/test-daily-reminder`, {
    method: 'POST',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to send daily reminders');
  }

  return res.json();
}

export async function createTestPost(
  token: string,
  data: { text?: string; location?: string; linkUrl?: string; linkTitle?: string }
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/api/admin/test-post`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to create test post');
  }

  return res.json();
}

// System
export async function getSystemInfo(token: string): Promise<SystemInfo> {
  const res = await fetch(`${API_URL}/api/admin/system`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch system info');
  }

  return res.json();
}

// ============================================
// MUSIC API FUNCTIONS
// ============================================

export async function getSpotifyStatus(): Promise<{ configured: boolean }> {
  const res = await fetch(`${API_URL}/api/music/spotify/status`);

  if (!res.ok) {
    throw new Error('Failed to check Spotify status');
  }

  return res.json();
}

export async function searchMusic(
  token: string,
  query: string
): Promise<{ tracks: SpotifyTrack[] }> {
  const res = await fetch(`${API_URL}/api/music/search?q=${encodeURIComponent(query)}`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to search music');
  }

  return res.json();
}

export async function createMusicShare(
  token: string,
  data: {
    postId?: string;
    spotifyTrackId?: string;
    trackName: string;
    artistName: string;
    albumName?: string;
    albumArtUrl?: string;
    previewUrl?: string;
    externalUrl?: string;
    moodKaomoji?: string;
  }
): Promise<MusicShare> {
  const res = await fetch(`${API_URL}/api/music`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to create music share');
  }

  return res.json();
}

export async function getMusicShare(token: string, id: string): Promise<MusicShare> {
  const res = await fetch(`${API_URL}/api/music/${id}`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error('Failed to get music share');
  }

  return res.json();
}

export async function deleteMusicShare(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/music/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error('Failed to delete music share');
  }
}
