import { useState } from 'react';
import type { Comment } from '../../types';
import * as api from '../../services/api';
import { formatDistanceToNow } from '../../utils/date';
import { getKaomojiForUser } from '../../utils/kaomoji';
import { useAuthenticatedAvatar } from '../../hooks/useAuthenticatedMedia';

interface CommentsProps {
  postId: string;
  comments: Comment[];
  currentUserId: string;
  token: string;
  onCommentChange?: () => void;
  onUserClick?: (userId: string) => void;
}

function CommentAvatar({
  avatar,
  userId,
  token,
}: {
  avatar: string | null;
  userId: string;
  token: string;
}) {
  const avatarUrl = useAuthenticatedAvatar(avatar, token);

  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="comment-avatar" />;
  }

  return (
    <div className="comment-avatar comment-avatar--placeholder">{getKaomojiForUser(userId)}</div>
  );
}

export function Comments({
  postId,
  comments,
  currentUserId,
  token,
  onCommentChange,
  onUserClick,
}: CommentsProps) {
  const [showInput, setShowInput] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await api.addComment(token, postId, newComment.trim());
      setNewComment('');
      setShowInput(false);
      onCommentChange?.();
    } catch (error) {
      console.error('Add comment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setIsLoading(true);
    try {
      await api.deleteComment(token, postId, commentId);
      onCommentChange?.();
    } catch (error) {
      console.error('Delete comment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="comments">
      {comments.length > 0 && (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment">
              <button className="comment-user" onClick={() => onUserClick?.(comment.user.id)}>
                <CommentAvatar
                  avatar={comment.user.avatar}
                  userId={comment.user.id}
                  token={token}
                />
              </button>
              <div className="comment-content">
                <div className="comment-header">
                  <button className="comment-author" onClick={() => onUserClick?.(comment.user.id)}>
                    {comment.user.displayName}
                  </button>
                  <span className="comment-time">
                    {formatDistanceToNow(new Date(comment.createdAt))}
                  </span>
                  {comment.userId === currentUserId && (
                    <button
                      className="comment-delete"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={isLoading}
                      title="Delete comment"
                    >
                      ×
                    </button>
                  )}
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInput ? (
        <form className="comment-form" onSubmit={handleAddComment}>
          <input
            type="text"
            className="comment-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            disabled={isLoading}
            autoFocus
          />
          <div className="comment-form-actions">
            <button
              type="button"
              className="btn--text"
              onClick={() => {
                setShowInput(false);
                setNewComment('');
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn--text btn--primary"
              disabled={isLoading || !newComment.trim()}
            >
              Post
            </button>
          </div>
        </form>
      ) : (
        <button className="comment-toggle" onClick={() => setShowInput(true)}>
          {comments.length > 0 ? 'Add comment' : 'Comment'}
        </button>
      )}
    </div>
  );
}
