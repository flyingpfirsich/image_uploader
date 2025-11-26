import { useState } from 'react';
import { Dashboard } from './Dashboard';
import { UserManagement } from './UserManagement';
import { TestingTools } from './TestingTools';
import { InviteCodes } from './InviteCodes';

type AdminTab = 'dashboard' | 'users' | 'testing' | 'invites';

interface AdminPanelProps {
  token: string;
}

export function AdminPanel({ token }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1 className="admin-title">
          <span className="admin-icon">(⌐■_■)</span>
          <span>admin panel</span>
        </h1>
        <nav className="admin-nav">
          <button
            className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            dashboard
          </button>
          <span className="nav-sep">/</span>
          <button
            className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            users
          </button>
          <span className="nav-sep">/</span>
          <button
            className={`admin-nav-btn ${activeTab === 'invites' ? 'active' : ''}`}
            onClick={() => setActiveTab('invites')}
          >
            invites
          </button>
          <span className="nav-sep">/</span>
          <button
            className={`admin-nav-btn ${activeTab === 'testing' ? 'active' : ''}`}
            onClick={() => setActiveTab('testing')}
          >
            testing
          </button>
        </nav>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && <Dashboard token={token} />}
        {activeTab === 'users' && <UserManagement token={token} />}
        {activeTab === 'testing' && <TestingTools token={token} />}
        {activeTab === 'invites' && <InviteCodes token={token} />}
      </div>
    </div>
  );
}

