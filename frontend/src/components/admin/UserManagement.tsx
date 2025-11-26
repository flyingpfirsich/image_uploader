import { useState, useEffect, useMemo, useCallback } from 'react';
import * as api from '../../services/api';
import type { AdminUser } from '../../services/api';

interface UserManagementProps {
  token: string;
}

type SortField = 'username' | 'displayName' | 'createdAt' | 'postCount';
type SortOrder = 'asc' | 'desc';

export function UserManagement({ token }: UserManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { users } = await api.getAdminUsers(token);
      setUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    const result = users.filter(user => {
      const query = searchQuery.toLowerCase();
      return (
        user.username.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query)
      );
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'username':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'displayName':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'postCount':
          comparison = a.postCount - b.postCount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [users, searchQuery, sortField, sortOrder]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;
    
    setActionLoading(true);
    setActionMessage(null);
    try {
      await api.deleteAdminUser(token, selectedUser.id);
      setActionMessage({ type: 'success', text: `User ${selectedUser.username} deleted` });
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setTimeout(() => {
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        setActionMessage(null);
      }, 1500);
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete user' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!selectedUser || !newPassword) return;
    
    setActionLoading(true);
    setActionMessage(null);
    try {
      await api.resetUserPassword(token, selectedUser.id, newPassword);
      setActionMessage({ type: 'success', text: `Password reset for ${selectedUser.username}` });
      setNewPassword('');
      setTimeout(() => {
        setShowResetPassword(false);
        setSelectedUser(null);
        setActionMessage(null);
      }, 1500);
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to reset password' });
    } finally {
      setActionLoading(false);
    }
  }

  function openDeleteConfirm(user: AdminUser) {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
    setActionMessage(null);
  }

  function openResetPassword(user: AdminUser) {
    setSelectedUser(user);
    setShowResetPassword(true);
    setNewPassword('');
    setActionMessage(null);
  }

  function closeModals() {
    setShowDeleteConfirm(false);
    setShowResetPassword(false);
    setSelectedUser(null);
    setNewPassword('');
    setActionMessage(null);
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="cursor-blink">loading users</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <span className="error-icon">(╯°□°)╯</span>
        <span>{error}</span>
        <button className="btn btn--secondary" onClick={loadUsers}>retry</button>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-controls">
        <input
          type="text"
          className="form-input form-input--small"
          placeholder="search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="user-count">{filteredUsers.length} users</span>
      </div>

      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th 
                className={`sortable ${sortField === 'username' ? 'sorted' : ''}`}
                onClick={() => handleSort('username')}
              >
                username {sortField === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortField === 'displayName' ? 'sorted' : ''}`}
                onClick={() => handleSort('displayName')}
              >
                display name {sortField === 'displayName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortField === 'postCount' ? 'sorted' : ''}`}
                onClick={() => handleSort('postCount')}
              >
                posts {sortField === 'postCount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>reactions</th>
              <th>push</th>
              <th 
                className={`sortable ${sortField === 'createdAt' ? 'sorted' : ''}`}
                onClick={() => handleSort('createdAt')}
              >
                joined {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td className="user-cell-username">@{user.username}</td>
                <td>{user.displayName}</td>
                <td className="user-cell-number">{user.postCount}</td>
                <td className="user-cell-number">{user.reactionCount}</td>
                <td className="user-cell-status">
                  {user.hasPushSubscription ? (
                    <span className="status-dot status-dot--active" title="Has push subscription">●</span>
                  ) : (
                    <span className="status-dot status-dot--inactive" title="No push subscription">○</span>
                  )}
                </td>
                <td className="user-cell-date">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="user-cell-actions">
                  <button
                    className="btn-icon"
                    onClick={() => openResetPassword(user)}
                    title="Reset password"
                  >
                    ⟳
                  </button>
                  <button
                    className="btn-icon btn-icon--danger"
                    onClick={() => openDeleteConfirm(user)}
                    title="Delete user"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>delete user</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-warning">
                <span className="warning-icon">(╯°□°)╯</span>
                Are you sure you want to delete <strong>@{selectedUser.username}</strong>?
              </p>
              <p className="modal-info">
                This will permanently delete the user and all their posts, reactions, and media.
              </p>
              {actionMessage && (
                <p className={`modal-message modal-message--${actionMessage.type}`}>
                  {actionMessage.text}
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn--secondary" onClick={closeModals} disabled={actionLoading}>
                cancel
              </button>
              <button 
                className="btn btn--danger" 
                onClick={handleDeleteUser} 
                disabled={actionLoading}
              >
                {actionLoading ? 'deleting...' : 'delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && selectedUser && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>reset password</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <p>Reset password for <strong>@{selectedUser.username}</strong></p>
              <div className="form-row">
                <label className="form-label">new password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="minimum 6 characters"
                />
              </div>
              {actionMessage && (
                <p className={`modal-message modal-message--${actionMessage.type}`}>
                  {actionMessage.text}
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn--secondary" onClick={closeModals} disabled={actionLoading}>
                cancel
              </button>
              <button 
                className="btn" 
                onClick={handleResetPassword} 
                disabled={actionLoading || newPassword.length < 6}
              >
                {actionLoading ? 'resetting...' : 'reset password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





