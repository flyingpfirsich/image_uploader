import { useState } from 'react';
import { KaomojiLogo } from './KaomojiLogo';
import { HeaderMenu } from './HeaderMenu';
import type { NavMode } from '../../types';

interface HeaderProps {
  token: string;
  onNavChange: (nav: NavMode) => void;
  onLogout: () => void;
}

export function Header({ token, onNavChange, onLogout }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <header className="header">
        <KaomojiLogo onClick={() => onNavChange('feed')} />
        <button
          className="header-menu-btn"
          onClick={() => setShowMenu(true)}
          aria-label="Open menu"
        >
          [=]
        </button>
      </header>

      {showMenu && (
        <HeaderMenu token={token} onLogout={onLogout} onClose={() => setShowMenu(false)} />
      )}
    </>
  );
}
