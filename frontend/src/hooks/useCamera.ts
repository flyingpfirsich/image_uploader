import { useState, useRef, useCallback, useEffect } from 'react';
import { TEXT } from '../constants/text';
import type { Status, FacingMode, CaptureMode } from '../types';

interface UseCameraOptions {
  captureMode: CaptureMode;
  onError?: (status: Status) => void;
}

export function useCamera({ captureMode, onError }: UseCameraOptions) {
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const setError = useCallback((status: Status) => {
    onError?.(status);
  }, [onError]);

  // Start camera stream (reduced resolution for smaller files)
  const startCamera = useCallback(async (overrideFacingMode?: FacingMode) => {
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
      return true;
    } catch (error) {
      console.error('Camera error:', error);
      if ((error as Error).name === 'NotAllowedError') {
        setError({ type: 'error', message: TEXT.camera.permissionDenied });
      } else {
        setError({ type: 'error', message: TEXT.camera.noCamera });
      }
      return false;
    }
  }, [captureMode, facingMode, setError]);

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
  }, []);

  // Switch between front and back camera
  const switchCamera = useCallback(() => {
    const newFacingMode: FacingMode = facingMode === 'user' ? 'environment' : 'user';
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    cameraActive,
    facingMode,
    setFacingMode,
    videoRef,
    streamRef,
    startCamera,
    stopCamera,
    switchCamera,
  };
}


