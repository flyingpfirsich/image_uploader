import { useState, useCallback } from 'react';
import type { MusicShare } from '../../types';
import { MusicShare as MusicShareComponent } from '../music/MusicShare';
import './RecentSongs.css';

interface RecentSongsProps {
  songs: MusicShare[];
}

const INITIAL_VISIBLE = 3;

export function RecentSongs({ songs }: RecentSongsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = songs.length > INITIAL_VISIBLE;
  const visibleSongs = isExpanded ? songs : songs.slice(0, INITIAL_VISIBLE);
  const hiddenCount = songs.length - INITIAL_VISIBLE;

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <section className="recent-songs">
      <header className="recent-songs-header">
        <h3 className="recent-songs-title">Songs ({songs.length})</h3>
        {hasMore && (
          <button
            className="recent-songs-toggle"
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Show less' : `+${hiddenCount} more`}
          </button>
        )}
      </header>

      <ul className="recent-songs-list">
        {visibleSongs.map((song) => (
          <li key={song.id} className="recent-songs-item">
            <MusicShareComponent track={song} mood={song.moodKaomoji} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}
