import { useState, useCallback, useEffect } from 'react';
import * as api from '../../services/api';
import { TEXT } from '../../constants/text';
import { useCamera } from '../../hooks/useCamera';
import { useBeRealCapture } from '../../hooks/useBeRealCapture';
import { useVideoRecording } from '../../hooks/useVideoRecording';
import { CreatePostUnified } from './CreatePostUnified';
import type { CapturedMedia, CaptureMode, SpotifyTrack } from '../../types';

interface CreatePostProps {
  token: string;
  onPostCreated: () => void;
  onClose: () => void;
}

export function CreatePost({ token, onPostCreated, onClose }: CreatePostProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);

  // Post form state
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
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
  const {
    cameraActive,
    facingMode,
    setFacingMode,
    videoRef,
    streamRef,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera({ captureMode });

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
      const newFiles = files.filter((_, i) => i !== index);
      const newPreviews = previews.filter((_, i) => i !== index);
      setFiles(newFiles);
      setPreviews(newPreviews);
      // Restart camera only when last file is removed
      if (newFiles.length === 0) {
        startCamera();
      }
    },
    [files, previews, startCamera]
  );

  // Auto-start camera when component mounts
  useEffect(() => {
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Camera mode handlers
  const handleStartCamera = useCallback(() => {
    // Clear existing files and captured media to show camera again
    previews.forEach((p) => URL.revokeObjectURL(p));
    setFiles([]);
    setPreviews([]);
    if (capturedMedia) {
      URL.revokeObjectURL(capturedMedia.url);
      setCapturedMedia(null);
    }
    clearBeRealPhotos();
    startCamera();
  }, [startCamera, previews, capturedMedia, clearBeRealPhotos]);

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

  const handleUseCapturedMedia = useCallback(() => {
    if (!capturedMedia) return;

    const extension = capturedMedia.type === 'photo' ? 'jpg' : 'mp4';
    const mimeType = capturedMedia.type === 'photo' ? 'image/jpeg' : 'video/mp4';
    const fileName = `capture_${Date.now()}.${extension}`;

    const file = new File([capturedMedia.blob], fileName, { type: mimeType });
    const preview = URL.createObjectURL(file);

    // Add to existing files instead of replacing
    setFiles((prev) => [...prev, file]);
    setPreviews((prev) => [...prev, preview]);

    URL.revokeObjectURL(capturedMedia.url);
    setCapturedMedia(null);
    stopCamera();
  }, [capturedMedia, stopCamera]);

  // Submit post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If BeReal photos exist, composite them first
    let filesToSubmit = files;
    if (hasBeRealPhotos && files.length === 0) {
      const composited = await compositeBeRealPhotos();
      if (composited) {
        filesToSubmit = [composited];
        clearBeRealPhotos();
      }
    }

    // Allow posting with just media (no text required)
    if (!text.trim() && filesToSubmit.length === 0 && !selectedTrack) {
      setError('Add a photo, text, or music');
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
          hasMusic: !!selectedTrack,
        },
        filesToSubmit.length > 0 ? filesToSubmit : undefined
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
          <h2 className="section-title">{TEXT.createPost.title}</h2>
          <button className="btn--text" onClick={onClose}>
            x
          </button>
        </header>

        <CreatePostUnified
          token={token}
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
          text={text}
          location={location}
          files={files}
          previews={previews}
          isLoading={isLoading}
          error={error}
          selectedTrack={selectedTrack}
          selectedMood={selectedMood}
          onCaptureModeChange={handleCaptureModeChange}
          onSwapBeRealPhotos={swapBeRealPhotos}
          onSwitchCamera={switchCamera}
          onUseCapturedMedia={handleUseCapturedMedia}
          onCaptureBeRealPhoto={captureBeRealPhoto}
          onStartCamera={handleStartCamera}
          onStopCamera={stopCamera}
          onClearBeRealPhotos={clearBeRealPhotos}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onTextChange={setText}
          onLocationChange={setLocation}
          onFilesChange={handleFilesChange}
          onRemoveFile={removeFile}
          onMusicSelect={handleMusicSelect}
          onMusicRemove={handleMusicRemove}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
