// Status for API operations
export interface Status {
  type: 'success' | 'error' | '';
  message: string;
}

// BeReal photo interface
export interface BeRealPhoto {
  blob: Blob;
  url: string;
  facingMode: 'user' | 'environment';
}

// BeReal photos state
export interface BeRealPhotos {
  front: BeRealPhoto | null;
  back: BeRealPhoto | null;
}

// Captured media (photo or video)
export interface CapturedMedia {
  blob: Blob;
  type: 'photo' | 'video';
  url: string;
}

// Type aliases for clarity
export type FacingMode = 'user' | 'environment';
export type CaptureMode = 'photo' | 'video';
export type InputMode = 'upload' | 'capture';
export type NavMode = 'upload' | 'memories' | 'hilfe';
export type MainPhotoPosition = 'front' | 'back';

// Memory/Calendar types
export interface MemoryItem {
  filename: string;
  timestamp: number;
  date: string;
  thumbnailUrl?: string;
}

export interface DayMemories {
  date: string;
  memories: MemoryItem[];
  count: number;
}

