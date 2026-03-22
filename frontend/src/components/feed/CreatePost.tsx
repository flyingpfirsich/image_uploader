import { useState, useCallback, useEffect } from 'react';
import * as api from '../../services/api';
import { TEXT } from '../../constants/text';
import { useCamera } from '../../hooks/useCamera';
import { useBeRealCapture } from '../../hooks/useBeRealCapture';
import { useVideoRecording } from '../../hooks/useVideoRecording';
import { CreatePostCamera } from './CreatePostCamera';
import { CreatePostCompose } from './CreatePostCompose';
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

  // Music state
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);

  // Handle music selection
  const handleMusicSelect = useCallback((track: SpotifyTrack, mood?: string) => {
    setSelectedTrack(track);
    setSelectedMood(mood);
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

  // File handling
  const handleFilesChange = useCallback((newFiles: File[], newPreviews: string[]) => {
    setFiles(newFiles);
    setPreviews(newPreviews);
  }, []);

  const removeFile = useCallback(
    (index: number) => {
      URL.revokeObjectURL(previews[index]);
      setFiles((prev) => prev.filter((_, i) => i !== index));
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [previews]
  );

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

  const handleBackToCompose = useCallback(() => {
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

        {mode === 'camera' && (
          <CreatePostCamera
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
            status={status}
            onCaptureModeChange={handleCaptureModeChange}
            onSwapBeRealPhotos={swapBeRealPhotos}
            onSwitchCamera={switchCamera}
            onRetake={handleRetake}
            onUseBeRealPhotos={handleUseBeRealPhotos}
            onUseCapturedMedia={handleUseCapturedMedia}
            onCaptureBeRealPhoto={captureBeRealPhoto}
            onStartCamera={() => startCamera()}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onBack={handleBackToCompose}
          />
        )}

        {mode === 'compose' && (
          <CreatePostCompose
            token={token}
            text={text}
            location={location}
            linkUrl={linkUrl}
            files={files}
            previews={previews}
            isLoading={isLoading}
            error={error}
            selectedTrack={selectedTrack}
            selectedMood={selectedMood}
            onTextChange={setText}
            onLocationChange={setLocation}
            onLinkUrlChange={setLinkUrl}
            onFilesChange={handleFilesChange}
            onRemoveFile={removeFile}
            onMusicSelect={handleMusicSelect}
            onMusicRemove={handleMusicRemove}
            onStartCamera={handleStartCamera}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
