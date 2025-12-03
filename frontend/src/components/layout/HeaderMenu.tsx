import { useState } from 'react';
import { NotificationSettings } from '../settings/NotificationSettings';
import * as api from '../../services/api';

interface HeaderMenuProps {
  token: string;
  onLogout: () => void;
  onClose: () => void;
}

export function HeaderMenu({ token, onLogout, onClose }: HeaderMenuProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

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

  const handleCopyInvite = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
    }
  };

  return (
    <div className="header-menu-overlay" onClick={onClose}>
      <div className="header-menu" onClick={(e) => e.stopPropagation()}>
        <header className="header-menu-header">
          <h2 className="section-title">Menu</h2>
          <button className="btn--text" onClick={onClose} aria-label="Close menu">
            x
          </button>
        </header>

        <div className="header-menu-content">
          {/* Notifications Section */}
          <section className="header-menu-section">
            <NotificationSettings />
          </section>

          {/* Invite Section */}
          <section className="header-menu-section">
            <h3 className="header-menu-section-title">Invite a Friend</h3>
            {inviteCode ? (
              <div className="invite-code-display">
                <code className="invite-code">{inviteCode}</code>
                <button className="btn--text" onClick={handleCopyInvite}>
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

          {/* Logout Section */}
          <section className="header-menu-section header-menu-section--logout">
            <button className="btn btn--danger" onClick={onLogout}>
              Logout
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
