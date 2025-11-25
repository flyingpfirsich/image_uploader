import { useState, useRef, useCallback, useEffect, type DragEvent } from 'react';
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
    loading: '[SYS] ПЕРЕВІРКА...', // Ukrainian: checking
    error: '[ERR] Невірний пароль / Falsches Passwort', // Ukrainian + German: wrong password
    serverError: '[ERR] Server nicht erreichbar', // German: server not reachable
  },
  // Upload
  upload: {
    title: 'DATEI HOCHLADEN', // German: upload file
    subtitle: 'Зображення та відео • Bilder und Videos', // Ukrainian + German: images and videos
    dropText: 'DATEIEN HIERHER ZIEHEN',  // German: drag files here
    dropHint: 'або натисніть для вибору', // Ukrainian: or click to select
    selected: 'Обрано:', // Ukrainian: selected
    submit: 'ÜBERTRAGEN', // German: transfer
    loading: '[SYS] ПЕРЕДАЧА...', // Ukrainian: transferring
    success: '[OK] Datei erfolgreich übertragen', // German: file successfully transferred
    error: '[ERR]', // Error prefix
  },
  // Camera capture
  camera: {
    subtitle: 'Фото або відео • Foto oder Video', // Ukrainian + German: photo or video
    photo: 'ФОТО',    // Ukrainian: photo
    video: 'ВІДЕО',   // Ukrainian: video
    start: 'START',
    stop: 'STOP',
    capture: 'ЗНЯТО', // Ukrainian: capture
    retake: 'ПОВТОР / NOCHMAL', // Ukrainian + German: retake
    use: 'VERWENDEN', // German: use
    recording: '[REC] ЗАПИС...', // Ukrainian: recording
    noCamera: '[ERR] Kamera nicht verfügbar', // German: camera not available
    permissionDenied: '[ERR] Доступ заборонено / Zugang verweigert', // Ukrainian + German: access denied
    switchCamera: 'SWAP', // Camera switch
    capturingSecond: '[SYS] Друге фото...', // Ukrainian: second photo
    front: 'FRONT',
    back: 'BACK',
  },
  // Mode selector
  mode: {
    upload: 'DATEI', // German: file
    capture: 'KAMERA', // German: camera
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
      '[CAM] BeReal-стиль: два фото', // Ukrainian: BeReal style: two photos
    ]
  }
};

