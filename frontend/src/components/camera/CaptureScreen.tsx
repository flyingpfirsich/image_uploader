import { useState, useCallback, useEffect } from 'react';
import { TEXT } from '../../constants/text';
import { CameraPreview } from './CameraPreview';
import { CameraControls } from './CameraControls';
import { StatusMessage } from '../common/StatusMessage';
import { useCamera } from '../../hooks/useCamera';
import { useBeRealCapture } from '../../hooks/useBeRealCapture';
import { useVideoRecording } from '../../hooks/useVideoRecording';
import type { CapturedMedia, CaptureMode, Status } from '../../types';

interface CaptureScreenProps {
  onFileReady: (file: File) => void;
  onSwitchToUpload: () => void;
}

export function CaptureScreen({ onFileReady, onSwitchToUpload }: CaptureScreenProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);
  const [status, setStatus] = useState<Status>({ type: '', message: '' });

  const handleError = useCallback((newStatus: Status) => {
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
  } = useCamera({ captureMode, onError: handleError });

  // Create a wrapper to expose setCameraActive
  const setCameraActive = useCallback((active: boolean) => {
    if (!active) {
      stopCamera();
    }
  }, [stopCamera]);

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

  const {
    isRecording,
    startRecording,
    stopRecording,
  } = useVideoRecording({
    streamRef,
    onRecordingComplete: handleRecordingComplete,
    onStopCamera: stopCamera,
  });

  // Handle capture mode change
  const handleCaptureModeChange = useCallback((mode: CaptureMode) => {
    setCaptureMode(mode);
    if (cameraActive) {
      stopCamera();
      startCamera();
    }
  }, [cameraActive, stopCamera, startCamera]);

  // Retake - discard captured media and restart camera
  const retake = useCallback(() => {
    if (capturedMedia) {
      URL.revokeObjectURL(capturedMedia.url);
      setCapturedMedia(null);
    }
    clearBeRealPhotos();
    setFacingMode('environment');
    startCamera('environment');
  }, [capturedMedia, clearBeRealPhotos, setFacingMode, startCamera]);

  // Use captured video media
  const useCapturedMedia = useCallback(() => {
    if (!capturedMedia) return;
    
    const extension = capturedMedia.type === 'photo' ? 'jpg' : 'webm';
    const mimeType = capturedMedia.type === 'photo' ? 'image/jpeg' : 'video/webm';
    const fileName = `capture_${Date.now()}.${extension}`;
    
    const file = new File([capturedMedia.blob], fileName, { type: mimeType });
    onFileReady(file);
    
    URL.revokeObjectURL(capturedMedia.url);
    setCapturedMedia(null);
    onSwitchToUpload();
  }, [capturedMedia, onFileReady, onSwitchToUpload]);

  // Use BeReal photos
  const useBeRealPhotos = useCallback(async () => {
    const file = await compositeBeRealPhotos();
    if (file) {
      onFileReady(file);
      clearBeRealPhotos();
      onSwitchToUpload();
    }
  }, [compositeBeRealPhotos, onFileReady, clearBeRealPhotos, onSwitchToUpload]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedMedia) {
        URL.revokeObjectURL(capturedMedia.url);
      }
      clearBeRealPhotos();
    };
  }, []);

  return (
    <>
      <p className="upload-subtitle">{TEXT.camera.subtitle}</p>

      {/* Capture Mode Toggle (Photo/Video) */}
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
      <CameraControls
        captureMode={captureMode}
        capturedMedia={capturedMedia}
        hasBeRealPhotos={hasBeRealPhotos}
        isCapturingSecond={isCapturingSecond}
        cameraActive={cameraActive}
        isRecording={isRecording}
        onStartCamera={() => startCamera()}
        onCaptureBeRealPhoto={captureBeRealPhoto}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onRetake={retake}
        onUseCapturedMedia={useCapturedMedia}
        onUseBeRealPhotos={useBeRealPhotos}
      />

      <StatusMessage status={status} />
    </>
  );
}

