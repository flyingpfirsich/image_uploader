import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { KaomojiLogo } from '../layout/KaomojiLogo';

export function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [birthday, setBirthday] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password, displayName, inviteCode, birthday || undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="container">
      <header className="header">
        <KaomojiLogo />
        <nav className="nav">
          <button
            className={`nav-link ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            LOGIN
          </button>
          <span className="nav-sep">/</span>
          <button
            className={`nav-link ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            REGISTER
          </button>
        </nav>
      </header>

      <main className="main">
        <div className="login-container">
          <h1 className="login-title">{mode === 'login' ? 'Welcome Back' : 'Join Your Friends'}</h1>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="form-row">
                  <label className="form-label">Invite Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="XXXXXXXX"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row">
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="How friends see you"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-row">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                autoFocus={mode === 'login'}
              />
            </div>

            <div className="form-row">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {mode === 'register' && (
              <div className="form-row">
                <label className="form-label">Birthday (optional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>
            )}

            {error && (
              <ul className="status-list">
                <li className="status-item status-item--error">{error}</li>
              </ul>
            )}

            <button type="submit" className="btn" disabled={isLoading}>
              {isLoading ? 'Loading...' : mode === 'login' ? 'Enter' : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--fg-dim)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              className="btn--text"
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                color: 'var(--fg)',
              }}
            >
              {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </main>

      <footer className="footer">
        <span>druzi v1.0</span>
        <span>друзі = friends</span>
      </footer>
    </div>
  );
}
