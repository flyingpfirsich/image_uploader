/**
 * Admin API functions
 */
import { apiGet, apiPost, apiDelete, authHeaders, jsonHeaders } from './client';
import type {
  AdminStats,
  ActivityDay,
  TopPoster,
  EngagementStats,
  AdminUser,
  AdminInviteCode,
  SystemInfo,
} from './types';

// Analytics
export async function getAdminStats(token: string): Promise<AdminStats> {
  return apiGet<AdminStats>('/api/admin/stats', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch stats',
  });
}

export async function getAdminActivity(token: string): Promise<{ activity: ActivityDay[] }> {
  return apiGet<{ activity: ActivityDay[] }>('/api/admin/activity', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch activity',
  });
}

export async function getAdminTopPosters(token: string): Promise<{ topPosters: TopPoster[] }> {
  return apiGet<{ topPosters: TopPoster[] }>('/api/admin/top-posters', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch top posters',
  });
}

export async function getAdminEngagement(token: string): Promise<EngagementStats> {
  return apiGet<EngagementStats>('/api/admin/engagement', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch engagement',
  });
}

// User Management
export async function getAdminUsers(token: string): Promise<{ users: AdminUser[] }> {
  return apiGet<{ users: AdminUser[] }>('/api/admin/users', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch users',
  });
}

export async function deleteAdminUser(
  token: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>('/api/admin/users/' + userId, {
    headers: authHeaders(token),
    errorMessage: 'Failed to delete user',
  });
}

export async function resetUserPassword(
  token: string,
  userId: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(
    '/api/admin/users/' + userId + '/reset-password',
    {
      headers: jsonHeaders(token),
      body: { newPassword },
      errorMessage: 'Failed to reset password',
    }
  );
}

// Invite Codes
export async function getAdminInviteCodes(
  token: string
): Promise<{ inviteCodes: AdminInviteCode[] }> {
  return apiGet<{ inviteCodes: AdminInviteCode[] }>('/api/admin/invite-codes', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch invite codes',
  });
}

export async function createAdminInviteCode(
  token: string,
  expiresInDays?: number
): Promise<{ code: string; expiresAt: string; message: string }> {
  return apiPost<{ code: string; expiresAt: string; message: string }>('/api/admin/invite-codes', {
    headers: jsonHeaders(token),
    body: { expiresInDays },
    errorMessage: 'Failed to create invite code',
  });
}

export async function deleteAdminInviteCode(
  token: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>('/api/admin/invite-codes/' + code, {
    headers: authHeaders(token),
    errorMessage: 'Failed to delete invite code',
  });
}

// Testing
export async function sendTestNotification(
  token: string,
  type: 'daily' | 'friend_post'
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>('/api/admin/test-notification', {
    headers: jsonHeaders(token),
    body: { type },
    errorMessage: 'Failed to send test notification',
  });
}

export async function sendDailyReminders(
  token: string
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>('/api/admin/test-daily-reminder', {
    headers: authHeaders(token),
    errorMessage: 'Failed to send daily reminders',
  });
}

export async function createTestPost(
  token: string,
  data: { text?: string; location?: string; linkUrl?: string; linkTitle?: string }
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>('/api/admin/test-post', {
    headers: jsonHeaders(token),
    body: data,
    errorMessage: 'Failed to create test post',
  });
}

// Bulk Testing
export async function createBulkTestPosts(
  token: string,
  count: number
): Promise<{ success: boolean; created: number; message: string }> {
  return apiPost<{ success: boolean; created: number; message: string }>(
    '/api/admin/test-bulk-posts',
    {
      headers: jsonHeaders(token),
      body: { count },
      errorMessage: 'Failed to create bulk posts',
    }
  );
}

export async function createTestReactions(
  token: string,
  count: number
): Promise<{ success: boolean; created: number; message: string }> {
  return apiPost<{ success: boolean; created: number; message: string }>(
    '/api/admin/test-reactions',
    {
      headers: jsonHeaders(token),
      body: { count },
      errorMessage: 'Failed to create test reactions',
    }
  );
}

export async function createTestUsers(
  token: string,
  count: number,
  password?: string
): Promise<{
  success: boolean;
  created: number;
  users: { id: string; username: string }[];
  password: string;
  message: string;
}> {
  return apiPost('/api/admin/test-users', {
    headers: jsonHeaders(token),
    body: { count, password },
    errorMessage: 'Failed to create test users',
  });
}

export async function deleteTestData(
  token: string,
  includeUsers: boolean
): Promise<{ success: boolean; deletedPosts: number; deletedUsers: number; message: string }> {
  return apiDelete('/api/admin/test-data', {
    headers: jsonHeaders(token),
    body: { includeUsers },
    errorMessage: 'Failed to delete test data',
  });
}

// System
export async function getSystemInfo(token: string): Promise<SystemInfo> {
  return apiGet<SystemInfo>('/api/admin/system', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch system info',
  });
}

// Re-export types for convenience
export type {
  AdminStats,
  ActivityDay,
  TopPoster,
  EngagementStats,
  AdminUser,
  AdminInviteCode,
  SystemInfo,
};
