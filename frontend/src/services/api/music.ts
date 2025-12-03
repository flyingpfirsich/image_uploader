/**
 * Music API functions
 */
import type { SpotifyTrack, MusicShare } from '../../types';
import { apiGet, apiPost, authHeaders, jsonHeaders, API_URL } from './client';

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
  return apiGet<{ tracks: SpotifyTrack[] }>('/api/music/search?q=' + encodeURIComponent(query), {
    headers: authHeaders(token),
    errorMessage: 'Failed to search music',
  });
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
  return apiPost<MusicShare>('/api/music', {
    headers: jsonHeaders(token),
    body: data,
    errorMessage: 'Failed to create music share',
  });
}
