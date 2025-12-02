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
  });
  return URL.createObjectURL(blob);
}

export async function fetchAvatarBlob(filename: string, token: string): Promise<string> {
  const blob = await apiFetchBlob('/uploads/avatars/' + filename, {
    headers: authHeaders(token),
    errorMessage: 'Failed to load avatar',
  });
  return URL.createObjectURL(blob);
}
