import { useState, useEffect, useCallback } from 'react';
import type { Post, ListActivity } from '../../types';
import * as api from '../../services/api';
import { PostCard } from './PostCard';
import { CreatePost } from './CreatePost';
import { ListActivityItem } from './ListActivityItem';

interface FeedProps {
  token: string;
  userId: string;
  onUserClick?: (userId: string) => void;
}

// Union type for feed items
type FeedItem =
  | { type: 'post'; data: Post; createdAt: Date }
  | { type: 'list_activity'; data: ListActivity; createdAt: Date };

export function Feed({ token, userId, onUserClick }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [listActivity, setListActivity] = useState<ListActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const response = await api.getFeed(token);
      setPosts(response.posts);
      setListActivity(response.listActivity || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Combine and sort posts and list activity
  const feedItems: FeedItem[] = [
    ...posts.map(
      (post): FeedItem => ({
        type: 'post',
        data: post,
        createdAt: new Date(post.createdAt),
      })
    ),
    ...listActivity.map(
      (activity): FeedItem => ({
        type: 'list_activity',
        data: activity,
        createdAt: new Date(activity.createdAt),
      })
    ),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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

      {feedItems.length === 0 ? (
        <div className="feed-empty">
          <p className="feed-empty-text">No posts today yet.</p>
          <p className="feed-empty-hint">Be the first to share a moment!</p>
        </div>
      ) : (
        <div className="feed-list">
          {feedItems.map((item) =>
            item.type === 'post' ? (
              <PostCard
                key={`post-${item.data.id}`}
                post={item.data}
                currentUserId={userId}
                token={token}
                onDelete={handleDelete}
                onReactionChange={fetchFeed}
                onUserClick={onUserClick}
              />
            ) : (
              <ListActivityItem
                key={`activity-${item.data.listId}-${item.data.type}-${item.createdAt.getTime()}`}
                activity={item.data}
                token={token}
                currentUserId={userId}
                onUserClick={onUserClick}
              />
            )
          )}
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
