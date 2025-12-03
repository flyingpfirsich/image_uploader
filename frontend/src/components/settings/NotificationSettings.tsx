import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { TEXT } from '../../constants/text';

export function NotificationSettings() {
  const { token } = useAuth();
  const {
    isEnabled,
    isSupported,
    isLoading,
    permission,
    dailyReminder,
    friendPosts,
    scheduledTime,
    toggleNotifications,
    setDailyReminder,
    setFriendPosts,
    testNotification,
  } = useNotifications({ token });

  const [isToggling, setIsToggling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleMainToggle = async () => {
    setIsToggling(true);
    try {
      await toggleNotifications();
    } finally {
      setIsToggling(false);
    }
  };

  const handleDailyToggle = async () => {
    await setDailyReminder(!dailyReminder);
  };

  const handleFriendToggle = async () => {
    await setFriendPosts(!friendPosts);
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
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="notification-settings">
        <div className="notification-header">
          <span className="notification-icon">(◕‿◕)</span>
          <span className="notification-title">{TEXT.notifications.title}</span>
        </div>
        <p className="notification-loading">{TEXT.notifications.loading}</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <div className="notification-header">
          <span className="notification-icon">(◕︵◕)</span>
          <span className="notification-title">{TEXT.notifications.title}</span>
        </div>
        <p className="notification-unsupported">{TEXT.notifications.unsupported}</p>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="notification-header">
        <div className="notification-header-left">
          <span className="notification-icon">{isEnabled ? '(◕‿◕)' : '(◕_◕)'}</span>
          <div className="notification-header-text">
            <span className="notification-title">{TEXT.notifications.title}</span>
            <span className="notification-subtitle">{TEXT.notifications.subtitle}</span>
          </div>
        </div>
        <button
          className={`notification-main-toggle ${isEnabled ? 'active' : ''}`}
          onClick={handleMainToggle}
          disabled={isToggling}
          aria-label={isEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
        </button>
      </div>

      {permission === 'denied' && (
        <p className="notification-warning">{TEXT.notifications.denied}</p>
      )}

      {isEnabled && (
        <div className="notification-options">
          {/* Daily Reminder Toggle */}
          <div className="notification-option">
            <div className="notification-option-info">
              <span className="notification-option-label">
                {TEXT.notifications.dailyReminder.label}
              </span>
              <span className="notification-option-description">
                {TEXT.notifications.dailyReminder.description}
              </span>
              {dailyReminder && scheduledTime && (
                <span className="notification-option-time">
                  {TEXT.notifications.dailyReminder.nextAt} {formatScheduledTime(scheduledTime)}
                </span>
              )}
            </div>
            <button
              className={`notification-toggle ${dailyReminder ? 'active' : ''}`}
              onClick={handleDailyToggle}
              aria-label={dailyReminder ? 'Disable daily reminder' : 'Enable daily reminder'}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>

          {/* Friend Posts Toggle */}
          <div className="notification-option">
            <div className="notification-option-info">
              <span className="notification-option-label">
                {TEXT.notifications.friendPosts.label}
              </span>
              <span className="notification-option-description">
                {TEXT.notifications.friendPosts.description}
              </span>
            </div>
            <button
              className={`notification-toggle ${friendPosts ? 'active' : ''}`}
              onClick={handleFriendToggle}
              aria-label={
                friendPosts
                  ? 'Disable friend post notifications'
                  : 'Enable friend post notifications'
              }
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Debug/Test Section */}
      {import.meta.env.DEV && isEnabled && (
        <div className="notification-debug">
          <button
            className="btn btn--test"
            onClick={handleTest}
            disabled={isTesting || permission !== 'granted'}
          >
            {isTesting ? '[SENDING...]' : TEXT.notifications.testButton}
          </button>
          <div className="debug-info">
            <code>
              [DEBUG] permission: {permission}
              <br />
              [DEBUG] enabled: {isEnabled ? 'true' : 'false'}
              <br />
              [DEBUG] daily: {dailyReminder ? 'on' : 'off'}
              <br />
              [DEBUG] friends: {friendPosts ? 'on' : 'off'}
              <br />
              [DEBUG] scheduled: {scheduledTime?.toISOString() || 'null'}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
