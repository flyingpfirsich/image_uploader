import type { RefObject } from 'react';
import { TEXT } from '../../constants/text';
import type { CapturedMedia, BeRealPhotos, FacingMode, MainPhotoPosition, CaptureMode } from '../../types';
import { BeRealPreview } from './BeRealPreview';

interface CameraPreviewProps {
  captureMode: CaptureMode;
  capturedMedia: CapturedMedia | null;
  hasBeRealPhotos: boolean;
  beRealPhotos: BeRealPhotos;
  mainPhotoPosition: MainPhotoPosition;
  cameraActive: boolean;
  isCapturingSecond: boolean;
  isRecording: boolean;
  facingMode: FacingMode;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onSwapBeRealPhotos: () => void;
  onSwitchCamera: () => void;
}

export function CameraPreview({
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
  onSwapBeRealPhotos,
  onSwitchCamera,
}: CameraPreviewProps) {
  return (
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
        <BeRealPreview
          beRealPhotos={beRealPhotos}
          mainPhotoPosition={mainPhotoPosition}
          onSwap={onSwapBeRealPhotos}
        />
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
              onClick={(e) => { e.stopPropagation(); onSwitchCamera(); }}
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
  );
}


