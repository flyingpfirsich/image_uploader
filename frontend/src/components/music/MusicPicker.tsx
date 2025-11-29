import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import type { SpotifyTrack } from '../../types';
import { MUSIC_MOOD_KAOMOJIS } from '../../types';

interface MusicPickerProps {
  token: string;
  onSelect: (track: SpotifyTrack, mood?: string) => void;
  onClose: () => void;
}

export function MusicPicker({ token, onSelect, onClose }: MusicPickerProps) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  // Check if Spotify is configured on mount
  useEffect(() => {
    api.getSpotifyStatus()
      .then(({ configured }) => setIsConfigured(configured))
      .catch(() => setIsConfigured(false));
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setTracks([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError('');

      try {
        const { tracks } = await api.searchMusic(token, query);
        setTracks(tracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setTracks([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, token]);

  const handleTrackClick = useCallback((track: SpotifyTrack) => {
    setSelectedTrack(track);
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedTrack) {
      onSelect(selectedTrack, selectedMood || undefined);
    }
  }, [selectedTrack, selectedMood, onSelect]);

  if (isConfigured === false) {
    return (
      <div className="music-picker-overlay" onClick={onClose}>
        <div className="music-picker" onClick={(e) => e.stopPropagation()}>
          <header className="music-picker-header">
            <h3>♪ Add Music</h3>
            <button className="btn--text" onClick={onClose}>x</button>
          </header>
          <div className="music-picker-empty">
            <p className="music-picker-empty-kaomoji">(；へ；)</p>
            <p className="music-picker-empty-text">Spotify not configured</p>
            <p className="music-picker-empty-hint">Contact admin to set up Spotify credentials</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="music-picker-overlay" onClick={onClose}>
      <div className="music-picker" onClick={(e) => e.stopPropagation()}>
        <header className="music-picker-header">
          <h3>♪ Add Music</h3>
          <button className="btn--text" onClick={onClose}>x</button>
        </header>

        {/* Search Input */}
        <div className="music-picker-search">
          <input
            type="text"
            className="form-input"
            placeholder="Search for a song..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Error */}
        {error && (
          <p className="music-picker-error">{error}</p>
        )}

        {/* Selected Track Preview */}
        {selectedTrack && (
          <div className="music-picker-selected">
            <div className="music-picker-selected-track">
              {selectedTrack.albumArtUrl && (
                <img
                  src={selectedTrack.albumArtUrl}
                  alt={selectedTrack.albumName}
                  className="music-picker-selected-art"
                />
              )}
              <div className="music-picker-selected-info">
                <p className="music-picker-selected-name">{selectedTrack.trackName}</p>
                <p className="music-picker-selected-artist">{selectedTrack.artistName}</p>
              </div>
              <button
                className="music-picker-selected-remove"
                onClick={() => setSelectedTrack(null)}
              >
                x
              </button>
            </div>

            {/* Mood Selection */}
            <div className="music-picker-mood">
              <p className="music-picker-mood-label">How does it make you feel?</p>
              <div className="music-picker-mood-options">
                {MUSIC_MOOD_KAOMOJIS.map(({ kaomoji, label }) => (
                  <button
                    key={kaomoji}
                    className={`music-picker-mood-btn ${selectedMood === kaomoji ? 'selected' : ''}`}
                    onClick={() => setSelectedMood(selectedMood === kaomoji ? null : kaomoji)}
                    title={label}
                  >
                    {kaomoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm Button */}
            <button className="btn music-picker-confirm" onClick={handleConfirm}>
              Add This Track
            </button>
          </div>
        )}

        {/* Search Results */}
        {!selectedTrack && (
          <div className="music-picker-results">
            {isSearching ? (
              <div className="music-picker-loading">Searching...</div>
            ) : tracks.length === 0 && query.length >= 2 ? (
              <div className="music-picker-empty">
                <p className="music-picker-empty-kaomoji">(・_・)</p>
                <p className="music-picker-empty-text">No tracks found</p>
              </div>
            ) : tracks.length === 0 ? (
              <div className="music-picker-empty">
                <p className="music-picker-empty-kaomoji">♪(´ε` )</p>
                <p className="music-picker-empty-text">Search for a song</p>
                <p className="music-picker-empty-hint">Type at least 2 characters</p>
              </div>
            ) : (
              <ul className="music-picker-list">
                {tracks.map((track) => (
                  <li
                    key={track.spotifyTrackId}
                    className="music-picker-item"
                    onClick={() => handleTrackClick(track)}
                  >
                    {track.albumArtUrl && (
                      <img
                        src={track.albumArtUrl}
                        alt={track.albumName}
                        className="music-picker-item-art"
                      />
                    )}
                    <div className="music-picker-item-info">
                      <p className="music-picker-item-name">{track.trackName}</p>
                      <p className="music-picker-item-artist">{track.artistName}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

