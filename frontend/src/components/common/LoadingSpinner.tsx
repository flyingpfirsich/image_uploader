interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

/**
 * Consistent loading state display component
 * Uses the cursor-blink animation from the design system
 */
export function LoadingSpinner({ message = 'Loading', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`loading-state ${className}`}>
      <span className="cursor-blink">{message}</span>
    </div>
  );
}