// BeReal photo interface
interface BeRealPhoto {
  blob: Blob;
  url: string;
  facingMode: 'user' | 'environment';
}

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
  const [inputMode, setInputMode] = useState<'upload' | 'capture'>('upload');
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ blob: Blob; type: 'photo' | 'video'; url: string } | null>(null);
  
  // BeReal-style states
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [beRealPhotos, setBeRealPhotos] = useState<{ front: BeRealPhoto | null; back: BeRealPhoto | null }>({ front: null, back: null });
  const [isCapturingSecond, setIsCapturingSecond] = useState(false);
  const [mainPhotoPosition, setMainPhotoPosition] = useState<'front' | 'back'>('back'); // Which photo is shown as main
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Start camera stream (reduced resolution for smaller files)
  const startCamera = useCallback(async (overrideFacingMode?: 'user' | 'environment') => {
    try {
      const useFacingMode = overrideFacingMode || facingMode;
      const constraints: MediaStreamConstraints = {
        video: { facingMode: useFacingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: captureMode === 'video',
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setCameraActive(true);
      setStatus({ type: '', message: '' });
    } catch (error) {
      console.error('Camera error:', error);
      if ((error as Error).name === 'NotAllowedError') {
        setStatus({ type: 'error', message: TEXT.camera.permissionDenied });
      } else {
        setStatus({ type: 'error', message: TEXT.camera.noCamera });
      }
    }
  }, [captureMode, facingMode]);

  // Switch between front and back camera
  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Restart camera with new facing mode if camera is active
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Small delay to ensure previous stream is fully stopped
      setTimeout(() => {
        startCamera(newFacingMode);
      }, 100);
    }
  }, [facingMode, cameraActive, startCamera]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsRecording(false);
  }, []);

  // Capture single photo (helper)
  const captureCurrentFrame = useCallback((): Promise<BeRealPhoto | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) {
        resolve(null);
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve({ blob, url, facingMode });
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.8);
    });
  }, [facingMode]);

  // BeReal-style capture: takes photo with current camera, then switches and takes another
  const captureBeRealPhoto = useCallback(async () => {
    // Capture first photo
    const firstPhoto = await captureCurrentFrame();
    if (!firstPhoto) return;
    
    // Store first photo
    const isFirstFront = facingMode === 'user';
    if (isFirstFront) {
      setBeRealPhotos(prev => ({ ...prev, front: firstPhoto }));
    } else {
      setBeRealPhotos(prev => ({ ...prev, back: firstPhoto }));
    }
    
    // Stop current camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Switch to other camera for second photo
    setIsCapturingSecond(true);
    setStatus({ type: '', message: TEXT.camera.capturingSecond });
    
    const secondFacingMode = isFirstFront ? 'environment' : 'user';
    setFacingMode(secondFacingMode);
    
    // Small delay before starting second camera
    setTimeout(async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: { facingMode: secondFacingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          // Wait a moment for camera to stabilize then capture
          setTimeout(async () => {
            const secondPhoto = await captureCurrentFrame();
            if (secondPhoto) {
              if (secondFacingMode === 'user') {
                setBeRealPhotos(prev => ({ ...prev, front: { ...secondPhoto, facingMode: 'user' } }));
              } else {
                setBeRealPhotos(prev => ({ ...prev, back: { ...secondPhoto, facingMode: 'environment' } }));
              }
            }
            
            // Stop camera after capturing both
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            setCameraActive(false);
            setIsCapturingSecond(false);
            setStatus({ type: '', message: '' });
          }, 500);
        }
      } catch (error) {
        console.error('Error capturing second photo:', error);
        setIsCapturingSecond(false);
        setStatus({ type: 'error', message: TEXT.camera.noCamera });
      }
    }, 300);
  }, [captureCurrentFrame, facingMode]);

  // Swap main/overlay photos in BeReal view
  const swapBeRealPhotos = useCallback(() => {
    setMainPhotoPosition(prev => prev === 'front' ? 'back' : 'front');
  }, []);

  // Start video recording (lower quality for smaller files)
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    
    recordedChunksRef.current = [];
    
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : 'video/webm';
    
    // Lower bitrate for smaller file sizes (500 kbps video @ 480p)
    const mediaRecorder = new MediaRecorder(streamRef.current, { 
      mimeType,
      videoBitsPerSecond: 500000,  // 500 kbps
      audioBitsPerSecond: 32000,   // 32 kbps
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setCapturedMedia({ blob, type: 'video', url });
      stopCamera();
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setIsRecording(true);
  }, [stopCamera]);

  // Stop video recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Retake - discard captured media and restart camera
  const retake = useCallback(() => {
    if (capturedMedia) {
      URL.revokeObjectURL(capturedMedia.url);
      setCapturedMedia(null);
    }
    // Clear BeReal photos
    if (beRealPhotos.front) URL.revokeObjectURL(beRealPhotos.front.url);
    if (beRealPhotos.back) URL.revokeObjectURL(beRealPhotos.back.url);
    setBeRealPhotos({ front: null, back: null });
    setFacingMode('environment');
    startCamera('environment');
  }, [capturedMedia, beRealPhotos, startCamera]);

  // Use captured media - convert to File and set for upload
  const useCapturedMedia = useCallback(() => {
    if (!capturedMedia) return;
    
    const extension = capturedMedia.type === 'photo' ? 'jpg' : 'webm';
    const mimeType = capturedMedia.type === 'photo' ? 'image/jpeg' : 'video/webm';
    const fileName = `capture_${Date.now()}.${extension}`;
    
    const file = new File([capturedMedia.blob], fileName, { type: mimeType });
    setFile(file);
    
    URL.revokeObjectURL(capturedMedia.url);
    setCapturedMedia(null);
    setInputMode('upload'); // Switch to upload mode to show the file
  }, [capturedMedia]);

  // Use BeReal photos - combine into a single image
  const useBeRealPhotos = useCallback(async () => {
    if (!beRealPhotos.front || !beRealPhotos.back) return;
    
    // Create a canvas to composite both images
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Load both images
    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    };
    
    try {
      const mainPhoto = mainPhotoPosition === 'front' ? beRealPhotos.front : beRealPhotos.back;
      const overlayPhoto = mainPhotoPosition === 'front' ? beRealPhotos.back : beRealPhotos.front;
      
      const mainImg = await loadImage(mainPhoto.url);
      const overlayImg = await loadImage(overlayPhoto.url);
      
      // Set canvas to main image size
      canvas.width = mainImg.width;
      canvas.height = mainImg.height;
      
      // Draw main image
      ctx.drawImage(mainImg, 0, 0);
      
      // Draw overlay image (smaller, in corner with rounded corners)
      const overlayWidth = Math.round(mainImg.width * 0.28);
      const overlayHeight = Math.round((overlayImg.height / overlayImg.width) * overlayWidth);
      const padding = 16;
      const borderRadius = 12;
      const borderWidth = 3;
      
      const overlayX = padding;
      const overlayY = padding;
      
      // Draw border
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(overlayX - borderWidth, overlayY - borderWidth, overlayWidth + borderWidth * 2, overlayHeight + borderWidth * 2, borderRadius + borderWidth);
      ctx.fill();
      
      // Clip and draw overlay
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(overlayX, overlayY, overlayWidth, overlayHeight, borderRadius);
      ctx.clip();
      ctx.drawImage(overlayImg, overlayX, overlayY, overlayWidth, overlayHeight);
      ctx.restore();
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const fileName = `bereal_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          setFile(file);
          
          // Cleanup
          URL.revokeObjectURL(beRealPhotos.front!.url);
          URL.revokeObjectURL(beRealPhotos.back!.url);
          setBeRealPhotos({ front: null, back: null });
          setInputMode('upload');
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error compositing BeReal photos:', error);
    }
  }, [beRealPhotos, mainPhotoPosition]);

  // Cleanup on unmount or mode change
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedMedia) {
        URL.revokeObjectURL(capturedMedia.url);
      }
      if (beRealPhotos.front) URL.revokeObjectURL(beRealPhotos.front.url);
      if (beRealPhotos.back) URL.revokeObjectURL(beRealPhotos.back.url);
    };
  }, []);

  // Check if BeReal photos are complete
  const hasBeRealPhotos = beRealPhotos.front && beRealPhotos.back;

  // Stop camera when switching away from capture mode
  useEffect(() => {
    if (inputMode !== 'capture') {
      stopCamera();
    }
  }, [inputMode, stopCamera]);

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
              <ul className="status-list">
                <li className={`status-item status-item--${status.type}`}>{status.message}</li>
              </ul>
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
        <div className="header-left">
          <KaomojiLogo />
          {activeNav === 'upload' && (
            <nav className="nav nav--mode">
              <button 
                className={`nav-link ${inputMode === 'upload' ? 'active' : ''}`}
                onClick={() => setInputMode('upload')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                {TEXT.mode.upload}
              </button>
              <span className="nav-sep">/</span>
              <button 
                className={`nav-link ${inputMode === 'capture' ? 'active' : ''}`}
                onClick={() => setInputMode('capture')}
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
            {inputMode === 'upload' ? (
              <>
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
              </>
            ) : (
              <>
                <p className="upload-subtitle">{TEXT.camera.subtitle}</p>

                {/* Capture Mode Toggle (Photo/Video) */}
                <div className="capture-mode-toggle">
                  <button
                    className={`capture-mode-btn ${captureMode === 'photo' ? 'active' : ''}`}
                    onClick={() => { setCaptureMode('photo'); if (cameraActive) { stopCamera(); startCamera(); } }}
                    disabled={isRecording}
                  >
                    {TEXT.camera.photo}
                  </button>
                  <button
                    className={`capture-mode-btn ${captureMode === 'video' ? 'active' : ''}`}
                    onClick={() => { setCaptureMode('video'); if (cameraActive) { stopCamera(); startCamera(); } }}
                    disabled={isRecording}
                  >
                    {TEXT.camera.video}
                  </button>
                </div>

                {/* Camera Preview / Captured Media */}
                <div className="camera-container">
                  {captureMode === 'video' && capturedMedia ? (
                    <div className="captured-preview">
                      {capturedMedia.type === 'photo' ? (
                        <img src={capturedMedia.url} alt="Captured" className="captured-media" />
                      ) : (
                        <video src={capturedMedia.url} controls className="captured-media" />
                      )}
                    </div>
                  ) : hasBeRealPhotos ? (
                    /* BeReal-style dual photo preview */
                    <div className="bereal-preview" onClick={swapBeRealPhotos}>
                      {/* Main photo */}
                      <img 
                        src={mainPhotoPosition === 'front' ? beRealPhotos.front!.url : beRealPhotos.back!.url} 
                        alt="Main" 
                        className="bereal-main"
                      />
                      {/* Overlay photo (smaller, in corner) */}
                      <div className="bereal-overlay-container">
                        <img 
                          src={mainPhotoPosition === 'front' ? beRealPhotos.back!.url : beRealPhotos.front!.url} 
                          alt="Overlay" 
                          className="bereal-overlay"
                        />
                        <span className="bereal-swap-hint">TAP</span>
                      </div>
                    </div>
                  ) : (
                    <div className="video-wrapper">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`camera-feed ${cameraActive ? 'active' : ''} ${facingMode === 'user' ? 'mirrored' : ''}`}
                      />
                      {!cameraActive && !isCapturingSecond && (
                        <div className="camera-placeholder">
                          <span className="camera-icon">◎</span>
                          <p>{TEXT.camera.start}</p>
                        </div>
                      )}
                      {isCapturingSecond && (
                        <div className="capturing-second-indicator">
                          <span className="capturing-spinner" />
                          {TEXT.camera.capturingSecond}
                        </div>
                      )}
                      {isRecording && (
                        <div className="recording-indicator">
                          <span className="rec-dot" />
                          {TEXT.camera.recording}
                        </div>
                      )}
                      {/* Camera switch button */}
                      {cameraActive && !isRecording && !isCapturingSecond && captureMode === 'photo' && (
                        <button 
                          className="camera-switch-btn" 
                          onClick={(e) => { e.stopPropagation(); switchCamera(); }}
                          title="Switch Camera"
                        >
                          {TEXT.camera.switchCamera}
                        </button>
                      )}
                      {/* Facing mode indicator */}
                      {cameraActive && (
                        <div className="facing-indicator">
                          {facingMode === 'user' ? TEXT.camera.front : TEXT.camera.back}
                        </div>
                      )}
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>

                {/* Camera Controls */}
                <div className="camera-controls">
                  {captureMode === 'video' && capturedMedia ? (
                    <>
                      <button className="btn btn--secondary" onClick={retake}>
                        {TEXT.camera.retake}
                      </button>
                      <button className="btn" onClick={useCapturedMedia}>
                        {TEXT.camera.use}
                      </button>
                    </>
                  ) : hasBeRealPhotos ? (
                    <>
                      <button className="btn btn--secondary" onClick={retake}>
                        {TEXT.camera.retake}
                      </button>
                      <button className="btn" onClick={useBeRealPhotos}>
                        {TEXT.camera.use}
                      </button>
                    </>
                  ) : isCapturingSecond ? (
                    <button className="btn" disabled>
                      {TEXT.camera.capturingSecond}
                    </button>
                  ) : !cameraActive ? (
                    <button className="btn" onClick={() => startCamera()}>
                      {TEXT.camera.start}
                    </button>
                  ) : captureMode === 'photo' ? (
                    <button className="btn btn--capture" onClick={captureBeRealPhoto}>
                      {TEXT.camera.capture}
                    </button>
                  ) : !isRecording ? (
                    <button className="btn btn--record" onClick={startRecording}>
                      {TEXT.camera.start}
                    </button>
                  ) : (
                    <button className="btn btn--stop" onClick={stopRecording}>
                      {TEXT.camera.stop}
                    </button>
                  )}
                </div>
              </>
            )}

            {status.message && (
              <ul className="status-list">
                <li className={`status-item status-item--${status.type}`}>{status.message}</li>
              </ul>
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
