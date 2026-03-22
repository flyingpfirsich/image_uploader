import { useRef, useState } from 'react';
import { TEXT } from '../../constants/text';
import { MusicPicker, MusicShare } from '../music';
import type { SpotifyTrack } from '../../types';

function getRandomPlaceholder() {
  return TEXT.createPost.placeholders[
    Math.floor(Math.random() * TEXT.createPost.placeholders.length)
  ];
}

interface CreatePostComposeProps {
  token: string;
  text: string;
  location: string;
  linkUrl: string;
  files: File[];
  previews: string[];
  isLoading: boolean;
  error: string;
  selectedTrack: SpotifyTrack | null;
  selectedMood: string | undefined;
  onTextChange: (text: string) => void;
  onLocationChange: (location: string) => void;
  onLinkUrlChange: (linkUrl: string) => void;
  onFilesChange: (files: File[], previews: string[]) => void;
  onRemoveFile: (index: number) => void;
  onMusicSelect: (track: SpotifyTrack, mood?: string) => void;
  onMusicRemove: () => void;
  onStartCamera: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreatePostCompose({
  token,
  text,
  location,
  linkUrl,
  files,
  previews,
  isLoading,
  error,
  selectedTrack,
  selectedMood,
  onTextChange,
  onLocationChange,
  onLinkUrlChange,
  onFilesChange,
  onRemoveFile,
  onMusicSelect,
  onMusicRemove,
  onStartCamera,
  onSubmit,
}: CreatePostComposeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [placeholder] = useState(getRandomPlaceholder);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    onFilesChange([...files, ...selectedFiles], [...previews, ...newPreviews]);
  };

  const handleMusicSelect = (track: SpotifyTrack, mood?: string) => {
    onMusicSelect(track, mood);
    setShowMusicPicker(false);
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        {files.length === 0 ? (
          <div className="media-input-section">
            <button type="button" className="media-btn media-btn--primary" onClick={onStartCamera}>
              <span className="media-btn-icon">[ ]</span>
              <span className="media-btn-label">{TEXT.createPost.takePhoto}</span>
            </button>
          </div>
        ) : (
          <div className="create-post-previews">
            {previews.map((preview, index) => (
              <div key={index} className="preview-item">
                {files[index].type.startsWith('video/') ? (
                  <video src={preview} className="preview-media" />
                ) : (
                  <img src={preview} alt="" className="preview-media" />
                )}
                <button
                  type="button"
                  className="preview-remove"
                  onClick={() => onRemoveFile(index)}
                >
                  x
                </button>
              </div>
            ))}
            <button
              type="button"
              className="preview-add-more"
              onClick={() => fileInputRef.current?.click()}
            >
              +
            </button>
          </div>
        )}

        <div className="form-row">
          <textarea
            className="form-input form-textarea"
            placeholder={placeholder}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={3}
            autoFocus
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Selected Music Preview */}
        {selectedTrack && (
          <div className="create-post-music">
            <MusicShare
              track={selectedTrack}
              mood={selectedMood}
              compact
              showRemove
              onRemove={onMusicRemove}
            />
          </div>
        )}

        <div className="create-post-actions">
          <input
            type="text"
            className="form-input form-input--small"
            placeholder="@ Location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
          />

          <input
            type="url"
            className="form-input form-input--small"
            placeholder="~> Link"
            value={linkUrl}
            onChange={(e) => onLinkUrlChange(e.target.value)}
          />

          <button
            type="button"
            className="media-btn media-btn--secondary media-btn--music"
            onClick={() => setShowMusicPicker(true)}
            title="Add music"
          >
            <span className="media-btn-icon">{'>>'}</span>
          </button>

          <button
            type="button"
            className="media-btn media-btn--secondary media-btn--upload"
            onClick={() => fileInputRef.current?.click()}
            title="Upload from device"
          >
            <span className="media-btn-icon">^</span>
          </button>
        </div>

        {error && (
          <ul className="status-list">
            <li className="status-item status-item--error">{error}</li>
          </ul>
        )}

        <div className="create-post-submit">
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Music Picker Modal */}
      {showMusicPicker && (
        <MusicPicker
          token={token}
          onSelect={handleMusicSelect}
          onClose={() => setShowMusicPicker(false)}
        />
      )}
    </>
  );
}
