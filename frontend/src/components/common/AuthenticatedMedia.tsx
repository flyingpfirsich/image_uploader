import { useAuthenticatedMedia } from '../../hooks/useAuthenticatedMedia';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface AuthenticatedMediaProps {
  filename: string;
  mimeType: string;
  token: string;
  className?: string;
  lazy?: boolean;
}

/**
 * Media component that loads images/videos using authenticated blob URLs
 * Shows a loading placeholder while fetching
 * Supports lazy loading via IntersectionObserver
 */
export function AuthenticatedMedia({
  filename,
  mimeType,
  token,
  className = '',
  lazy = false,
}: AuthenticatedMediaProps) {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '100px', // Start loading 100px before entering viewport
    triggerOnce: true,
  });

  // Only fetch when visible (or immediately if not lazy)
  const shouldLoad = !lazy || isVisible;
  const { url, isLoading } = useAuthenticatedMedia(shouldLoad ? filename : null, token, 'media');
  const isVideo = mimeType.startsWith('video/');

  // Show placeholder while waiting to enter viewport or loading
  if (!shouldLoad || isLoading) {
    return (
      <div ref={lazy ? ref : undefined} className={`${className} media-loading`}>
        Loading...
      </div>
    );
  }

  if (!url) {
    return null;
  }

  if (isVideo) {
    return <video src={url} controls className={className} />;
  }

  return <img src={url} alt="" className={className} loading={lazy ? 'lazy' : undefined} />;
}
