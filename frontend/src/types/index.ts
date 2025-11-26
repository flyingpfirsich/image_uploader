// API Status
export interface Status {
  type: 'success' | 'error' | '';
  message: string;
}

// User types
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  birthday: string | null;
  createdAt: Date;
}

// Post types
export interface Media {
  id: string;
  postId: string;
  filename: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  order: number;
  createdAt: Date;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  kaomoji: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}

export interface Post {
  id: string;
  userId: string;
  text: string | null;
  location: string | null;
  linkUrl: string | null;
  linkTitle: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  media: Media[];
  reactions: Reaction[];
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// BeReal photo interface (kept for camera functionality)
export interface BeRealPhoto {
  blob: Blob;
  url: string;
  facingMode: 'user' | 'environment';
}

export interface BeRealPhotos {
  front: BeRealPhoto | null;
  back: BeRealPhoto | null;
}

export interface CapturedMedia {
  blob: Blob;
  type: 'photo' | 'video';
  url: string;
}

// Type aliases
export type FacingMode = 'user' | 'environment';
export type CaptureMode = 'photo' | 'video';
export type NavMode = 'feed' | 'profile' | 'admin';

// Admin username constant
export const ADMIN_USERNAME = 'admin';
export type MainPhotoPosition = 'front' | 'back';

// Kaomoji reactions preset
export const KAOMOJI_REACTIONS = [
  '(◕‿◕)',
  '(╯°□°)╯',
  '(ಥ﹏ಥ)',
  '(づ｡◕‿‿◕｡)づ',
  '(⌐■_■)',
  '(◠‿◠)',
  'ヽ(>∀<☆)☆',
  '(¬‿¬)',
] as const;
