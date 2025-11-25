import { useState, useCallback } from 'react';
import './App.css';

// Hooks
import { useAuth } from './hooks/useAuth';

// Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LoginScreen } from './components/auth/LoginScreen';
import { UploadScreen } from './components/upload/UploadScreen';
import { CaptureScreen } from './components/camera/CaptureScreen';
import { HelpScreen } from './components/help/HelpScreen';

// Types
import type { NavMode, InputMode } from './types';

function App() {
  const { token, isLoading, status, login, logout } = useAuth();
  const [activeNav, setActiveNav] = useState<NavMode>('upload');
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  // Handle file from capture screen
  const handleFileFromCapture = useCallback((file: File) => {
    setCapturedFile(file);
  }, []);

  // Clear captured file after it's been used
  const clearCapturedFile = useCallback(() => {
    setCapturedFile(null);
  }, []);

  // Switch to upload mode
  const switchToUpload = useCallback(() => {
    setInputMode('upload');
  }, []);

  // Login Screen
  if (!token) {
    return (
      <LoginScreen 
        onLogin={login} 
        isLoading={isLoading} 
        status={status} 
      />
    );
  }

  // Main Upload Screen
  return (
    <div className="container">
      <Header 
        activeNav={activeNav}
        onNavChange={setActiveNav}
        inputMode={inputMode}
        onInputModeChange={setInputMode}
        showModeToggle={true}
      />

      <main className="main">
        {activeNav === 'upload' ? (
          <div className="upload-container">
            {inputMode === 'upload' ? (
              <UploadScreen 
                token={token}
                externalFile={capturedFile}
                onExternalFileUsed={clearCapturedFile}
              />
            ) : (
              <CaptureScreen 
                onFileReady={handleFileFromCapture}
                onSwitchToUpload={switchToUpload}
              />
            )}
          </div>
        ) : (
          <HelpScreen />
        )}
      </main>

      <Footer onLogout={logout} />
    </div>
  );
}

export default App;
