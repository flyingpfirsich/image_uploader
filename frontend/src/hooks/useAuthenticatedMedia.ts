import { useEffect, useRef, useMemo, useReducer } from 'react';
import { fetchMediaBlob, fetchAvatarBlob } from '../services/api';

interface UseAuthenticatedMediaResult {
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// In-Memory Cache with Request Deduplication
// =============================================================================

interface CacheEntry {
  url: string;
  refCount: number;
  timestamp: number;
}

interface PendingRequest {
  promise: Promise<string>;
  subscribers: Set<(url: string) => void>;
  errorSubscribers: Set<(error: Error) => void>;
}

// Global in-memory cache for blob URLs
const mediaCache = new Map<string, CacheEntry>();
// Track in-flight requests for deduplication
const pendingRequests = new Map<string, PendingRequest>();
// Max cache size (entries, not bytes)
const MAX_CACHE_SIZE = 200;

function getCacheKey(filename: string, type: 'media' | 'avatar'): string {
  return `${type}:${filename}`;
}

/**
 * Get a blob URL from cache, incrementing ref count
 */
function getFromCache(key: string): string | null {
  const entry = mediaCache.get(key);
  if (entry) {
    entry.refCount++;
    entry.timestamp = Date.now();
    return entry.url;
  }
  return null;
}

/**
 * Add a blob URL to cache with ref count of 1
 */
function addToCache(key: string, url: string): void {
  // Evict old entries if cache is full
  if (mediaCache.size >= MAX_CACHE_SIZE) {
    evictLRU();
  }
  mediaCache.set(key, { url, refCount: 1, timestamp: Date.now() });
}

/**
 * Release a reference to a cached blob URL
 * When refCount reaches 0, the entry is eligible for eviction
 */
function releaseFromCache(key: string): void {
  const entry = mediaCache.get(key);
  if (entry) {
    entry.refCount = Math.max(0, entry.refCount - 1);
  }
}

/**
 * Evict least recently used entries with refCount 0
 */
function evictLRU(): void {
  const evictableEntries: [string, CacheEntry][] = [];

  mediaCache.forEach((entry, key) => {
    if (entry.refCount === 0) {
      evictableEntries.push([key, entry]);
    }
  });

  // Sort by timestamp (oldest first)
  evictableEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);

  // Evict oldest 20% or at least 1
  const evictCount = Math.max(1, Math.floor(evictableEntries.length * 0.2));
  for (let i = 0; i < evictCount && i < evictableEntries.length; i++) {
    const [key, entry] = evictableEntries[i];
    URL.revokeObjectURL(entry.url);
    mediaCache.delete(key);
  }
}

/**
 * Fetch media with deduplication - multiple components requesting the same
 * file will share a single network request
 */
async function fetchWithDeduplication(
  filename: string,
  token: string,
  type: 'media' | 'avatar'
): Promise<string> {
  const cacheKey = getCacheKey(filename, type);

  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  // Check if there's already a pending request
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    // Subscribe to the existing request
    return new Promise((resolve, reject) => {
      pending.subscribers.add(resolve);
      pending.errorSubscribers.add(reject);
    });
  }

  // Create new request
  const fetchFn = type === 'avatar' ? fetchAvatarBlob : fetchMediaBlob;
  const subscribers = new Set<(url: string) => void>();
  const errorSubscribers = new Set<(error: Error) => void>();

  const promise = fetchFn(filename, token);

  pendingRequests.set(cacheKey, { promise, subscribers, errorSubscribers });

  try {
    const blobUrl = await promise;

    // Add to cache
    addToCache(cacheKey, blobUrl);

    // Increment ref count for each subscriber
    subscribers.forEach(() => {
      const entry = mediaCache.get(cacheKey);
      if (entry) entry.refCount++;
    });

    // Notify all subscribers
    subscribers.forEach((resolve) => resolve(blobUrl));

    return blobUrl;
  } catch (error) {
    // Notify all error subscribers
    errorSubscribers.forEach((reject) => reject(error as Error));
    throw error;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

/**
 * Clear the in-memory media cache (call on logout)
 */
export function clearInMemoryMediaCache(): void {
  mediaCache.forEach((entry) => {
    URL.revokeObjectURL(entry.url);
  });
  mediaCache.clear();
}

// =============================================================================
// Hooks
// =============================================================================

// State machine for media loading
type MediaState = {
  url: string | null;
  isLoading: boolean;
  error: string | null;
};

type MediaAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; url: string }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'RESET' };

