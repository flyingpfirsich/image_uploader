import { useState, useEffect } from 'react';
import type { User, Post } from '../../types';
import * as api from '../../services/api';
import { PostCard } from '../feed/PostCard';
import { EditProfile } from './EditProfile';
import { ProfileCalendar } from './ProfileCalendar';
import { NotificationSettings } from '../settings/NotificationSettings';
import { formatDate } from '../../utils/date';
import { AuthenticatedAvatar } from '../common/AuthenticatedAvatar';

interface ProfileProps {
  userId: string;
  currentUserId: string;
  token: string;
  onUserUpdate?: (user: User) => void;
  onSelectUser?: (userId: string) => void;
}

export function Profile({
  userId,
  currentUserId,
  token,
  onUserUpdate,
  onSelectUser,
}: ProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const isOwnProfile = userId === currentUserId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileData, usersData] = await Promise.all([
          api.getUserProfile(token, userId),
          isOwnProfile ? api.getUsers(token) : Promise.resolve({ users: [] }),
        ]);
        setUser(profileData.user);
        setPosts(profileData.posts);
        if (isOwnProfile) {
          setFriends(usersData.users.filter((u: User) => u.id !== currentUserId));
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, userId, isOwnProfile, currentUserId]);

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

  return (
    <div className="profile">
      <header className="profile-header">
        <div className="profile-avatar-section">
          <AuthenticatedAvatar
            filename={user.avatar}
            userId={user.id}
            token={token}
            className="profile-avatar"
            placeholderClassName="profile-avatar--placeholder profile-avatar--kaomoji"
          />
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{user.displayName}</h1>
          <p className="profile-username">@{user.username}</p>
          {user.birthday && (
            <p className="profile-birthday">(^o^)/ {formatDate(new Date(user.birthday))}</p>
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
        <section className="profile-calendar-section">
          <h3 className="section-title">Activity Calendar</h3>
          <ProfileCalendar posts={posts} friends={friends} token={token} />
        </section>
      )}

      {isOwnProfile && (
        <section className="profile-friends">
          <h3 className="section-title">Friends ({friends.length})</h3>
          {friends.length === 0 ? (
            <div className="friends-empty">
              <p className="friends-empty-text">No friends yet!</p>
              <p className="friends-empty-hint">Invite your friends to join druzi</p>
            </div>
          ) : (
            <ul className="friends-list">
              {friends.map((friend) => (
                <li key={friend.id} className="friend-item">
                  <button className="friend-btn" onClick={() => onSelectUser?.(friend.id)}>
                    <AuthenticatedAvatar
                      filename={friend.avatar}
                      userId={friend.id}
                      token={token}
                      className="friend-avatar"
                      placeholderClassName="friend-avatar--placeholder friend-avatar--kaomoji"
                    />
                    <div className="friend-info">
                      <span className="friend-name">{friend.displayName}</span>
                      <span className="friend-username">@{friend.username}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="profile-invite">
            <h4 className="section-title" style={{ marginTop: '1.5rem' }}>
              Invite a Friend
            </h4>
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
          </div>
        </section>
      )}

      {isOwnProfile && (
        <section className="profile-notifications">
          <NotificationSettings />
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
