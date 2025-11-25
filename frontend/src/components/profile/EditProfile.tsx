import { useState, useRef } from 'react';
import type { User } from '../../types';
import * as api from '../../services/api';
import { getAvatarUrl } from '../../services/api';

interface EditProfileProps {
  user: User;
  token: string;
  onSave: (user: User) => void;
  onClose: () => void;
}

export function EditProfile({ user, token, onSave, onClose }: EditProfileProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { user: updatedUser } = await api.updateProfile(
        token,
        {
          displayName: displayName.trim(),
          birthday: birthday || undefined,
        },
        avatarFile || undefined
      );

      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }

      onSave(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const currentAvatar = avatarPreview || getAvatarUrl(user.avatar);

  return (
    <div className="edit-profile-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <header className="edit-profile-header">
          <h2 className="section-title">Edit Profile</h2>
          <button className="btn--text" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="edit-avatar-section">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="edit-avatar-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt="" className="edit-avatar-preview" />
              ) : (
                <div className="edit-avatar-placeholder">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="edit-avatar-overlay">Change</span>
            </button>
          </div>

          <div className="form-row">
            <label className="form-label">Display Name</label>
            <input
              type="text"
              className="form-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">Birthday</label>
            <input
              type="date"
              className="form-input"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          {error && (
            <ul className="status-list">
              <li className="status-item status-item--error">{error}</li>
            </ul>
          )}

          <div className="edit-profile-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

