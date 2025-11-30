import { config } from '../config.js';

export interface SpotifyTrack {
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArtUrl: string | null;
  previewUrl: string | null;
  externalUrl: string;
}

// Spotify API response types
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
}

interface SpotifyTrackResponse {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrackResponse[];
  };
}

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Check if Spotify is configured with valid credentials
 */
export function isSpotifyConfigured(): boolean {
  return !!(config.spotifyClientId && config.spotifyClientSecret);
}

/**
 * Get an access token using Client Credentials flow
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!isSpotifyConfigured()) {
    throw new Error('Spotify is not configured');
  }

  const credentials = Buffer.from(
    `${config.spotifyClientId}:${config.spotifyClientSecret}`
  ).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify access token');
  }

  const data = (await response.json()) as SpotifyTokenResponse;
  cachedToken = data.access_token;
  // Set expiry 5 minutes before actual expiry to be safe
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

  return cachedToken;
}

/**
 * Search for tracks on Spotify
 */
export async function searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
  const token = await getAccessToken();

  const searchParams = new URLSearchParams({
    q: query,
    type: 'track',
    limit: limit.toString(),
  });

  const response = await fetch(`https://api.spotify.com/v1/search?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to search Spotify');
  }

  const data = (await response.json()) as SpotifySearchResponse;

  return data.tracks.items.map((track) => ({
    spotifyTrackId: track.id,
    trackName: track.name,
    artistName: track.artists.map((a) => a.name).join(', '),
    albumName: track.album.name,
    albumArtUrl: track.album.images[0]?.url || null,
    previewUrl: track.preview_url || null,
    externalUrl: track.external_urls.spotify,
  }));
}

/**
 * Get a single track by ID
 */
export async function getTrack(trackId: string): Promise<SpotifyTrack | null> {
  const token = await getAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to get track from Spotify');
  }

  const track = (await response.json()) as SpotifyTrackResponse;

  return {
    spotifyTrackId: track.id,
    trackName: track.name,
    artistName: track.artists.map((a) => a.name).join(', '),
    albumName: track.album.name,
    albumArtUrl: track.album.images[0]?.url || null,
    previewUrl: track.preview_url || null,
    externalUrl: track.external_urls.spotify,
  };
}
