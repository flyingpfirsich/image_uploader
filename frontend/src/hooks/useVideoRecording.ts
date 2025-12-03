import { useState, useRef, useCallback } from 'react';
import type { CapturedMedia } from '../types';

interface UseVideoRecordingOptions {
  streamRef: React.RefObject<MediaStream | null>;
  onRecordingComplete: (media: CapturedMedia) => void;
  onStopCamera: () => void;
}

export function useVideoRecording({
  streamRef,
  onRecordingComplete,
  onStopCamera,
}: UseVideoRecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Start video recording (high quality 720p, optimized for 5s avg videos within 10MB)
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
      ? 'video/mp4;codecs=avc1'
      : 'video/mp4';

    // High quality 720p video (~2.5MB per 5 seconds, fits well within 10MB limit)
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: 4000000, // 4 Mbps for crisp 720p
      audioBitsPerSecond: 128000, // 128 kbps for clear audio
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
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
