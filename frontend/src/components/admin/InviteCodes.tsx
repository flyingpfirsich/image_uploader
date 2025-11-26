import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import type { AdminInviteCode } from '../../services/api';

interface InviteCodesProps {
  token: string;
}

export function InviteCodes({ token }: InviteCodesProps) {
  const [codes, setCodes] = useState<AdminInviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Create new code form
  const [expiresInDays, setExpiresInDays] = useState(7);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { inviteCodes } = await api.getAdminInviteCodes(token);
      setCodes(inviteCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invite codes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  async function handleCreateCode() {
    setActionLoading('create');
    setMessage(null);
    try {
      const result = await api.createAdminInviteCode(token, expiresInDays);
      setMessage({ type: 'success', text: `Code ${result.code} created` });
      loadCodes();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create code' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteCode(code: string) {
    setActionLoading(code);
    setMessage(null);
    try {
      await api.deleteAdminInviteCode(token, code);
      setMessage({ type: 'success', text: `Code ${code} deleted` });
      setCodes(codes.filter(c => c.code !== code));
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete code' });
    } finally {
      setActionLoading(null);
    }
  }

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code);
    setMessage({ type: 'success', text: `Code ${code} copied to clipboard` });
    setTimeout(() => setMessage(null), 2000);
  }

  // Group codes by status
  const activeCodes = codes.filter(c => c.status === 'active');
  const usedCodes = codes.filter(c => c.status === 'used');
  const expiredCodes = codes.filter(c => c.status === 'expired');

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="cursor-blink">loading invite codes</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <span className="error-icon">(╯°□°)╯</span>
        <span>{error}</span>
        <button className="btn btn--secondary" onClick={loadCodes}>retry</button>
      </div>
    );
  }

  return (
    <div className="invite-codes">
      {/* Create New Code */}
      <div className="invite-section">
        <h2 className="section-title">create invite code</h2>
        <div className="create-code-form">
          <div className="form-row-inline">
            <label className="form-label">expires in</label>
            <select
              className="form-input form-select"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <button
              className="btn"
              onClick={handleCreateCode}
              disabled={actionLoading === 'create'}
            >
              {actionLoading === 'create' ? 'creating...' : 'create code'}
            </button>
          </div>
        </div>
        
        {message && (
          <p className={`invite-message invite-message--${message.type}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Active Codes */}
      <div className="invite-section">
        <h2 className="section-title">
          active codes
          <span className="section-count">({activeCodes.length})</span>
        </h2>
        {activeCodes.length === 0 ? (
          <p className="empty-text">no active codes</p>
        ) : (
          <ul className="invite-list">
            {activeCodes.map(code => (
              <li key={code.code} className="invite-item invite-item--active">
                <div className="invite-code-main">
                  <span className="invite-code-value">{code.code}</span>
                  <button
                    className="btn-icon"
                    onClick={() => copyToClipboard(code.code)}
                    title="Copy to clipboard"
                  >
                    ⧉
                  </button>
                </div>
                <div className="invite-code-meta">
                  <span className="invite-created-by">
                    by @{code.createdByUser?.username || 'unknown'}
                  </span>
                  <span className="invite-expires">
                    expires: {code.expiresAt 
                      ? new Date(code.expiresAt).toLocaleDateString() 
                      : 'never'}
                  </span>
                </div>
                <button
                  className="btn-icon btn-icon--danger"
                  onClick={() => handleDeleteCode(code.code)}
                  disabled={actionLoading === code.code}
                  title="Delete code"
                >
                  {actionLoading === code.code ? '...' : '×'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Used Codes */}
      <div className="invite-section">
        <h2 className="section-title">
          used codes
          <span className="section-count">({usedCodes.length})</span>
        </h2>
        {usedCodes.length === 0 ? (
          <p className="empty-text">no used codes</p>
        ) : (
          <ul className="invite-list">
            {usedCodes.map(code => (
              <li key={code.code} className="invite-item invite-item--used">
                <div className="invite-code-main">
                  <span className="invite-code-value invite-code-value--used">{code.code}</span>
                  <span className="invite-status-badge invite-status-badge--used">used</span>
                </div>
                <div className="invite-code-meta">
                  <span className="invite-created-by">
                    by @{code.createdByUser?.username || 'unknown'}
                  </span>
                  <span className="invite-used-by">
                    used by @{code.usedByUser?.username || 'unknown'}
                  </span>
                  <span className="invite-used-at">
                    {code.usedAt ? new Date(code.usedAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Expired Codes */}
      {expiredCodes.length > 0 && (
        <div className="invite-section">
          <h2 className="section-title">
            expired codes
            <span className="section-count">({expiredCodes.length})</span>
          </h2>
          <ul className="invite-list">
            {expiredCodes.map(code => (
              <li key={code.code} className="invite-item invite-item--expired">
                <div className="invite-code-main">
                  <span className="invite-code-value invite-code-value--expired">{code.code}</span>
                  <span className="invite-status-badge invite-status-badge--expired">expired</span>
                </div>
                <div className="invite-code-meta">
                  <span className="invite-created-by">
                    by @{code.createdByUser?.username || 'unknown'}
                  </span>
                  <span className="invite-expired-at">
                    expired: {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <button
                  className="btn-icon btn-icon--danger"
                  onClick={() => handleDeleteCode(code.code)}
                  disabled={actionLoading === code.code}
                  title="Delete code"
                >
                  {actionLoading === code.code ? '...' : '×'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}





