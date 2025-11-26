import { useState } from 'react';
import * as api from '../../services/api';

interface TestingToolsProps {
  token: string;
}

interface TestResult {
  type: 'success' | 'error';
  message: string;
  timestamp: Date;
}

export function TestingTools({ token }: TestingToolsProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  
  // Test post form
  const [postText, setPostText] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [postLinkUrl, setPostLinkUrl] = useState('');
  const [postLinkTitle, setPostLinkTitle] = useState('');

  function addResult(type: 'success' | 'error', message: string) {
    setResults(prev => [
      { type, message, timestamp: new Date() },
      ...prev.slice(0, 9) // Keep last 10 results
    ]);
  }

  async function handleTestNotification(type: 'daily' | 'friend_post') {
    setLoading(`notification-${type}`);
    try {
      const result = await api.sendTestNotification(token, type);
      addResult('success', result.message);
    } catch (err) {
      addResult('error', err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setLoading(null);
    }
  }

  async function handleSendDailyReminders() {
    setLoading('daily-reminders');
    try {
      const result = await api.sendDailyReminders(token);
      addResult('success', result.message);
    } catch (err) {
      addResult('error', err instanceof Error ? err.message : 'Failed to send daily reminders');
    } finally {
      setLoading(null);
    }
  }

  async function handleCreateTestPost() {
    setLoading('test-post');
    try {
      const result = await api.createTestPost(token, {
        text: postText || undefined,
        location: postLocation || undefined,
        linkUrl: postLinkUrl || undefined,
        linkTitle: postLinkTitle || undefined,
      });
      addResult('success', result.message);
      // Clear form
      setPostText('');
      setPostLocation('');
      setPostLinkUrl('');
      setPostLinkTitle('');
    } catch (err) {
      addResult('error', err instanceof Error ? err.message : 'Failed to create test post');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="testing-tools">
      {/* Notification Testing */}
      <div className="testing-section">
        <h2 className="section-title">
          <span className="section-icon">(◕ᴗ◕✿)</span>
          notification testing
        </h2>
        <p className="section-description">
          Test push notifications. Make sure you have notifications enabled in your profile.
        </p>
        
        <div className="testing-actions">
          <div className="testing-action">
            <h3 className="action-title">test daily reminder</h3>
            <p className="action-description">Send a test daily reminder notification to yourself</p>
            <button
              className="btn"
              onClick={() => handleTestNotification('daily')}
              disabled={loading === 'notification-daily'}
            >
              {loading === 'notification-daily' ? 'sending...' : 'send daily'}
            </button>
          </div>

          <div className="testing-action">
            <h3 className="action-title">test friend post</h3>
            <p className="action-description">Send a test "friend posted" notification to yourself</p>
            <button
              className="btn"
              onClick={() => handleTestNotification('friend_post')}
              disabled={loading === 'notification-friend_post'}
            >
              {loading === 'notification-friend_post' ? 'sending...' : 'send friend post'}
            </button>
          </div>

          <div className="testing-action testing-action--wide">
            <h3 className="action-title">trigger daily reminders</h3>
            <p className="action-description">Send daily reminder to ALL subscribed users (use with caution)</p>
            <button
              className="btn btn--secondary"
              onClick={handleSendDailyReminders}
              disabled={loading === 'daily-reminders'}
            >
              {loading === 'daily-reminders' ? 'sending...' : 'send to all'}
            </button>
          </div>
        </div>
      </div>

      {/* Post Testing */}
      <div className="testing-section">
        <h2 className="section-title">
          <span className="section-icon">(ノ◕ヮ◕)ノ*:・゚✧</span>
          post testing
        </h2>
        <p className="section-description">
          Create test posts with various content types (text only, no media upload).
        </p>

        <div className="test-post-form">
          <div className="form-row">
            <label className="form-label">text content</label>
            <textarea
              className="form-input form-textarea"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="enter post text (optional)..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <label className="form-label">location</label>
            <input
              type="text"
              className="form-input"
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
              placeholder="e.g., Tokyo, Japan"
            />
          </div>

          <div className="form-row-inline">
            <div className="form-row">
              <label className="form-label">link url</label>
              <input
                type="url"
                className="form-input"
                value={postLinkUrl}
                onChange={(e) => setPostLinkUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="form-row">
              <label className="form-label">link title</label>
              <input
                type="text"
                className="form-input"
                value={postLinkTitle}
                onChange={(e) => setPostLinkTitle(e.target.value)}
                placeholder="link text"
              />
            </div>
          </div>

          <button
            className="btn"
            onClick={handleCreateTestPost}
            disabled={loading === 'test-post'}
          >
            {loading === 'test-post' ? 'creating...' : 'create test post'}
          </button>
        </div>
      </div>

      {/* Results Log */}
      <div className="testing-section">
        <h2 className="section-title">
          <span className="section-icon">&gt;_</span>
          results log
        </h2>
        
        {results.length === 0 ? (
          <p className="empty-text">no test results yet</p>
        ) : (
          <ul className="results-log">
            {results.map((result, i) => (
              <li key={i} className={`result-item result-item--${result.type}`}>
                <span className="result-time">
                  [{result.timestamp.toLocaleTimeString()}]
                </span>
                <span className="result-indicator">
                  {result.type === 'success' ? '✓' : '✗'}
                </span>
                <span className="result-message">{result.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}





