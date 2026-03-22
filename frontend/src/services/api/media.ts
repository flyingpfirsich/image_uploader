/**
 * Media API functions
 * Fetch media with auth headers and return blob URLs
 * This approach keeps tokens secure (not in URLs, logs, or browser history)
 */
import { apiFetchBlob, authHeaders } from './client';

export async function fetchMediaBlob(filename: string, token: string): Promise<string> {
  const blob = await apiFetchBlob('/uploads/media/' + filename, {
    headers: authHeaders(token),
    errorMessage: 'Failed to load media',
    useUploadsUrl: true,
  });
  return URL.createObjectURL(blob);
}

export async function fetchAvatarBlob(filename: string, token: string): Promise<string> {
  const blob = await apiFetchBlob('/uploads/avatars/' + filename, {
    headers: authHeaders(token),
    errorMessage: 'Failed to load avatar',
    useUploadsUrl: true,
  });
  return URL.createObjectURL(blob);
}

/**
 * Invalidate a cached media or avatar file.
 * Call this when a file is updated (e.g., user changes their avatar).
 */
export function invalidateMediaCache(path: string): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'INVALIDATE_CACHE',
      path,
    });
  }
}

/**
 * Clear the entire media cache.
 * Call this on logout or when a full refresh is needed.
 */
export function clearMediaCache(): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_MEDIA_CACHE',
    });
  }
}
