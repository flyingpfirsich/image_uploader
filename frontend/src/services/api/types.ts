/**
 * API response types
 */
import type { User, Post, MusicShare } from '../../types';

// Auth responses
export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserResponse {
  user: User;
}

export interface UsersResponse {
  users: User[];
}

export interface FeedResponse {
  posts: Post[];
}

export interface ProfileResponse {
  user: User;
  posts: Post[];
}

export interface InviteResponse {
  code: string;
}

// Notification types
export interface NotificationPreferences {
  userId: string;
  dailyReminder: boolean;
  friendPosts: boolean;
}

// Admin types
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

// Music types (re-export for convenience)
export type { MusicShare };
