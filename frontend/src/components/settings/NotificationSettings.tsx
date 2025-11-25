import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { TEXT } from '../../constants/text';

export function NotificationSettings() {
  const {
    isEnabled,
    isSupported,
    permission,
    scheduledTime,
    toggleNotifications,
    testNotification,
  } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await toggleNotifications();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await testNotification();
    } finally {
      setIsTesting(false);
    }
  };

  // Format scheduled time nicely
  const formatScheduledTime = (date: Date): string => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <div className="notification-header">
          <span className="notification-title">{TEXT.notifications.title}</span>
        </div>
        <p className="notification-unsupported">{TEXT.notifications.unsupported}</p>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="notification-header">
        <span className="notification-title">{TEXT.notifications.title}</span>
        <button
          className={`notification-toggle ${isEnabled ? 'active' : ''}`}
          onClick={handleToggle}
          disabled={isLoading}
          aria-label={isEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          <span className="toggle-track" />
          <span className="toggle-label">
            {isLoading 
              ? '...' 
              : isEnabled 
                ? TEXT.notifications.on 
                : TEXT.notifications.off
            }
          </span>
        </button>
      </div>
      
      <p className="notification-description">{TEXT.notifications.description}</p>
      
      {permission === 'denied' && (
        <p className="notification-warning">{TEXT.notifications.denied}</p>
      )}
      
      {isEnabled && scheduledTime && (
        <div className="notification-schedule">
          <span className="schedule-label">{TEXT.notifications.nextReminder}</span>
          <span className="schedule-time">
            {scheduledTime.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' • '}
            {formatScheduledTime(scheduledTime)}
          </span>
        </div>
      )}
      
      <p className="notification-hint">{TEXT.notifications.timeWindow}</p>
      
      {/* Debug/Test Section */}
      {import.meta.env.DEV && (
        <div className="notification-debug">
          <button 
            className="btn btn--test"
            onClick={handleTest}
            disabled={isTesting || permission !== 'granted'}
          >
            {isTesting ? '[SYS] SENDING...' : TEXT.notifications.testButton}
          </button>
          <div className="debug-info">
            <code>
              [DEBUG] permission: {permission}<br />
              [DEBUG] enabled: {isEnabled ? 'true' : 'false'}<br />
              [DEBUG] scheduled: {scheduledTime?.toISOString() || 'null'}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

