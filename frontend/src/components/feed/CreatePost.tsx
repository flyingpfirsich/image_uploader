import { useState, useRef, useCallback, useEffect } from 'react';
import * as api from '../../services/api';
import { TEXT } from '../../constants/text';
import { CameraPreview } from '../camera/CameraPreview';
import { useCamera } from '../../hooks/useCamera';
import { useBeRealCapture } from '../../hooks/useBeRealCapture';
import { useVideoRecording } from '../../hooks/useVideoRecording';
import { MusicPicker, MusicShare } from '../music';
import type { CapturedMedia, CaptureMode, Status, SpotifyTrack } from '../../types';

type PostMode = 'camera' | 'compose';

interface CreatePostProps {
  token: string;
  onPostCreated: () => void;
  onClose: () => void;
}

export function CreatePost({ token, onPostCreated, onClose }: CreatePostProps) {
  const [mode, setMode] = useState<PostMode>('compose');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);
  const [status, setStatus] = useState<Status>({ type: '', message: '' });

  // Post form state
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholder, setPlaceholder] = useState(TEXT.createPost.placeholders[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Music state
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);

  useEffect(() => {
    const randomPlaceholder =
      TEXT.createPost.placeholders[Math.floor(Math.random() * TEXT.createPost.placeholders.length)];
    setPlaceholder(randomPlaceholder);
  }, []);

  // Handle music selection
  const handleMusicSelect = useCallback((track: SpotifyTrack, mood?: string) => {
    setSelectedTrack(track);
    setSelectedMood(mood);
    setShowMusicPicker(false);
  }, []);

  const handleMusicRemove = useCallback(() => {
    setSelectedTrack(null);
    setSelectedMood(undefined);
  }, []);

  // Camera hooks
  const handleCameraError = useCallback((newStatus: Status) => {
    setStatus(newStatus);
  }, []);

  const {
    cameraActive,
    facingMode,
    setFacingMode,
    videoRef,
    streamRef,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera({ captureMode, onError: handleCameraError });

  const setCameraActive = useCallback(
    (active: boolean) => {
      if (!active) {
        stopCamera();
      }
    },
    [stopCamera]
  );

  const {
    beRealPhotos,
    isCapturingSecond,
    mainPhotoPosition,
    hasBeRealPhotos,
    canvasRef,
    captureBeRealPhoto,
    swapBeRealPhotos,
    compositeBeRealPhotos,
    clearBeRealPhotos,
  } = useBeRealCapture({
    videoRef,
    streamRef,
    facingMode,
    setFacingMode,
    setCameraActive,
    onStatusChange: setStatus,
  });

  const handleRecordingComplete = useCallback((media: CapturedMedia) => {
    setCapturedMedia(media);
  }, []);

  const { isRecording, startRecording, stopRecording } = useVideoRecording({
    streamRef,
    onRecordingComplete: handleRecordingComplete,
    onStopCamera: stopCamera,
  });

  // File upload handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));

    setFiles((prev) => [...prev, ...selectedFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    setMode('compose');
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Camera mode handlers
  const handleStartCamera = useCallback(() => {
    setMode('camera');
    startCamera();
  }, [startCamera]);

  const handleCaptureModeChange = useCallback(
    (newMode: CaptureMode) => {
      setCaptureMode(newMode);
      if (cameraActive) {
        stopCamera();
        startCamera(undefined, newMode);
      }
    },
    [cameraActive, stopCamera, startCamera]
  );

  const handleRetake = useCallback(() => {
    if (capturedMedia) {
      URL.revokeObjectURL(capturedMedia.url);
      setCapturedMedia(null);
    }
    clearBeRealPhotos();
    setFacingMode('environment');
    startCamera('environment');
  }, [capturedMedia, clearBeRealPhotos, setFacingMode, startCamera]);

  const handleUseBeRealPhotos = useCallback(async () => {
    const file = await compositeBeRealPhotos();
    if (file) {
      const preview = URL.createObjectURL(file);
      setFiles([file]);
      setPreviews([preview]);
      clearBeRealPhotos();
      setMode('compose');
    }
  }, [compositeBeRealPhotos, clearBeRealPhotos]);

  const handleUseCapturedMedia = useCallback(() => {
    if (!capturedMedia) return;

    const extension = capturedMedia.type === 'photo' ? 'jpg' : 'mp4';
    const mimeType = capturedMedia.type === 'photo' ? 'image/jpeg' : 'video/mp4';
    const fileName = `capture_${Date.now()}.${extension}`;

    const file = new File([capturedMedia.blob], fileName, { type: mimeType });
    const preview = URL.createObjectURL(file);

    setFiles([file]);
    setPreviews([preview]);

    URL.revokeObjectURL(capturedMedia.url);
    setCapturedMedia(null);
    setMode('compose');
  }, [capturedMedia]);

  const handleBackToSelect = useCallback(() => {
    stopCamera();
    clearBeRealPhotos();
    if (capturedMedia) {
      URL.revokeObjectURL(capturedMedia.url);
      setCapturedMedia(null);
    }
    setMode('compose');
  }, [stopCamera, clearBeRealPhotos, capturedMedia]);

  // Submit post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0 && !selectedTrack) {
      setError('Add some text, media, or music');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const post = await api.createPost(
        token,
        {
          text: text.trim() || undefined,
          location: location.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
          hasMusic: !!selectedTrack,
        },
        files.length > 0 ? files : undefined
      );

      // If a track was selected, create a music share linked to the post
      if (selectedTrack) {
        await api.createMusicShare(token, {
          postId: post.id,
          spotifyTrackId: selectedTrack.spotifyTrackId,
          trackName: selectedTrack.trackName,
          artistName: selectedTrack.artistName,
          albumName: selectedTrack.albumName,
          albumArtUrl: selectedTrack.albumArtUrl || undefined,
          previewUrl: selectedTrack.previewUrl || undefined,
          externalUrl: selectedTrack.externalUrl,
          moodKaomoji: selectedMood,
        });
      }

      previews.forEach((p) => URL.revokeObjectURL(p));

      onPostCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedMedia) {
        URL.revokeObjectURL(capturedMedia.url);
      }
      clearBeRealPhotos();
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="create-post-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <header className="create-post-header">
          <h2 className="section-title">
            {mode === 'camera' ? TEXT.createPost.captureTitle : TEXT.createPost.title}
          </h2>
          <button className="btn--text" onClick={onClose}>
            x
          </button>
        </header>

        {/* Mode: Camera */}
        {mode === 'camera' && (
          <div className="create-post-camera">
            {/* Capture Mode Toggle */}
            <div className="capture-mode-toggle">
              <button
                className={`capture-mode-btn ${captureMode === 'photo' ? 'active' : ''}`}
                onClick={() => handleCaptureModeChange('photo')}
                disabled={isRecording}
              >
                {TEXT.camera.photo}
              </button>
              <button
                className={`capture-mode-btn ${captureMode === 'video' ? 'active' : ''}`}
                onClick={() => handleCaptureModeChange('video')}
                disabled={isRecording}
              >
                {TEXT.camera.video}
              </button>
            </div>

            {/* Camera Preview */}
            <CameraPreview
              captureMode={captureMode}
              capturedMedia={capturedMedia}
              hasBeRealPhotos={hasBeRealPhotos}
              beRealPhotos={beRealPhotos}
              mainPhotoPosition={mainPhotoPosition}
              cameraActive={cameraActive}
              isCapturingSecond={isCapturingSecond}
              isRecording={isRecording}
              facingMode={facingMode}
              videoRef={videoRef}
              canvasRef={canvasRef}
              onSwapBeRealPhotos={swapBeRealPhotos}
              onSwitchCamera={switchCamera}
            />

            {/* Camera Controls */}
            <div className="camera-controls">
              {/* Video captured */}
              {captureMode === 'video' && capturedMedia ? (
                <>
                  <button className="btn btn--secondary" onClick={handleRetake}>
                    {TEXT.camera.retake}
                  </button>
                  <button className="btn" onClick={handleUseCapturedMedia}>
                    {TEXT.camera.use}
                  </button>
                </>
              ) : hasBeRealPhotos ? (
                /* BeReal photos captured */
                <>
                  <button className="btn btn--secondary" onClick={handleRetake}>
                    {TEXT.camera.retake}
                  </button>
                  <button className="btn" onClick={handleUseBeRealPhotos}>
                    {TEXT.camera.use}
                  </button>
                </>
              ) : isCapturingSecond ? (
                /* Capturing second photo */
                <button className="btn" disabled>
                  {TEXT.camera.capturingSecond}
                </button>
              ) : !cameraActive ? (
                /* Camera not started */
                <button className="btn" onClick={() => startCamera()}>
                  {TEXT.camera.start}
                </button>
              ) : captureMode === 'photo' ? (
                /* Photo mode - capture button */
                <button className="btn btn--capture" onClick={captureBeRealPhoto}>
                  {TEXT.camera.capture}
                </button>
              ) : !isRecording ? (
                /* Video mode - start recording */
                <button className="btn btn--record" onClick={startRecording}>
                  {TEXT.camera.start}
                </button>
              ) : (
                /* Video mode - stop recording */
                <button className="btn btn--stop" onClick={stopRecording}>
                  {TEXT.camera.stop}
                </button>
              )}
            </div>

            <button className="btn--text camera-back-btn" onClick={handleBackToSelect}>
              {'<-'} Back
            </button>

            {status.message && (
              <p
                className={`camera-status ${status.type === 'error' ? 'camera-status--error' : ''}`}
              >
                {status.message}
              </p>
            )}
          </div>
        )}

        {/* Mode: Compose */}
        {mode === 'compose' && (
          <form onSubmit={handleSubmit}>
            {files.length === 0 ? (
              <div className="media-input-section">
                <button
                  type="button"
                  className="media-btn media-btn--primary"
                  onClick={handleStartCamera}
                >
                  <span className="media-btn-icon">[ ]</span>
                  <span className="media-btn-label">{TEXT.createPost.takePhoto}</span>
                </button>
              </div>
            ) : (
              <div className="create-post-previews">
                {previews.map((preview, index) => (
                  <div key={index} className="preview-item">
                    {files[index].type.startsWith('video/') ? (
                      <video src={preview} className="preview-media" />
                    ) : (
                      <img src={preview} alt="" className="preview-media" />
                    )}
                    <button
                      type="button"
                      className="preview-remove"
                      onClick={() => removeFile(index)}
                    >
                      x
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="preview-add-more"
                  onClick={() => fileInputRef.current?.click()}
                >
                  +
                </button>
              </div>
            )}

            <div className="form-row">
              <textarea
                className="form-input form-textarea"
                placeholder={placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                autoFocus
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Selected Music Preview */}
            {selectedTrack && (
              <div className="create-post-music">
                <MusicShare
                  track={selectedTrack}
                  mood={selectedMood}
                  compact
                  showRemove
                  onRemove={handleMusicRemove}
                />
              </div>
            )}

            <div className="create-post-actions">
              <input
                type="text"
                className="form-input form-input--small"
                placeholder="@ Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <input
                type="url"
                className="form-input form-input--small"
                placeholder="~> Link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />

              <button
                type="button"
                className="media-btn media-btn--secondary media-btn--music"
                onClick={() => setShowMusicPicker(true)}
                title="Add music"
              >
                <span className="media-btn-icon">{'>>'}</span>
              </button>

              <button
                type="button"
                className="media-btn media-btn--secondary media-btn--upload"
                onClick={() => fileInputRef.current?.click()}
                title="Upload from device"
              >
                <span className="media-btn-icon">^</span>
              </button>
            </div>

            {error && (
              <ul className="status-list">
                <li className="status-item status-item--error">{error}</li>
              </ul>
            )}

            <div className="create-post-submit">
              <button type="submit" className="btn" disabled={isLoading}>
                {isLoading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        )}

        {/* Music Picker Modal */}
        {showMusicPicker && (
          <MusicPicker
            token={token}
            onSelect={handleMusicSelect}
            onClose={() => setShowMusicPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
