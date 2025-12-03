import { TEXT } from '../../constants/text';
import { CameraPreview } from '../camera/CameraPreview';
import type {
  CapturedMedia,
  CaptureMode,
  Status,
  BeRealPhotos,
  MainPhotoPosition,
  FacingMode,
} from '../../types';

interface CreatePostCameraProps {
  captureMode: CaptureMode;
  capturedMedia: CapturedMedia | null;
  hasBeRealPhotos: boolean;
  beRealPhotos: BeRealPhotos;
  mainPhotoPosition: MainPhotoPosition;
  cameraActive: boolean;
  isCapturingSecond: boolean;
  isRecording: boolean;
  facingMode: FacingMode;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: Status;
  onCaptureModeChange: (mode: CaptureMode) => void;
  onSwapBeRealPhotos: () => void;
  onSwitchCamera: () => void;
  onRetake: () => void;
  onUseBeRealPhotos: () => void;
  onUseCapturedMedia: () => void;
  onCaptureBeRealPhoto: () => void;
  onStartCamera: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onBack: () => void;
}

export function CreatePostCamera({
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
  status,
  onCaptureModeChange,
  onSwapBeRealPhotos,
  onSwitchCamera,
  onRetake,
  onUseBeRealPhotos,
  onUseCapturedMedia,
  onCaptureBeRealPhoto,
  onStartCamera,
  onStartRecording,
  onStopRecording,
  onBack,
}: CreatePostCameraProps) {
  return (
    <div className="create-post-camera">
      {/* Capture Mode Toggle */}
      <div className="capture-mode-toggle">
        <button
          className={`capture-mode-btn ${captureMode === 'photo' ? 'active' : ''}`}
          onClick={() => onCaptureModeChange('photo')}
          disabled={isRecording}
        >
          {TEXT.camera.photo}
        </button>
        <button
          className={`capture-mode-btn ${captureMode === 'video' ? 'active' : ''}`}
          onClick={() => onCaptureModeChange('video')}
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
        onSwapBeRealPhotos={onSwapBeRealPhotos}
        onSwitchCamera={onSwitchCamera}
      />

      {/* Camera Controls */}
      <div className="camera-controls">
        {/* Video captured */}
        {captureMode === 'video' && capturedMedia ? (
          <>
            <button className="btn btn--secondary" onClick={onRetake}>
              {TEXT.camera.retake}
            </button>
            <button className="btn" onClick={onUseCapturedMedia}>
              {TEXT.camera.use}
            </button>
          </>
        ) : hasBeRealPhotos ? (
          /* BeReal photos captured */
          <>
            <button className="btn btn--secondary" onClick={onRetake}>
              {TEXT.camera.retake}
            </button>
            <button className="btn" onClick={onUseBeRealPhotos}>
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
          <button className="btn" onClick={onStartCamera}>
            {TEXT.camera.start}
          </button>
        ) : captureMode === 'photo' ? (
          /* Photo mode - capture button */
          <button className="btn btn--capture" onClick={onCaptureBeRealPhoto}>
            {TEXT.camera.capture}
          </button>
        ) : !isRecording ? (
          /* Video mode - start recording */
          <button className="btn btn--record" onClick={onStartRecording}>
            {TEXT.camera.start}
          </button>
        ) : (
          /* Video mode - stop recording */
          <button className="btn btn--stop" onClick={onStopRecording}>
            {TEXT.camera.stop}
          </button>
        )}
      </div>

      <button className="btn--text camera-back-btn" onClick={onBack}>
        {'<-'} Back
      </button>

      {status.message && (
        <p className={`camera-status ${status.type === 'error' ? 'camera-status--error' : ''}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}
