import { useState } from 'react';
import type { Post } from '../../types';
import { useAuthenticatedMedia } from '../../hooks/useAuthenticatedMedia';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { PostDetailModal } from './PostDetailModal';

interface ArchiveGalleryItemProps {
  post: Post;
  currentUserId: string;
  token: string;
  onPostChange?: () => void;
}

export function ArchiveGalleryItem({
  post,
  currentUserId,
  token,
  onPostChange,
}: ArchiveGalleryItemProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [ref, isVisible] = useIntersectionObserver<HTMLElement>({
    rootMargin: '200px', // Start loading 200px before entering viewport
    triggerOnce: true,
  });

  const firstMedia = post.media[0];

  // Only fetch when visible (lazy loading)
  const { url: mediaUrl, isLoading: mediaLoading } = useAuthenticatedMedia(
    isVisible ? (firstMedia?.filename ?? null) : null,
    token,
    'media'
  );

  const hasMultipleMedia = post.media.length > 1;

  // Only show posts with media
  if (post.media.length === 0) {
    return null;
  }

  return (
    <>
      <article ref={ref} className="archive-gallery-item" onClick={() => setShowDetail(true)}>
        <div className="archive-gallery-media">
          {hasMultipleMedia && <span className="archive-gallery-badge">{post.media.length}</span>}
          {!isVisible || mediaLoading ? (
            <div className="archive-gallery-loading">...</div>
          ) : mediaUrl ? (
            firstMedia.mimeType.startsWith('video/') ? (
              <video src={mediaUrl} className="archive-gallery-content" muted playsInline />
            ) : (
              <img src={mediaUrl} alt="" className="archive-gallery-content" />
            )
          ) : null}
        </div>
      </article>

      {showDetail && (
        <PostDetailModal
          post={post}
          currentUserId={currentUserId}
          token={token}
          onClose={() => setShowDetail(false)}
          onPostChange={onPostChange}
        />
      )}
    </>
  );
}
