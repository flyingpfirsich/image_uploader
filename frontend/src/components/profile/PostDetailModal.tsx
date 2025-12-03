import { useState } from 'react';
import type { Post } from '../../types';
import { Reactions } from '../feed/Reactions';
import { Comments } from '../feed/Comments';
import { MusicShare } from '../music';
import { formatDistanceToNow } from '../../utils/date';
import { useAuthenticatedMedia } from '../../hooks/useAuthenticatedMedia';

interface PostDetailModalProps {
  post: Post;
  currentUserId: string;
  token: string;
  onClose: () => void;
  onPostChange?: () => void;
}

function MediaContent({
  filename,
  mimeType,
  token,
}: {
  filename: string;
  mimeType: string;
  token: string;
}) {
  const { url, isLoading } = useAuthenticatedMedia(filename, token, 'media');

  if (isLoading) {
    return <div className="post-detail-media-loading">...</div>;
  }

  if (!url) return null;

  if (mimeType.startsWith('video/')) {
    return <video src={url} className="post-detail-media-content" controls loop playsInline />;
  }

  return <img src={url} alt="" className="post-detail-media-content" />;
}

export function PostDetailModal({
  post,
  currentUserId,
  token,
  onClose,
  onPostChange,
}: PostDetailModalProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const hasMultipleMedia = post.media.length > 1;

  const nextMedia = () => {
    if (currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const prevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  return (
    <div className="post-detail-overlay" onClick={onClose}>
      <div className="post-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="day-modal-close" onClick={onClose}>
          ✕
        </button>

        {post.media.length > 0 && (
          <div className="post-detail-media">
            {hasMultipleMedia && (
              <div className="post-detail-media-nav">
                <button
                  className="post-detail-nav-btn"
                  onClick={prevMedia}
                  disabled={currentMediaIndex === 0}
                >
                  ←
                </button>
                <span className="post-detail-counter">
                  {currentMediaIndex + 1} / {post.media.length}
                </span>
                <button
                  className="post-detail-nav-btn"
                  onClick={nextMedia}
                  disabled={currentMediaIndex === post.media.length - 1}
                >
                  →
                </button>
              </div>
            )}
            <MediaContent
              filename={post.media[currentMediaIndex].filename}
              mimeType={post.media[currentMediaIndex].mimeType}
              token={token}
            />
          </div>
        )}

        <div className="post-detail-content">
          <div className="post-detail-header">
            <span className="post-detail-user">{post.user.displayName}</span>
            <span className="post-detail-time">
              {formatDistanceToNow(new Date(post.createdAt))}
            </span>
          </div>

          {post.musicShare && (
            <div className="post-detail-music">
              <MusicShare track={post.musicShare} mood={post.musicShare.moodKaomoji} compact />
            </div>
          )}

          {post.text && <p className="post-detail-text">{post.text}</p>}

          {post.location && <p className="post-detail-location">@ {post.location}</p>}

          <div className="post-detail-interactions">
            <Reactions
              postId={post.id}
              reactions={post.reactions}
              currentUserId={currentUserId}
              token={token}
              onReactionChange={onPostChange}
            />
            <Comments
              postId={post.id}
              comments={post.comments}
              currentUserId={currentUserId}
              token={token}
              onCommentChange={onPostChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
