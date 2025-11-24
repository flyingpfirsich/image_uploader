import { useState, useRef, DragEvent } from 'react';
import './App.css';

const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

// Mixed Ukrainian/German terminology
const TEXT = {
  // Navigation
  nav: {
    upload: 'ЗАВАНТАЖИТИ', // Ukrainian: upload
    hilfe: 'HILFE',        // German: help
  },
  // Login
  login: {
    title: 'ZUGANG ОБМЕЖЕНО', // German: access + Ukrainian: restricted
    passwordLabel: 'ПАРОЛЬ / PASSWORT',
    placeholder: 'введіть код...', // Ukrainian: enter code
    submit: 'УВІЙТИ',      // Ukrainian: enter
    loading: 'ПЕРЕВІРКА...', // Ukrainian: checking
    error: 'ПОМИЛКА: Невірний пароль', // Ukrainian: error, wrong password
    serverError: 'FEHLER: Server nicht erreichbar', // German: error, server not reachable
  },
  // Upload
  upload: {
    title: 'DATEI HOCHLADEN', // German: upload file
    subtitle: 'Зображення та відео • Bilder und Videos', // Ukrainian + German: images and videos
    dropText: 'DATEIEN HIERHER ZIEHEN',  // German: drag files here
    dropHint: 'або натисніть для вибору', // Ukrainian: or click to select
    selected: 'Обрано:', // Ukrainian: selected
    submit: 'ÜBERTRAGEN', // German: transfer
    loading: 'ПЕРЕДАЧА...', // Ukrainian: transferring
    success: 'ERFOLG: Datei übertragen', // German: success, file transferred
    error: 'ПОМИЛКА', // Ukrainian: error
  },
  // Footer
  footer: {
    session: 'СЕСІЯ АКТИВНА', // Ukrainian: session active
    logout: 'ВИЙТИ / ABMELDEN', // Ukrainian + German: logout
  },
  // Help/Info (shown when clicking HILFE)
  hilfe: {
    title: 'СИСТЕМНА ІНФОРМАЦІЯ', // Ukrainian: system information
    items: [
      '[SYS] Максимальний розмір: 50MB', // Ukrainian: max size
      '[SYS] Формати: JPEG, PNG, GIF, WEBP, MP4',
      '[NET] Übertragung verschlüsselt', // German: transfer encrypted
      '[NET] Зберігання: приватний сервер', // Ukrainian: storage: private server
    ]
  }
};

// Kaomoji logo component
const KaomojiLogo = () => (
  <span className="logo-kaomoji">ʕ•ᴥ•ʔ</span>
);

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeNav, setActiveNav] = useState<'upload' | 'hilfe'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToken(password);
        localStorage.setItem('auth_token', password);
        setStatus({ type: '', message: '' });
      } else {
        setStatus({ type: 'error', message: TEXT.login.error });
      }
    } catch {
      setStatus({ type: 'error', message: TEXT.login.serverError });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setIsLoading(true);
    setStatus({ type: '', message: TEXT.upload.loading });

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', message: TEXT.upload.success });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setStatus({ type: 'error', message: `${TEXT.upload.error}: ${data.error || 'Upload failed'}` });
      }
    } catch {
      setStatus({ type: 'error', message: `${TEXT.upload.error}: Verbindungsfehler` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('auth_token');
    setStatus({ type: '', message: '' });
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>, entering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(entering);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Login Screen
  if (!token) {
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
            
            <form onSubmit={handleLogin}>
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

            {status.message && (
              <div className={`status status--${status.type}`}>
                {status.message}
              </div>
            )}
          </div>
        </main>

        <footer className="footer">
          <span>v1.0.0</span>
          <span>© 2025</span>
        </footer>
      </div>
    );
  }

  // Main Upload Screen
  return (
    <div className="container">
      <header className="header">
        <KaomojiLogo />
        <nav className="nav">
          <button 
            className={`nav-link ${activeNav === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveNav('upload')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
          >
            {TEXT.nav.upload}
          </button>
          <span className="nav-sep">/</span>
          <button 
            className={`nav-link ${activeNav === 'hilfe' ? 'active' : ''}`}
            onClick={() => setActiveNav('hilfe')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
          >
            {TEXT.nav.hilfe}
          </button>
        </nav>
      </header>

      <main className="main">
        {activeNav === 'upload' ? (
          <div className="upload-container">
            <h1 className="upload-title">{TEXT.upload.title}</h1>
            <p className="upload-subtitle">{TEXT.upload.subtitle}</p>

            <form onSubmit={handleUpload}>
              <div
                className={`drop-zone ${isDragging ? 'active' : ''}`}
                onDragEnter={(e) => handleDrag(e, true)}
                onDragLeave={(e) => handleDrag(e, false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={handleFileClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  style={{ display: 'none' }}
                />
                {file ? (
                  <span className="file-selected">{TEXT.upload.selected} {file.name}</span>
                ) : (
                  <>
                    <p className="drop-zone-text">{TEXT.upload.dropText}</p>
                    <p className="drop-zone-hint">{TEXT.upload.dropHint}</p>
                  </>
                )}
              </div>

              <button type="submit" className="btn" disabled={!file || isLoading}>
                {isLoading ? TEXT.upload.loading : TEXT.upload.submit}
              </button>
            </form>

            {status.message && (
              <div className={`status status--${status.type}`}>
                {status.message}
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="section-title">{TEXT.hilfe.title}</p>
            <ul className="info-list">
              {TEXT.hilfe.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <footer className="footer">
        <span>{TEXT.footer.session}</span>
        <button className="btn btn--text" onClick={handleLogout}>
          {TEXT.footer.logout}
        </button>
      </footer>
    </div>
  );
}

export default App;
