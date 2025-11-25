import { useEffect } from 'react';
import { TEXT } from '../../constants/text';
import { DropZone } from './DropZone';
import { StatusMessage } from '../common/StatusMessage';
import { useFileUpload } from '../../hooks/useFileUpload';

interface UploadScreenProps {
  token: string | null;
  externalFile?: File | null;
  onExternalFileUsed?: () => void;
}

export function UploadScreen({ token, externalFile, onExternalFileUsed }: UploadScreenProps) {
  const {
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
  } = useFileUpload(token);

  // Handle external file from capture screen
  useEffect(() => {
    if (externalFile) {
      setFile(externalFile);
      onExternalFileUsed?.();
    }
  }, [externalFile, setFile, onExternalFileUsed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upload();
  };

  return (
    <>
      <h1 className="upload-title">{TEXT.upload.title}</h1>
      <p className="upload-subtitle">{TEXT.upload.subtitle}</p>

      <form onSubmit={handleSubmit}>
        <DropZone
          file={file}
          isDragging={isDragging}
          fileInputRef={fileInputRef}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onClick={handleFileClick}
          onFileChange={handleFileChange}
        />

        <button type="submit" className="btn" disabled={!file || isLoading}>
          {isLoading ? TEXT.upload.loading : TEXT.upload.submit}
        </button>
      </form>

      <StatusMessage status={status} />
    </>
  );
}
