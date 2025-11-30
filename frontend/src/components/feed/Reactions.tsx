import { useState } from 'react';
import type { Reaction } from '../../types';
import { KAOMOJI_REACTIONS } from '../../types';
import * as api from '../../services/api';

interface ReactionsProps {
  postId: string;
  reactions: Reaction[];
  currentUserId: string;
  token: string;
  onReactionChange?: () => void;
}

export function Reactions({
  postId,
  reactions,
  currentUserId,
  token,
  onReactionChange,
}: ReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Group reactions by kaomoji
  const grouped = reactions.reduce(
    (acc, r) => {
      if (!acc[r.kaomoji]) {
        acc[r.kaomoji] = { count: 0, users: [], hasOwn: false };
      }
      acc[r.kaomoji].count++;
      acc[r.kaomoji].users.push(r.user.displayName);
      if (r.userId === currentUserId) {
        acc[r.kaomoji].hasOwn = true;
      }
      return acc;
    },
    {} as Record<string, { count: number; users: string[]; hasOwn: boolean }>
  );

  const handleToggleReaction = async (kaomoji: string) => {
    setIsLoading(true);
    try {
      if (grouped[kaomoji]?.hasOwn) {
        await api.removeReaction(token, postId, kaomoji);
      } else {
        await api.addReaction(token, postId, kaomoji);
      }
      onReactionChange?.();
    } catch (error) {
      console.error('Reaction error:', error);
    } finally {
      setIsLoading(false);
      setShowPicker(false);
    }
  };

  return (
    <div className="reactions">
      <div className="reaction-list">
        {Object.entries(grouped).map(([kaomoji, data]) => (
          <button
            key={kaomoji}
            className={`reaction-badge ${data.hasOwn ? 'reaction-badge--own' : ''}`}
            onClick={() => handleToggleReaction(kaomoji)}
            disabled={isLoading}
            title={data.users.join(', ')}
          >
            <span className="reaction-kaomoji">{kaomoji}</span>
            {data.count > 1 && <span className="reaction-count">{data.count}</span>}
          </button>
        ))}
      </div>

      <button
        className="reaction-add"
        onClick={() => setShowPicker(!showPicker)}
        disabled={isLoading}
      >
        +
      </button>

      {showPicker && (
        <div className="reaction-picker">
          {KAOMOJI_REACTIONS.map((kaomoji) => (
            <button
              key={kaomoji}
              className="reaction-option"
              onClick={() => handleToggleReaction(kaomoji)}
              disabled={isLoading}
            >
              {kaomoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
