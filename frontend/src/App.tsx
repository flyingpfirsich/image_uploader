import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        setToken(password); // Storing password as token for simplicity as per requirements
        localStorage.setItem('auth_token', password);
        setStatus('');
      } else {
        setStatus('Invalid password');
      }
    } catch (err) {
      setStatus('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setIsLoading(true);
    setStatus('Uploading & Transferring...');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('Success: ' + data.message);
        setFile(null);
        // Reset file input if possible, or just rely on state
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setStatus('Error: ' + (data.error || 'Upload failed'));
      }
    } catch (err) {
      setStatus('Error: Could not upload file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('auth_token');
    setStatus('');
  };

  if (!token) {
    return (
      <div>
        <h1>// ACCESS RESTRICTED</h1>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            placeholder="ENTER PASSWORD" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? '...' : 'AUTHENTICATE'}
          </button>
        </form>
        {status && <div className="status">{status}</div>}
      </div>
    );
  }

  return (
    <div>
      <h1>// UPLOAD TERMINAL</h1>
      <form onSubmit={handleUpload}>
        <input 
          id="file-upload"
          type="file" 
          accept="image/*,video/*" 
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
        />
        <button type="submit" disabled={!file || isLoading}>
          {isLoading ? 'TRANSMITTING...' : 'INITIATE UPLOAD'}
        </button>
      </form>

      {status && <div className="status">{status}</div>}

      <div style={{ marginTop: '50px', borderTop: '1px solid #333', paddingTop: '10px' }}>
        <button onClick={handleLogout} style={{ width: 'auto', background: 'transparent', border: 'none', textDecoration: 'underline', padding: 0 }}>
          TERMINATE SESSION
        </button>
      </div>
    </div>
  );
}

export default App;
