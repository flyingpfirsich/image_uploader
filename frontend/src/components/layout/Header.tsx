import { TEXT } from '../../constants/text';
import { KaomojiLogo } from './KaomojiLogo';
import type { NavMode, InputMode } from '../../types';

interface HeaderProps {
  activeNav: NavMode;
  onNavChange: (nav: NavMode) => void;
  inputMode?: InputMode;
  onInputModeChange?: (mode: InputMode) => void;
  showModeToggle?: boolean;
}

export function Header({ 
  activeNav, 
  onNavChange, 
  inputMode = 'upload',
  onInputModeChange,
  showModeToggle = false,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <KaomojiLogo />
        {showModeToggle && activeNav === 'upload' && (
          <nav className="nav nav--mode">
            <button 
              className={`nav-link ${inputMode === 'upload' ? 'active' : ''}`}
              onClick={() => onInputModeChange?.('upload')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
            >
              {TEXT.mode.upload}
            </button>
            <span className="nav-sep">/</span>
            <button 
              className={`nav-link ${inputMode === 'capture' ? 'active' : ''}`}
              onClick={() => onInputModeChange?.('capture')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
            >
              {TEXT.mode.capture}
            </button>
          </nav>
        )}
      </div>
      <nav className="nav">
        <button 
          className={`nav-link ${activeNav === 'upload' ? 'active' : ''}`}
          onClick={() => onNavChange('upload')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          {TEXT.nav.upload}
        </button>
        <span className="nav-sep">/</span>
        <button 
          className={`nav-link ${activeNav === 'memories' ? 'active' : ''}`}
          onClick={() => onNavChange('memories')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          {TEXT.nav.memories}
        </button>
        <span className="nav-sep">/</span>
        <button 
          className={`nav-link ${activeNav === 'hilfe' ? 'active' : ''}`}
          onClick={() => onNavChange('hilfe')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          {TEXT.nav.hilfe}
        </button>
      </nav>
    </header>
  );
}

