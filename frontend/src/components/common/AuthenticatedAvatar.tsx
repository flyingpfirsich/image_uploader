import { useAuthenticatedAvatar } from '../../hooks/useAuthenticatedMedia';
import { getKaomojiForUser } from '../../utils/kaomoji';

interface AuthenticatedAvatarProps {
  filename: string | null;
  userId: string;
  token: string;
  className?: string;
  placeholderClassName?: string;
}

/**
 * Avatar component that loads images using authenticated blob URLs
 * Shows a kaomoji placeholder when no avatar is set or while loading
 */
export function AuthenticatedAvatar({
  filename,
  userId,
  token,
  className = '',
  placeholderClassName = '',
}: AuthenticatedAvatarProps) {
  const avatarUrl = useAuthenticatedAvatar(filename, token);

  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className={className} />;
  }

  return <div className={`${className} ${placeholderClassName}`}>{getKaomojiForUser(userId)}</div>;
}
