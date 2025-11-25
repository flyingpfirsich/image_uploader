import type { Status } from '../../types';

interface StatusMessageProps {
  status: Status;
}

export function StatusMessage({ status }: StatusMessageProps) {
  if (!status.message) return null;

  return (
    <ul className="status-list">
      <li className={`status-item status-item--${status.type}`}>{status.message}</li>
    </ul>
  );
}


