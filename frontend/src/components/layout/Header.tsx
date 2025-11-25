import { KaomojiLogo } from './KaomojiLogo';
import type { NavMode } from '../../types';

interface HeaderProps {
  activeNav: NavMode;
  onNavChange: (nav: NavMode) => void;
}

export function Header({ activeNav, onNavChange }: HeaderProps) {
  return (
    <header className="header">
      <KaomojiLogo />
      <nav className="nav">
        <button
          className={`nav-link ${activeNav === 'feed' ? 'active' : ''}`}
          onClick={() => onNavChange('feed')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          FEED
        </button>
        <span className="nav-sep">/</span>
        <button
          className={`nav-link ${activeNav === 'friends' ? 'active' : ''}`}
          onClick={() => onNavChange('friends')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          FRIENDS
        </button>
        <span className="nav-sep">/</span>
        <button
          className={`nav-link ${activeNav === 'profile' ? 'active' : ''}`}
          onClick={() => onNavChange('profile')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          PROFILE
        </button>
      </nav>
    </header>
  );
}
