import { useState, useRef, useCallback } from 'react';
import { TEXT } from '../constants/text';
import type { BeRealPhoto, BeRealPhotos, FacingMode, MainPhotoPosition, Status } from '../types';

interface UseBeRealCaptureOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamRef: React.RefObject<MediaStream | null>;
  facingMode: FacingMode;
  setFacingMode: (mode: FacingMode) => void;
  setCameraActive: (active: boolean) => void;
  onStatusChange?: (status: Status) => void;
}

export function useBeRealCapture({
  videoRef,
  streamRef,
  facingMode,
  setFacingMode,
  setCameraActive,
  onStatusChange,
}: UseBeRealCaptureOptions) {
  const [beRealPhotos, setBeRealPhotos] = useState<BeRealPhotos>({ front: null, back: null });
  const [isCapturingSecond, setIsCapturingSecond] = useState(false);
  const [mainPhotoPosition, setMainPhotoPosition] = useState<MainPhotoPosition>('back');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  }, [videoRef, facingMode]);

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
    onStatusChange?.({ type: '', message: TEXT.camera.capturingSecond });
    
    const secondFacingMode: FacingMode = isFirstFront ? 'environment' : 'user';
    setFacingMode(secondFacingMode);
    
    // Small delay before starting second camera
    setTimeout(async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: { facingMode: secondFacingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        (streamRef as React.MutableRefObject<MediaStream | null>).current = stream;
        
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
            onStatusChange?.({ type: '', message: '' });
          }, 500);
        }
      } catch (error) {
        console.error('Error capturing second photo:', error);
        setIsCapturingSecond(false);
        onStatusChange?.({ type: 'error', message: TEXT.camera.noCamera });
      }
    }, 300);
  }, [captureCurrentFrame, facingMode, streamRef, videoRef, setFacingMode, setCameraActive, onStatusChange]);

  // Swap main/overlay photos in BeReal view
  const swapBeRealPhotos = useCallback(() => {
    setMainPhotoPosition(prev => prev === 'front' ? 'back' : 'front');
  }, []);

  // Composite BeReal photos into a single image
  const compositeBeRealPhotos = useCallback(async (): Promise<File | null> => {
    if (!beRealPhotos.front || !beRealPhotos.back) return null;
    
    // Create a canvas to composite both images
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
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
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `bereal_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            resolve(file);
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.9);
      });
    } catch (error) {
      console.error('Error compositing BeReal photos:', error);
      return null;
    }
  }, [beRealPhotos, mainPhotoPosition]);

  // Cleanup BeReal photos
  const clearBeRealPhotos = useCallback(() => {
    if (beRealPhotos.front) URL.revokeObjectURL(beRealPhotos.front.url);
    if (beRealPhotos.back) URL.revokeObjectURL(beRealPhotos.back.url);
    setBeRealPhotos({ front: null, back: null });
  }, [beRealPhotos]);

  // Check if BeReal photos are complete
  const hasBeRealPhotos = beRealPhotos.front !== null && beRealPhotos.back !== null;

  return {
    beRealPhotos,
    isCapturingSecond,
    mainPhotoPosition,
    hasBeRealPhotos,
    canvasRef,
    captureBeRealPhoto,
    swapBeRealPhotos,
    compositeBeRealPhotos,
    clearBeRealPhotos,
  };
}

