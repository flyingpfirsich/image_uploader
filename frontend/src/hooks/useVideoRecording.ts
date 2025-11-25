import { useState, useRef, useCallback } from 'react';
import type { CapturedMedia } from '../types';

interface UseVideoRecordingOptions {
  streamRef: React.RefObject<MediaStream | null>;
  onRecordingComplete: (media: CapturedMedia) => void;
  onStopCamera: () => void;
}

export function useVideoRecording({ streamRef, onRecordingComplete, onStopCamera }: UseVideoRecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Start video recording (lower quality for smaller files)
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    
    recordedChunksRef.current = [];
    
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : 'video/webm';
    
    // Lower bitrate for smaller file sizes (500 kbps video @ 480p)
    const mediaRecorder = new MediaRecorder(streamRef.current, { 
      mimeType,
      videoBitsPerSecond: 500000,  // 500 kbps
      audioBitsPerSecond: 32000,   // 32 kbps
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      onRecordingComplete({ blob, type: 'video', url });
      onStopCamera();
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setIsRecording(true);
  }, [streamRef, onRecordingComplete, onStopCamera]);

  // Stop video recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
}

