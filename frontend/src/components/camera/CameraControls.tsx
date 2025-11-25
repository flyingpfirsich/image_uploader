import { TEXT } from '../../constants/text';
import type { CapturedMedia, CaptureMode } from '../../types';

interface CameraControlsProps {
  captureMode: CaptureMode;
  capturedMedia: CapturedMedia | null;
  hasBeRealPhotos: boolean;
  isCapturingSecond: boolean;
  cameraActive: boolean;
  isRecording: boolean;
  onStartCamera: () => void;
  onCaptureBeRealPhoto: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetake: () => void;
  onUseCapturedMedia: () => void;
  onUseBeRealPhotos: () => void;
}

export function CameraControls({
  captureMode,
  capturedMedia,
  hasBeRealPhotos,
  isCapturingSecond,
  cameraActive,
  isRecording,
  onStartCamera,
  onCaptureBeRealPhoto,
  onStartRecording,
  onStopRecording,
  onRetake,
  onUseCapturedMedia,
  onUseBeRealPhotos,
}: CameraControlsProps) {
  // Video mode with captured media
  if (captureMode === 'video' && capturedMedia) {
    return (
      <div className="camera-controls">
        <button className="btn btn--secondary" onClick={onRetake}>
          {TEXT.camera.retake}
        </button>
        <button className="btn" onClick={onUseCapturedMedia}>
          {TEXT.camera.use}
        </button>
      </div>
    );
  }

  // BeReal photos captured
  if (hasBeRealPhotos) {
    return (
      <div className="camera-controls">
        <button className="btn btn--secondary" onClick={onRetake}>
          {TEXT.camera.retake}
        </button>
        <button className="btn" onClick={onUseBeRealPhotos}>
          {TEXT.camera.use}
        </button>
      </div>
    );
  }

  // Capturing second photo
  if (isCapturingSecond) {
    return (
      <div className="camera-controls">
        <button className="btn" disabled>
          {TEXT.camera.capturingSecond}
        </button>
      </div>
    );
  }

  // Camera not active
  if (!cameraActive) {
    return (
      <div className="camera-controls">
        <button className="btn" onClick={onStartCamera}>
          {TEXT.camera.start}
        </button>
      </div>
    );
  }

  // Photo mode - capture button
  if (captureMode === 'photo') {
    return (
      <div className="camera-controls">
        <button className="btn btn--capture" onClick={onCaptureBeRealPhoto}>
          {TEXT.camera.capture}
        </button>
      </div>
    );
  }

  // Video mode - record/stop buttons
  if (!isRecording) {
    return (
      <div className="camera-controls">
        <button className="btn btn--record" onClick={onStartRecording}>
          {TEXT.camera.start}
        </button>
      </div>
    );
  }

  return (
    <div className="camera-controls">
      <button className="btn btn--stop" onClick={onStopRecording}>
        {TEXT.camera.stop}
      </button>
    </div>
  );
}


