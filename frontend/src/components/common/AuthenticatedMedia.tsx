import { useAuthenticatedMedia } from '../../hooks/useAuthenticatedMedia';

interface AuthenticatedMediaProps {
  filename: string;
  mimeType: string;
  token: string;
  className?: string;
}

/**
 * Media component that loads images/videos using authenticated blob URLs
 * Shows a loading placeholder while fetching
 */
export function AuthenticatedMedia({
  filename,
  mimeType,
  token,
  className = '',
}: AuthenticatedMediaProps) {
  const { url, isLoading } = useAuthenticatedMedia(filename, token, 'media');
  const isVideo = mimeType.startsWith('video/');

  if (isLoading) {
    return <div className={`${className} media-loading`}>Loading...</div>;
  }

  if (!url) {
    return null;
  }

  if (isVideo) {
    return <video src={url} controls className={className} />;
  }

  return <img src={url} alt="" className={className} />;
}
