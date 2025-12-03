import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Post, ListActivity } from '../../types';
import * as api from '../../services/api';
import { PostCard } from './PostCard';
import { ListActivityItem } from './ListActivityItem';
import { ErrorMessage, LoadingSpinner } from '../common';

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

  // Combine and sort posts and list activity - memoized to avoid recalculation on every render
  const feedItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [
      ...posts.map((post) => ({
        type: 'post' as const,
        data: post,
        createdAt: new Date(post.createdAt),
      })),
      ...listActivity.map((activity) => ({
        type: 'list_activity' as const,
        data: activity,
        createdAt: new Date(activity.createdAt),
      })),
    ];
    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [posts, listActivity]);

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
    return <LoadingSpinner message="Loading feed" className="feed-loading" />;
  }

  return (
    <div className="feed">
      <h2 className="section-title">Today's Moments</h2>

      <ErrorMessage message={error} />

      {feedItems.length === 0 ? (
        <div className="feed-empty">
          <p className="feed-empty-text">No posts today yet.</p>
          <p className="feed-empty-hint">Tap + to share a moment!</p>
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
                key={`activity-${item.data.listId}-${item.data.type}-${item.createdAt.getTime()}-${item.data.itemTitle ?? ''}`}
                activity={item.data}
                token={token}
                currentUserId={userId}
                onUserClick={onUserClick}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
