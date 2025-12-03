import { useEffect, useRef, useMemo, useReducer } from 'react';
import { fetchMediaBlob, fetchAvatarBlob } from '../services/api';

interface UseAuthenticatedMediaResult {
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

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
 * Automatically cleans up blob URLs on unmount or when filename changes
 */
export function useAuthenticatedMedia(
  filename: string | null,
  token: string,
  type: 'media' | 'avatar' = 'media'
): UseAuthenticatedMediaResult {
  const [state, dispatch] = useReducer(mediaReducer, initialMediaState);
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Cleanup previous blob URL
    const previousUrl = currentUrlRef.current;
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
      currentUrlRef.current = null;
    }

    // Early return if no filename or token
    if (!filename || !token) {
      dispatch({ type: 'RESET' });
      return;
    }

    let cancelled = false;
    dispatch({ type: 'FETCH_START' });

    const fetchFn = type === 'avatar' ? fetchAvatarBlob : fetchMediaBlob;

    fetchFn(filename, token)
      .then((blobUrl) => {
        if (!cancelled) {
          currentUrlRef.current = blobUrl;
          dispatch({ type: 'FETCH_SUCCESS', url: blobUrl });
        } else {
          URL.revokeObjectURL(blobUrl);
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

  // Cleanup on unmount
  useEffect(() => {
    const urlRef = currentUrlRef;
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
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
 * Useful for posts with multiple images/videos
 */
export function useAuthenticatedMediaList(
  filenames: string[],
  token: string,
  type: 'media' | 'avatar' = 'media'
): MediaListState {
  const [state, dispatch] = useReducer(mediaListReducer, initialMediaListState);
  const urlsRef = useRef<Map<string, string>>(new Map());

  // Create a stable key from filenames array
  const filenamesKey = useMemo(() => filenames.join(','), [filenames]);

  useEffect(() => {
    // Cleanup all previous blob URLs
    const previousUrls = urlsRef.current;
    previousUrls.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = new Map();

    // Early return if no filenames or token
    if (filenames.length === 0 || !token) {
      dispatch({ type: 'RESET' });
      return;
    }

    let cancelled = false;
    dispatch({ type: 'FETCH_START' });

    const fetchFn = type === 'avatar' ? fetchAvatarBlob : fetchMediaBlob;

    Promise.all(
      filenames.map(async (filename) => {
        try {
          const blobUrl = await fetchFn(filename, token);
          return { filename, blobUrl, error: null };
        } catch (err) {
          return { filename, blobUrl: null, error: (err as Error).message };
        }
      })
    ).then((results) => {
      if (cancelled) {
        results.forEach(({ blobUrl }) => {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
        });
        return;
      }

      const newUrls = new Map<string, string>();
      const newErrors = new Map<string, string>();

      results.forEach(({ filename, blobUrl, error }) => {
        if (blobUrl) {
          newUrls.set(filename, blobUrl);
          urlsRef.current.set(filename, blobUrl);
        }
        if (error) {
          newErrors.set(filename, error);
        }
      });

      dispatch({ type: 'FETCH_COMPLETE', urls: newUrls, errors: newErrors });
    });

    return () => {
      cancelled = true;
    };
  }, [filenamesKey, filenames, token, type]);

  // Cleanup on unmount
  useEffect(() => {
    const refValue = urlsRef.current;
    return () => {
      refValue.forEach((url) => URL.revokeObjectURL(url));
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
