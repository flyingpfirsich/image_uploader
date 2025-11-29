import { useState } from 'react';
import type { Post } from '../../types';
import { getMediaUrl, getAvatarUrl } from '../../services/api';
import { Reactions } from './Reactions';
import { MusicShare } from '../music';
import { formatDistanceToNow } from '../../utils/date';
import { getKaomojiForUser } from '../../utils/kaomoji';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  token: string;
  onDelete?: (postId: string) => void;
  onReactionChange?: () => void;
  onUserClick?: (userId: string) => void;
}

export function PostCard({ post, currentUserId, token, onDelete, onReactionChange, onUserClick }: PostCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const isOwner = post.userId === currentUserId;
  const avatarUrl = getAvatarUrl(post.user.avatar);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete?.(post.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

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
    <article className="post-card">
      <header className="post-header">
        <button
          className="post-user post-user--clickable"
          onClick={() => onUserClick?.(post.user.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="post-avatar" />
          ) : (
            <div className="post-avatar post-avatar--placeholder post-avatar--kaomoji">
              {getKaomojiForUser(post.user.id)}
            </div>
          )}
          <div className="post-user-info">
            <span className="post-display-name">{post.user.displayName}</span>
            <span className="post-username">@{post.user.username}</span>
          </div>
        </button>
        <div className="post-meta">
          <span className="post-time">{formatDistanceToNow(new Date(post.createdAt))}</span>
          {post.location && <span className="post-location">@ {post.location}</span>}
        </div>
      </header>

      {post.media.length > 0 && (
        <div className="post-media">
          {post.media.length > 1 && (
            <div className="media-nav">
              <button
                className="media-nav-btn"
                onClick={prevMedia}
                disabled={currentMediaIndex === 0}
              >
                ←
              </button>
              <span className="media-counter">
                {currentMediaIndex + 1} / {post.media.length}
              </span>
              <button
                className="media-nav-btn"
                onClick={nextMedia}
                disabled={currentMediaIndex === post.media.length - 1}
              >
                →
              </button>
            </div>
          )}
          {post.media[currentMediaIndex].mimeType.startsWith('video/') ? (
            <video
              src={getMediaUrl(post.media[currentMediaIndex].filename)}
              className="post-media-content"
              controls
              loop
              playsInline
            />
          ) : (
            <img
              src={getMediaUrl(post.media[currentMediaIndex].filename)}
              alt=""
              className="post-media-content"
            />
          )}
        </div>
      )}

      {post.musicShare && (
        <div className="post-music">
          <MusicShare
            track={post.musicShare}
            mood={post.musicShare.moodKaomoji}
          />
        </div>
      )}

      {post.text && <p className="post-text">{post.text}</p>}

      {post.linkUrl && (
        <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="post-link">
          ~&gt; {post.linkTitle || post.linkUrl}
        </a>
      )}

      <footer className="post-footer">
        <Reactions
          postId={post.id}
          reactions={post.reactions}
          currentUserId={currentUserId}
          token={token}
          onReactionChange={onReactionChange}
        />

        {isOwner && (
          <div className="post-actions">
            {showDeleteConfirm ? (
              <>
                <button className="btn--text btn--danger" onClick={handleDelete}>
                  Confirm
                </button>
                <button className="btn--text" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn--text btn--danger" onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>
        )}
      </footer>
    </article>
  );
}
