import { useRef, useState, useEffect, useCallback } from 'react';
import { TEXT } from '../../constants/text';
import { CameraPreview } from '../camera/CameraPreview';
import { MusicShare } from '../music';
import * as api from '../../services/api';
import type {
  CapturedMedia,
  CaptureMode,
  MainPhotoPosition,
  FacingMode,
  SpotifyTrack,
} from '../../types';

function getRandomPlaceholder() {
  return TEXT.createPost.placeholders[
    Math.floor(Math.random() * TEXT.createPost.placeholders.length)
  ];
}

const VIEWFINDER_MAX_HEIGHT = 300;
const VIEWFINDER_SNAP_THRESHOLD = 0.6;

interface CreatePostUnifiedProps {
  token: string;
  // Camera state
  captureMode: CaptureMode;
  capturedMedia: CapturedMedia | null;
  hasBeRealPhotos: boolean;
  beRealPhotos: { front: { url: string } | null; back: { url: string } | null };
  mainPhotoPosition: MainPhotoPosition;
  cameraActive: boolean;
  isCapturingSecond: boolean;
  isRecording: boolean;
  facingMode: FacingMode;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  // Form state
  text: string;
  location: string;
  files: File[];
  previews: string[];
  isLoading: boolean;
  error: string;
  selectedTrack: SpotifyTrack | null;
  selectedMood: string | undefined;
  // Camera handlers
  onCaptureModeChange: (mode: CaptureMode) => void;
  onSwapBeRealPhotos: () => void;
  onSwitchCamera: () => void;
  onUseCapturedMedia: () => void;
  onCaptureBeRealPhoto: () => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  // Form handlers
  onTextChange: (text: string) => void;
  onLocationChange: (location: string) => void;
  onFilesChange: (files: File[], previews: string[]) => void;
  onRemoveFile: (index: number) => void;
  onMusicSelect: (track: SpotifyTrack, mood?: string) => void;
  onMusicRemove: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreatePostUnified({
  token,
  captureMode,
  capturedMedia,
  hasBeRealPhotos,
  beRealPhotos,
  mainPhotoPosition,
  cameraActive,
  isCapturingSecond,
  isRecording,
  facingMode,
  videoRef,
  canvasRef,
  text,
  location,
  files,
  previews,
  isLoading,
  error,
  selectedTrack,
  selectedMood,
  onCaptureModeChange,
  onSwapBeRealPhotos,
  onSwitchCamera,
  onUseCapturedMedia,
  onCaptureBeRealPhoto,
  onStartCamera,
  onStopCamera,
  onStartRecording,
  onStopRecording,
  onTextChange,
  onLocationChange,
  onFilesChange,
  onRemoveFile,
  onMusicSelect,
  onMusicRemove,
  onSubmit,
}: CreatePostUnifiedProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [placeholder] = useState(getRandomPlaceholder);

  // Inline music search state
  const [musicQuery, setMusicQuery] = useState('');
  const [musicResults, setMusicResults] = useState<SpotifyTrack[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [musicError, setMusicError] = useState('');

  // Viewfinder collapse state
  const [viewfinderHeight, setViewfinderHeight] = useState(VIEWFINDER_MAX_HEIGHT);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const touchStartHeight = useRef(VIEWFINDER_MAX_HEIGHT);

  const handleSwipeStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartHeight.current = viewfinderHeight;
      setIsDragging(true);
    },
    [viewfinderHeight]
  );

