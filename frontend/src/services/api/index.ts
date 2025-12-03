/**
 * API module - re-exports all API functions and types
 *
 * Usage:
 *   import * as api from '../services/api';
 *   // or
 *   import { login, register } from '../services/api';
 */

// Auth
export { register, login, getMe, createInvite } from './auth';

// Posts
export {
  getFeed,
  createPost,
  deletePost,
  addReaction,
  removeReaction,
  addComment,
  deleteComment,
} from './posts';

// Users
export { getUsers, getUserProfile, updateProfile } from './users';

// Media
export { fetchMediaBlob, fetchAvatarBlob } from './media';

// Notifications
export {
  getVapidPublicKey,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  getScheduledNotificationTime,
} from './notifications';

// Admin
export {
  getAdminStats,
  getAdminActivity,
  getAdminTopPosters,
  getAdminEngagement,
  getAdminUsers,
  deleteAdminUser,
  resetUserPassword,
  getAdminInviteCodes,
  createAdminInviteCode,
  deleteAdminInviteCode,
  sendTestNotification,
  sendDailyReminders,
  createTestPost,
  createBulkTestPosts,
  createTestReactions,
  createTestUsers,
  deleteTestData,
  getSystemInfo,
} from './admin';

// Music
export { getSpotifyStatus, searchMusic, createMusicShare } from './music';

// Lists
export {
  getLists,
  getListsByUser,
  getListActivity,
  getList,
  createList,
  updateList,
  deleteList,
  addListItem,
  updateListItem,
  deleteListItem,
} from './lists';

// Types
export type {
  AuthResponse,
  UserResponse,
  UsersResponse,
  FeedResponse,
  ProfileResponse,
  InviteResponse,
  NotificationPreferences,
  AdminStats,
  ActivityDay,
  TopPoster,
  EngagementStats,
  AdminUser,
  AdminInviteCode,
  SystemInfo,
  MusicShare,
  ListsResponse,
} from './types';

// Client utilities (for advanced use cases)
export { ApiError } from './client';
