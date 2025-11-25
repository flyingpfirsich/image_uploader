import { useState, useEffect } from 'react';
import type { User, Post } from '../../types';
import * as api from '../../services/api';
import { getAvatarUrl } from '../../services/api';
import { PostCard } from '../feed/PostCard';
import { EditProfile } from './EditProfile';
import { formatDate } from '../../utils/date';

interface ProfileProps {
  userId: string;
  currentUserId: string;
  token: string;
  onUserUpdate?: (user: User) => void;
}

export function Profile({ userId, currentUserId, token, onUserUpdate }: ProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const isOwnProfile = userId === currentUserId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { user, posts } = await api.getUserProfile(token, userId);
        setUser(user);
        setPosts(posts);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, userId]);

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const { code } = await api.createInvite(token);
      setInviteCode(code);
    } catch (error) {
      console.error('Failed to create invite:', error);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    onUserUpdate?.(updatedUser);
    setShowEdit(false);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.deletePost(token, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <span className="cursor-blink">Loading profile</span>
      </div>
    );
  }

  if (!user) {
    return <div className="profile-error">User not found</div>;
  }

  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <div className="profile">
      <header className="profile-header">
        <div className="profile-avatar-section">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar--placeholder">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{user.displayName}</h1>
          <p className="profile-username">@{user.username}</p>
          {user.birthday && (
            <p className="profile-birthday">🎂 {formatDate(new Date(user.birthday))}</p>
          )}
          <p className="profile-joined">Joined {formatDate(new Date(user.createdAt))}</p>
        </div>

        {isOwnProfile && (
          <div className="profile-actions">
            <button className="btn btn--secondary" onClick={() => setShowEdit(true)}>
              Edit Profile
            </button>
          </div>
        )}
      </header>

      {isOwnProfile && (
        <section className="profile-invite">
          <h3 className="section-title">Invite a Friend</h3>
          {inviteCode ? (
            <div className="invite-code-display">
              <code className="invite-code">{inviteCode}</code>
              <button
                className="btn--text"
                onClick={() => navigator.clipboard.writeText(inviteCode)}
              >
                Copy
              </button>
            </div>
          ) : (
            <button
              className="btn btn--secondary"
              onClick={handleCreateInvite}
              disabled={isCreatingInvite}
            >
              {isCreatingInvite ? 'Creating...' : 'Generate Invite Code'}
            </button>
          )}
          <p className="invite-hint">Code expires in 7 days</p>
        </section>
      )}

      <section className="profile-archive">
        <h3 className="section-title">Archive ({posts.length} posts)</h3>
        {posts.length === 0 ? (
          <p className="archive-empty">No posts yet</p>
        ) : (
          <div className="archive-list">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                token={token}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}
      </section>

      {showEdit && (
        <EditProfile
          user={user}
          token={token}
          onSave={handleProfileUpdate}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

