import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../../types';
import * as api from '../../services/api';
import { PostCard } from './PostCard';
import { CreatePost } from './CreatePost';

interface FeedProps {
  token: string;
  userId: string;
  onUserClick?: (userId: string) => void;
}

export function Feed({ token, userId, onUserClick }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const { posts } = await api.getFeed(token);
      setPosts(posts);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleDelete = async (postId: string) => {
    try {
      await api.deletePost(token, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="feed-loading">
        <span className="cursor-blink">Loading feed</span>
      </div>
    );
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <h2 className="section-title">Today's Moments</h2>
        <button className="btn" onClick={() => setShowCreatePost(true)}>
          + New Post
        </button>
      </div>

      {error && (
        <ul className="status-list">
          <li className="status-item status-item--error">{error}</li>
        </ul>
      )}

      {posts.length === 0 ? (
        <div className="feed-empty">
          <p className="feed-empty-text">No posts today yet.</p>
          <p className="feed-empty-hint">Be the first to share a moment!</p>
        </div>
      ) : (
        <div className="feed-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              token={token}
              onDelete={handleDelete}
              onReactionChange={fetchFeed}
              onUserClick={onUserClick}
            />
          ))}
        </div>
      )}

      {showCreatePost && (
        <CreatePost
          token={token}
          onPostCreated={fetchFeed}
          onClose={() => setShowCreatePost(false)}
        />
      )}
    </div>
  );
}