function mediaReducer(state: MediaState, action: MediaAction): MediaState {
  switch (action.type) {
    case 'FETCH_START':
      return { url: null, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { url: action.url, isLoading: false, error: null };
    case 'FETCH_ERROR':
      return { url: null, isLoading: false, error: action.error };
    case 'RESET':
      return { url: null, isLoading: false, error: null };
    default:
      return state;
  }
}

const initialMediaState: MediaState = { url: null, isLoading: false, error: null };

/**
 * Hook to load media files with authentication
 * Returns a blob URL that can be used in img/video src
 * Uses in-memory cache and request deduplication for optimal performance
 */
export function useAuthenticatedMedia(
  filename: string | null,
  token: string,
  type: 'media' | 'avatar' = 'media'
): UseAuthenticatedMediaResult {
  const [state, dispatch] = useReducer(mediaReducer, initialMediaState);
  const cacheKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Release previous cache reference
    if (cacheKeyRef.current) {
      releaseFromCache(cacheKeyRef.current);
      cacheKeyRef.current = null;
    }

    // Early return if no filename or token
    if (!filename || !token) {
      dispatch({ type: 'RESET' });
      return;
    }

    const cacheKey = getCacheKey(filename, type);
    let cancelled = false;

    // Check cache synchronously first
    const cached = getFromCache(cacheKey);
    if (cached) {
      cacheKeyRef.current = cacheKey;
      dispatch({ type: 'FETCH_SUCCESS', url: cached });
      return;
    }

    dispatch({ type: 'FETCH_START' });

    fetchWithDeduplication(filename, token, type)
      .then((blobUrl) => {
        if (!cancelled) {
          cacheKeyRef.current = cacheKey;
          dispatch({ type: 'FETCH_SUCCESS', url: blobUrl });
        } else {
          // Release our reference since we're cancelled
          releaseFromCache(cacheKey);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          dispatch({ type: 'FETCH_ERROR', error: err.message || 'Failed to load media' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filename, token, type]);

  // Release cache reference on unmount
  useEffect(() => {
    return () => {
      if (cacheKeyRef.current) {
        releaseFromCache(cacheKeyRef.current);
      }
    };
  }, []);

  return state;
}

// State machine for media list loading
type MediaListState = {
  urls: Map<string, string>;
  isLoading: boolean;
  errors: Map<string, string>;
};

type MediaListAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_COMPLETE'; urls: Map<string, string>; errors: Map<string, string> }
  | { type: 'RESET' };

function mediaListReducer(state: MediaListState, action: MediaListAction): MediaListState {
  switch (action.type) {
    case 'FETCH_START':
      return { urls: new Map(), isLoading: true, errors: new Map() };
    case 'FETCH_COMPLETE':
      return { urls: action.urls, isLoading: false, errors: action.errors };
    case 'RESET':
      return { urls: new Map(), isLoading: false, errors: new Map() };
    default:
      return state;
  }
}

const initialMediaListState: MediaListState = {
  urls: new Map(),
  isLoading: false,
  errors: new Map(),
};

/**
 * Hook to load multiple media files with authentication
 * Uses in-memory cache and request deduplication
 */
export function useAuthenticatedMediaList(
  filenames: string[],
  token: string,
  type: 'media' | 'avatar' = 'media'
): MediaListState {
  const [state, dispatch] = useReducer(mediaListReducer, initialMediaListState);
  const cacheKeysRef = useRef<string[]>([]);

  // Create a stable key from filenames array
  const filenamesKey = useMemo(() => filenames.join(','), [filenames]);

  useEffect(() => {
    // Release previous cache references
    cacheKeysRef.current.forEach((key) => releaseFromCache(key));
    cacheKeysRef.current = [];

    // Early return if no filenames or token
    if (filenames.length === 0 || !token) {
      dispatch({ type: 'RESET' });
      return;
    }

    let cancelled = false;
    dispatch({ type: 'FETCH_START' });

    Promise.all(
      filenames.map(async (filename) => {
        const cacheKey = getCacheKey(filename, type);
        try {
          const blobUrl = await fetchWithDeduplication(filename, token, type);
          return { filename, cacheKey, blobUrl, error: null };
        } catch (err) {
          return { filename, cacheKey, blobUrl: null, error: (err as Error).message };
        }
      })
    ).then((results) => {
      if (cancelled) {
        // Release references for cancelled request
        results.forEach(({ cacheKey, blobUrl }) => {
          if (blobUrl) releaseFromCache(cacheKey);
        });
        return;
      }

      const newUrls = new Map<string, string>();
      const newErrors = new Map<string, string>();
      const newCacheKeys: string[] = [];

      results.forEach(({ filename, cacheKey, blobUrl, error }) => {
        if (blobUrl) {
          newUrls.set(filename, blobUrl);
          newCacheKeys.push(cacheKey);
        }
        if (error) {
          newErrors.set(filename, error);
        }
      });

      cacheKeysRef.current = newCacheKeys;
      dispatch({ type: 'FETCH_COMPLETE', urls: newUrls, errors: newErrors });
    });

    return () => {
      cancelled = true;
    };
  }, [filenamesKey, filenames, token, type]);

  // Release cache references on unmount
  useEffect(() => {
    return () => {
      cacheKeysRef.current.forEach((key) => releaseFromCache(key));
    };
  }, []);

  return state;
}

/**
 * Simple hook for avatar URLs - returns null if no avatar
 */
export function useAuthenticatedAvatar(
  avatarFilename: string | null,
  token: string
): string | null {
  const { url } = useAuthenticatedMedia(avatarFilename, token, 'avatar');
  return url;
}
