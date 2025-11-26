import { useState, useEffect } from 'react';
import type { User } from '../../types';
import * as api from '../../services/api';
import { getAvatarUrl } from '../../services/api';
import { getKaomojiForUser } from '../../utils/kaomoji';

interface FriendsProps {
  token: string;
  currentUserId: string;
  onSelectUser: (userId: string) => void;
}

export function Friends({ token, currentUserId, onSelectUser }: FriendsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { users } = await api.getUsers(token);
        setUsers(users);
      } catch (error) {
        console.error('Failed to load friends:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  if (isLoading) {
    return (
      <div className="friends-loading">
        <span className="cursor-blink">Loading friends</span>
      </div>
    );
  }

  const friends = users.filter((u) => u.id !== currentUserId);

  return (
    <div className="friends">
      <h2 className="section-title">Friends ({friends.length})</h2>

      {friends.length === 0 ? (
        <div className="friends-empty">
          <p className="friends-empty-text">No friends yet!</p>
          <p className="friends-empty-hint">
            Invite your friends to join druzi
          </p>
        </div>
      ) : (
        <ul className="friends-list">
          {friends.map((friend) => {
            const avatarUrl = getAvatarUrl(friend.avatar);
            return (
              <li key={friend.id} className="friend-item">
                <button
                  className="friend-btn"
                  onClick={() => onSelectUser(friend.id)}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="friend-avatar" />
                  ) : (
                    <div className="friend-avatar friend-avatar--placeholder friend-avatar--kaomoji">
                      {getKaomojiForUser(friend.id)}
                    </div>
                  )}
                  <div className="friend-info">
                    <span className="friend-name">{friend.displayName}</span>
                    <span className="friend-username">@{friend.username}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