  const handleSwipeMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      const deltaY = touchStartY.current - e.touches[0].clientY;
      const newHeight = Math.max(
        0,
        Math.min(VIEWFINDER_MAX_HEIGHT, touchStartHeight.current - deltaY)
      );
      setViewfinderHeight(newHeight);
    },
    [isDragging]
  );

  const handleSwipeEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = VIEWFINDER_MAX_HEIGHT * VIEWFINDER_SNAP_THRESHOLD;

    if (viewfinderHeight < threshold) {
      // Snap to collapsed
      setViewfinderHeight(0);
      setIsCollapsed(true);
      onStopCamera();
    } else {
      // Snap to expanded
      setViewfinderHeight(VIEWFINDER_MAX_HEIGHT);
      setIsCollapsed(false);
      if (!cameraActive && files.length === 0 && !hasBeRealPhotos) {
        onStartCamera();
      }
    }
  }, [
    isDragging,
    viewfinderHeight,
    cameraActive,
    files.length,
    hasBeRealPhotos,
    onStopCamera,
    onStartCamera,
  ]);

  const expandViewfinder = useCallback(() => {
    setViewfinderHeight(VIEWFINDER_MAX_HEIGHT);
    setIsCollapsed(false);
    if (!cameraActive && files.length === 0 && !hasBeRealPhotos) {
      onStartCamera();
    }
  }, [cameraActive, files.length, hasBeRealPhotos, onStartCamera]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    onFilesChange([...files, ...selectedFiles], [...previews, ...newPreviews]);
  };

  // Music search with debounce
  useEffect(() => {
    if (!musicQuery.trim() || musicQuery.length < 2) {
      setMusicResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMusic(true);
      setMusicError('');

      try {
        const { tracks } = await api.searchMusic(token, musicQuery);
        setMusicResults(tracks);
      } catch (err) {
        setMusicError(err instanceof Error ? err.message : 'Search failed');
        setMusicResults([]);
      } finally {
        setIsSearchingMusic(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [musicQuery, token]);

  const handleTrackSelect = useCallback(
    (track: SpotifyTrack) => {
      onMusicSelect(track, undefined);
      setMusicResults([]);
      setMusicQuery('');
    },
    [onMusicSelect]
  );

  // Determine what to show in the viewfinder area
  const hasMedia = files.length > 0;

  // Auto-collapse viewfinder when focusing text inputs (only if no media)
  const collapseViewfinder = useCallback(() => {
    if (!isCollapsed && !hasMedia && !hasBeRealPhotos) {
      setViewfinderHeight(0);
      setIsCollapsed(true);
      onStopCamera();
    }
  }, [isCollapsed, hasMedia, hasBeRealPhotos, onStopCamera]);

  // Auto-use video when captured
  useEffect(() => {
    if (captureMode === 'video' && capturedMedia) {
      onUseCapturedMedia();
    }
  }, [captureMode, capturedMedia, onUseCapturedMedia]);

  return (
    <>
      <form ref={formRef} className="create-post-unified" onSubmit={onSubmit}>
        {/* Viewfinder / Media Preview Area */}
        <div
          className={`unified-viewfinder ${isDragging ? 'dragging' : ''} ${isCollapsed ? 'collapsed' : ''}`}
          style={{
            height: viewfinderHeight,
            minHeight: isCollapsed ? 0 : undefined,
            transition: isDragging ? 'none' : 'height 0.25s ease-out',
          }}
        >
          {hasMedia ? (
            // Show captured/uploaded media with X to remove
            <div className="unified-media-preview">
              {previews.map((preview, index) => (
                <div key={index} className="unified-preview-item">
                  {files[index].type.startsWith('video/') ? (
                    <video src={preview} controls className="unified-preview-media" />
                  ) : (
                    <img src={preview} alt="" className="unified-preview-media" />
                  )}
                  <button
                    type="button"
                    className="unified-preview-remove"
                    onClick={() => onRemoveFile(index)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          ) : hasBeRealPhotos ? (
            // Show BeReal preview with tap to swap
            <div className="unified-bereal-preview" onClick={onSwapBeRealPhotos}>
              {(() => {
                const mainPhoto =
                  mainPhotoPosition === 'front' ? beRealPhotos.front : beRealPhotos.back;
                const overlayPhoto =
                  mainPhotoPosition === 'front' ? beRealPhotos.back : beRealPhotos.front;
                return (
                  <>
                    {mainPhoto && (
                      <img src={mainPhoto.url} alt="" className="unified-bereal-main" />
                    )}
                    {overlayPhoto && (
                      <div className="unified-bereal-overlay">
                        <img src={overlayPhoto.url} alt="" />
                      </div>
                    )}
                  </>
                );
              })()}
              <button
                type="button"
                className="unified-preview-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartCamera();
                }}
              >
                x
              </button>
            </div>
          ) : (
            // Show camera
            <>
              <CameraPreview
                captureMode={captureMode}
                capturedMedia={null}
                hasBeRealPhotos={false}
                beRealPhotos={{ front: null, back: null }}
                mainPhotoPosition={mainPhotoPosition}
                cameraActive={cameraActive}
                isCapturingSecond={isCapturingSecond}
                isRecording={isRecording}
                facingMode={facingMode}
                videoRef={videoRef}
                canvasRef={canvasRef}
                onSwapBeRealPhotos={onSwapBeRealPhotos}
                onSwitchCamera={onSwitchCamera}
              />

              {/* Camera Controls Overlay */}
              <div className="unified-camera-controls">
                {isCapturingSecond ? (
                  <span className="unified-cam-status">{TEXT.camera.capturingSecond}</span>
                ) : !cameraActive ? (
                  <button type="button" className="btn" onClick={onStartCamera}>
                    {TEXT.camera.start}
                  </button>
                ) : captureMode === 'photo' ? (
                  <button type="button" className="btn btn--capture" onClick={onCaptureBeRealPhoto}>
                    {TEXT.camera.capture}
                  </button>
                ) : !isRecording ? (
                  <button type="button" className="btn btn--record" onClick={onStartRecording}>
                    {TEXT.camera.start}
                  </button>
                ) : (
                  <button type="button" className="btn btn--stop" onClick={onStopRecording}>
                    {TEXT.camera.stop}
                  </button>
                )}
              </div>

              {/* Mode toggle - hide during recording */}
              {!isCapturingSecond && !isRecording && (
                <div className="unified-mode-toggle">
                  <button
                    type="button"
                    className={`unified-mode-btn ${captureMode === 'photo' ? 'active' : ''}`}
                    onClick={() => onCaptureModeChange('photo')}
                  >
                    {TEXT.camera.photo}
                  </button>
                  <button
                    type="button"
                    className={`unified-mode-btn ${captureMode === 'video' ? 'active' : ''}`}
                    onClick={() => onCaptureModeChange('video')}
                  >
                    {TEXT.camera.video}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Swipe indicator / expand button */}
        <div
          className={`unified-swipe-indicator ${isCollapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''}`}
          onClick={isCollapsed ? expandViewfinder : undefined}
          onTouchStart={handleSwipeStart}
          onTouchMove={handleSwipeMove}
          onTouchEnd={handleSwipeEnd}
        >
          <div className="swipe-handle" />
          {isCollapsed && <span className="swipe-hint">tap to open camera</span>}
        </div>

        {/* Form Area */}
        <div className="unified-form">
          <textarea
            className="unified-textarea"
            placeholder={placeholder}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onFocus={collapseViewfinder}
            rows={2}
          />

          {/* Selected Music Preview */}
          {selectedTrack && (
            <div className="unified-music">
              <MusicShare
                track={selectedTrack}
                mood={selectedMood}
                compact
                showRemove
                onRemove={onMusicRemove}
              />
            </div>
          )}

          {/* Location Input */}
          <input
            type="text"
            className="unified-input"
            placeholder="@ location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            onFocus={collapseViewfinder}
          />

          {/* Inline Music Search */}
          {!selectedTrack && (
            <div className="unified-music-section">
              <input
                type="text"
                className="unified-input"
                placeholder=">> search for a song"
                value={musicQuery}
                onChange={(e) => setMusicQuery(e.target.value)}
                onFocus={collapseViewfinder}
              />

              {/* Search results */}
              {musicResults.length > 0 && (
                <div className="unified-music-results">
                  {musicResults.slice(0, 4).map((track) => (
                    <button
                      key={track.spotifyTrackId}
                      type="button"
                      className="unified-music-result"
                      onClick={() => handleTrackSelect(track)}
                    >
                      {track.albumArtUrl && (
                        <img src={track.albumArtUrl} alt="" className="unified-music-result-art" />
                      )}
                      <div className="unified-music-result-info">
                        <p className="unified-music-result-name">{track.trackName}</p>
                        <p className="unified-music-result-artist">{track.artistName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Loading/error states */}
              {isSearchingMusic && <p className="unified-music-status">Searching...</p>}
              {musicError && (
                <p className="unified-music-status unified-music-status--error">{musicError}</p>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {error && <p className="unified-error">{error}</p>}

          <div className="unified-submit-row">
            <button
              type="button"
              className="unified-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload from gallery"
            >
              ^
            </button>
            <button type="submit" className="btn unified-post-btn" disabled={isLoading}>
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
