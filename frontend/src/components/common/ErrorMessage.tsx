interface ErrorMessageProps {
  message: string;
  className?: string;
}

/**
 * Consistent error message display component
 */
export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <ul className={`status-list ${className}`}>
      <li className="status-item status-item--error">{message}</li>
    </ul>
  );
}
