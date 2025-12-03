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

  // Bulk settings
  const [bulkPostCount, setBulkPostCount] = useState(5);
  const [bulkReactionCount, setBulkReactionCount] = useState(10);
  const [bulkUserCount, setBulkUserCount] = useState(3);

  function addResult(type: 'success' | 'error', message: string) {
    setResults((prev) => [
      { type, message, timestamp: new Date() },
      ...prev.slice(0, 14), // Keep last 15 results
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

  async function handleBulkPosts() {
    setLoading('bulk-posts');
    try {
      const result = await api.createBulkTestPosts(token, bulkPostCount);
      addResult('success', result.message);
    } catch (err) {
      addResult('error', err instanceof Error ? err.message : 'Failed to create bulk posts');
    } finally {
      setLoading(null);
    }
  }

  async function handleBulkReactions() {
    setLoading('bulk-reactions');
    try {
      const result = await api.createTestReactions(token, bulkReactionCount);
      addResult('success', result.message);
    } catch (err) {
      addResult('error', err instanceof Error ? err.message : 'Failed to create reactions');
    } finally {
      setLoading(null);
    }
  }

  async function handleCreateTestUsers() {
    setLoading('test-users');
    try {
      const result = await api.createTestUsers(token, bulkUserCount);
      addResult('success', result.message);
    } catch (err) {
      addResult('error', err instanceof Error ? err.message : 'Failed to create test users');
    } finally {
      setLoading(null);
    }
  }

  async function handleClearTestData(includeUsers: boolean) {
    const key = includeUsers ? 'clear-all' : 'clear-posts';
    setLoading(key);
    try {
      const result = await api.deleteTestData(token, includeUsers);
      addResult('success', result.message);
    } catch (err) {
      addResult('error', err instanceof Error ? err.message : 'Failed to clear test data');
    } finally {
      setLoading(null);
    }
  }

  function clearLog() {
    setResults([]);
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
            <p className="action-description">
              Send a test daily reminder notification to yourself
            </p>
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
            <p className="action-description">
              Send a test "friend posted" notification to yourself
            </p>
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
            <p className="action-description">
              Send daily reminder to ALL subscribed users (use with caution)
            </p>
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

      {/* Bulk Data Testing */}
      <div className="testing-section">
        <h2 className="section-title">
          <span className="section-icon">(ノ◕ヮ◕)ノ*:・゚✧</span>
          bulk data testing
        </h2>
        <p className="section-description">
          Quickly populate the app with test data to test feed performance and UI behavior.
        </p>

        <div className="testing-actions">
          <div className="testing-action">
            <h3 className="action-title">bulk posts</h3>
            <p className="action-description">Create multiple test posts at once</p>
            <div className="action-controls">
              <select
                className="form-select"
                value={bulkPostCount}
                onChange={(e) => setBulkPostCount(Number(e.target.value))}
              >
                <option value={5}>5 posts</option>
                <option value={10}>10 posts</option>
                <option value={20}>20 posts</option>
              </select>
              <button className="btn" onClick={handleBulkPosts} disabled={loading === 'bulk-posts'}>
                {loading === 'bulk-posts' ? 'creating...' : 'create'}
              </button>
            </div>
          </div>

          <div className="testing-action">
            <h3 className="action-title">seed reactions</h3>
            <p className="action-description">Add random reactions to recent posts</p>
            <div className="action-controls">
              <select
                className="form-select"
                value={bulkReactionCount}
                onChange={(e) => setBulkReactionCount(Number(e.target.value))}
              >
                <option value={10}>10 reactions</option>
                <option value={25}>25 reactions</option>
                <option value={50}>50 reactions</option>
              </select>
              <button
                className="btn"
                onClick={handleBulkReactions}
                disabled={loading === 'bulk-reactions'}
              >
                {loading === 'bulk-reactions' ? 'adding...' : 'add'}
              </button>
            </div>
          </div>

          <div className="testing-action">
            <h3 className="action-title">seed test users</h3>
            <p className="action-description">Create test accounts (password: test123)</p>
            <div className="action-controls">
              <select
                className="form-select"
                value={bulkUserCount}
                onChange={(e) => setBulkUserCount(Number(e.target.value))}
              >
                <option value={3}>3 users</option>
                <option value={5}>5 users</option>
                <option value={10}>10 users</option>
              </select>
              <button
                className="btn"
                onClick={handleCreateTestUsers}
                disabled={loading === 'test-users'}
              >
                {loading === 'test-users' ? 'creating...' : 'create'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Post Testing */}
      <div className="testing-section">
        <h2 className="section-title">
          <span className="section-icon">(｡◕‿◕｡)</span>
          custom test post
        </h2>
        <p className="section-description">
          Create a test post with custom content (text only, no media upload).
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

          <button className="btn" onClick={handleCreateTestPost} disabled={loading === 'test-post'}>
            {loading === 'test-post' ? 'creating...' : 'create test post'}
          </button>
        </div>
      </div>

      {/* Cleanup */}
      <div className="testing-section">
        <h2 className="section-title">
          <span className="section-icon">(╯°□°)╯︵ ┻━┻</span>
          cleanup
        </h2>
        <p className="section-description">
          Delete test data created by the testing tools. Only affects posts/users with [Test]
          prefix.
        </p>

        <div className="testing-actions">
          <div className="testing-action">
            <h3 className="action-title">clear test posts</h3>
            <p className="action-description">Delete all [Test] posts</p>
            <button
              className="btn btn--secondary"
              onClick={() => handleClearTestData(false)}
              disabled={loading === 'clear-posts'}
            >
              {loading === 'clear-posts' ? 'clearing...' : 'clear posts'}
            </button>
          </div>

          <div className="testing-action">
            <h3 className="action-title">clear all test data</h3>
            <p className="action-description">Delete [Test] posts AND testuser* accounts</p>
            <button
              className="btn btn--danger"
              onClick={() => handleClearTestData(true)}
              disabled={loading === 'clear-all'}
            >
              {loading === 'clear-all' ? 'clearing...' : 'clear all'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Log */}
      <div className="testing-section">
        <h2 className="section-title">
          <span className="section-icon">&gt;_</span>
          results log
          {results.length > 0 && (
            <button className="btn btn--small btn--ghost" onClick={clearLog}>
              clear
            </button>
          )}
        </h2>

        {results.length === 0 ? (
          <p className="empty-text">no test results yet</p>
        ) : (
          <ul className="results-log">
            {results.map((result, i) => (
              <li key={i} className={`result-item result-item--${result.type}`}>
                <span className="result-time">[{result.timestamp.toLocaleTimeString()}]</span>
                <span className="result-indicator">{result.type === 'success' ? '✓' : '✗'}</span>
                <span className="result-message">{result.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
