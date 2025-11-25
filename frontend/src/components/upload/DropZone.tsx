import type { DragEvent, RefObject } from 'react';
import { TEXT } from '../../constants/text';

interface DropZoneProps {
  file: File | null;
  isDragging: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDrag: (e: DragEvent<HTMLDivElement>, entering: boolean) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DropZone({
  file,
  isDragging,
  fileInputRef,
  onDrag,
  onDrop,
  onClick,
  onFileChange,
}: DropZoneProps) {
  return (
    <div
      className={`drop-zone ${isDragging ? 'active' : ''}`}
      onDragEnter={(e) => onDrag(e, true)}
      onDragLeave={(e) => onDrag(e, false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
      {file ? (
        <span className="file-selected">{TEXT.upload.selected} {file.name}</span>
      ) : (
        <>
          <p className="drop-zone-text">{TEXT.upload.dropText}</p>
          <p className="drop-zone-hint">{TEXT.upload.dropHint}</p>
        </>
      )}
    </div>
  );
}


