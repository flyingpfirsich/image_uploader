import { useState } from 'react';
import { TEXT } from '../../constants/text';
import { KaomojiLogo } from '../layout/KaomojiLogo';
import { StatusMessage } from '../common/StatusMessage';
import type { Status } from '../../types';

interface LoginScreenProps {
  onLogin: (password: string) => Promise<boolean>;
  isLoading: boolean;
  status: Status;
}

export function LoginScreen({ onLogin, isLoading, status }: LoginScreenProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(password);
  };

  return (
    <div className="container">
      <header className="header">
        <KaomojiLogo />
        <nav className="nav">
          <span className="nav-link active">{TEXT.nav.upload}</span>
          <span className="nav-sep">/</span>
          <span className="nav-link">{TEXT.nav.hilfe}</span>
        </nav>
      </header>

      <main className="main">
        <div className="login-container">
          <h1 className="login-title">{TEXT.login.title}</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="form-label">{TEXT.login.passwordLabel}</label>
              <input
                type="password"
                className="form-input"
                placeholder={TEXT.login.placeholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            
            <button type="submit" className="btn" disabled={isLoading || !password}>
              {isLoading ? TEXT.login.loading : TEXT.login.submit}
            </button>
          </form>

          <StatusMessage status={status} />
        </div>
      </main>

      <footer className="footer">
        <span>v1.0.0</span>
        <span>© 2025</span>
      </footer>
    </div>
  );
}

