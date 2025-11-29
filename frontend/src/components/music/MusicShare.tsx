import { useState, useRef, useCallback } from 'react';
import type { SpotifyTrack, MusicShare as MusicShareType } from '../../types';

interface MusicShareProps {
  track: SpotifyTrack | MusicShareType;
  mood?: string | null;
  compact?: boolean;
  showRemove?: boolean;
  onRemove?: () => void;
}

export function MusicShare({ track, mood, compact = false, showRemove, onRemove }: MusicShareProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const previewUrl = track.previewUrl;
  const externalUrl = track.externalUrl;
  const albumArtUrl = track.albumArtUrl;

  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!previewUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [previewUrl, isPlaying]);

  const handleClick = useCallback(() => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    }
  }, [externalUrl]);

  if (compact) {
    return (
      <div 
        className="music-share music-share--compact"
        onClick={handleClick}
        style={{ cursor: externalUrl ? 'pointer' : 'default' }}
      >
        {albumArtUrl && (
          <div className="music-share-art-wrapper">
            <img
              src={albumArtUrl}
              alt={track.albumName || 'Album art'}
              className="music-share-art"
            />
            {previewUrl && (
              <button
                className={`music-share-play ${isPlaying ? 'playing' : ''}`}
                onClick={handlePlayPause}
              >
                {isPlaying ? '■' : '▶'}
              </button>
            )}
          </div>
        )}
        <div className="music-share-info">
          <p className="music-share-track">{track.trackName}</p>
          <p className="music-share-artist">{track.artistName}</p>
        </div>
        {mood && <span className="music-share-mood">{mood}</span>}
        {showRemove && onRemove && (
          <button className="music-share-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            x
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      className="music-share"
      onClick={handleClick}
      style={{ cursor: externalUrl ? 'pointer' : 'default' }}
    >
      {albumArtUrl && (
        <div className="music-share-art-wrapper">
          <img
            src={albumArtUrl}
            alt={track.albumName || 'Album art'}
            className="music-share-art"
          />
          {previewUrl && (
            <button
              className={`music-share-play ${isPlaying ? 'playing' : ''}`}
              onClick={handlePlayPause}
            >
              {isPlaying ? '■' : '▶'}
            </button>
          )}
        </div>
      )}
      <div className="music-share-info">
        <p className="music-share-track">{track.trackName}</p>
        <p className="music-share-artist">{track.artistName}</p>
        {track.albumName && <p className="music-share-album">{track.albumName}</p>}
      </div>
      {mood && <span className="music-share-mood">{mood}</span>}
      {showRemove && onRemove && (
        <button className="music-share-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          x
        </button>
      )}
      {externalUrl && (
        <span className="music-share-spotify-badge">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </span>
      )}
    </div>
  );
}

