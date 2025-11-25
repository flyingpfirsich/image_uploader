import { useState, useRef } from 'react';
import * as api from '../../services/api';

interface CreatePostProps {
  token: string;
  onPostCreated: () => void;
  onClose: () => void;
}

export function CreatePost({ token, onPostCreated, onClose }: CreatePostProps) {
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Create previews
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    
    setFiles((prev) => [...prev, ...selectedFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) {
      setError('Add some text or media');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.createPost(
        token,
        {
          text: text.trim() || undefined,
          location: location.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
        },
        files.length > 0 ? files : undefined
      );
      
      // Clean up previews
      previews.forEach((p) => URL.revokeObjectURL(p));
      
      onPostCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-post-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <header className="create-post-header">
          <h2 className="section-title">New Post</h2>
          <button className="btn--text" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <textarea
              className="form-input form-textarea"
              placeholder="What's happening?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              autoFocus
            />
          </div>

          {previews.length > 0 && (
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
                    onClick={() => removeFile(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="create-post-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              + Media
            </button>

            <input
              type="text"
              className="form-input form-input--small"
              placeholder="📍 Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <input
              type="url"
              className="form-input form-input--small"
              placeholder="🔗 Link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
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
      </div>
    </div>
  );
}

