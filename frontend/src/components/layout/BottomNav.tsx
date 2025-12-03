import type { NavMode } from '../../types';

interface BottomNavProps {
  activeNav: NavMode;
  onNavChange: (nav: NavMode) => void;
  onCreatePost: () => void;
  isAdmin?: boolean;
}

export function BottomNav({ activeNav, onNavChange, onCreatePost, isAdmin }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav-item ${activeNav === 'feed' ? 'active' : ''}`}
        onClick={() => onNavChange('feed')}
        aria-label="Feed"
      >
        <span className="bottom-nav-icon">[ ]</span>
        <span className="bottom-nav-label">Feed</span>
      </button>

      <div className="bottom-nav-action">
        <button
          className="bottom-nav-action-btn"
          onClick={onCreatePost}
          aria-label="Create new post"
        >
          +
        </button>
      </div>

      <button
        className={`bottom-nav-item ${activeNav === 'profile' ? 'active' : ''}`}
        onClick={() => onNavChange('profile')}
        aria-label="Profile"
      >
        <span className="bottom-nav-icon">@</span>
        <span className="bottom-nav-label">Profile</span>
      </button>

      {isAdmin && (
        <button
          className={`bottom-nav-item bottom-nav-item--admin ${activeNav === 'admin' ? 'active' : ''}`}
          onClick={() => onNavChange('admin')}
          aria-label="Admin"
        >
          <span className="bottom-nav-icon">*</span>
          <span className="bottom-nav-label">Admin</span>
        </button>
      )}
    </nav>
  );
}
