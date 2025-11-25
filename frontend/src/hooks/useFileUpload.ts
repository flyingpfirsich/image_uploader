import { useState, useRef, useCallback, type DragEvent } from 'react';
import { uploadFile } from '../services/api';
import { TEXT } from '../constants/text';
import type { Status } from '../types';

export function useFileUpload(token: string | null) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ type: '', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>, entering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(entering);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files ? e.target.files[0] : null);
  }, []);

  const upload = useCallback(async () => {
    if (!file || !token) return false;

    setIsLoading(true);
    setStatus({ type: '', message: TEXT.upload.loading });

    try {
      const data = await uploadFile(file, token);
      
      if (data.success) {
        setStatus({ type: 'success', message: TEXT.upload.success });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return true;
      } else {
        setStatus({ type: 'error', message: `${TEXT.upload.error}: ${data.error || 'Upload failed'}` });
        return false;
      }
    } catch {
      setStatus({ type: 'error', message: `${TEXT.upload.error}: Verbindungsfehler` });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [file, token]);

  const clearFile = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const clearStatus = useCallback(() => {
    setStatus({ type: '', message: '' });
  }, []);

  return {
    file,
    setFile,
    isDragging,
    isLoading,
    status,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileClick,
    handleFileChange,
    upload,
    clearFile,
    clearStatus,
  };
}


