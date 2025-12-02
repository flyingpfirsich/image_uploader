import type { Post } from '../../types';
import { MusicShare } from '../music';
import { AuthenticatedMedia } from '../common/AuthenticatedMedia';

export interface DayData {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  uploads: Post[];
  birthdays: { id: string; displayName: string }[];
  isToday: boolean;
}

interface DayDetailModalProps {
  day: DayData;
  token: string;
  onClose: () => void;
}

function formatDateTitle(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DayDetailModal({ day, token, onClose }: DayDetailModalProps) {
  return (
    <div className="day-modal-overlay" onClick={onClose}>
      <div className="day-modal" onClick={(e) => e.stopPropagation()}>
        <div className="day-modal-header">
          <button className="day-modal-close" onClick={onClose}>
            ✕
          </button>
          <h3 className="day-modal-title">{formatDateTitle(day.date)}</h3>
          <div className="day-modal-spacer" />
        </div>

        <div className="day-modal-content">
          <div className="day-modal-posts">
            {day.uploads.map((post) => (
              <div key={post.id} className="day-modal-post">
                {post.media && post.media.length > 0 && (
                  <div className="day-modal-media-grid">
                    {post.media.map((media) => (
                      <AuthenticatedMedia
                        key={media.id}
                        filename={media.filename}
                        mimeType={media.mimeType}
                        token={token}
                        className="day-modal-media"
                      />
                    ))}
                  </div>
                )}
                {post.musicShare && (
                  <div className="day-modal-music">
                    <MusicShare
                      track={post.musicShare}
                      mood={post.musicShare.moodKaomoji}
                      compact
                    />
                  </div>
                )}
                {post.text && <p className="day-modal-text">{post.text}</p>}
                {post.location && <p className="day-modal-location">@ {post.location}</p>}
                <p className="day-modal-time">
                  {new Date(post.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
