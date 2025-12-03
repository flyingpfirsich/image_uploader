import { useState } from 'react';
import './styles/index.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LoginScreen } from './components/auth/LoginScreen';
import { Feed } from './components/feed/Feed';
import { Profile } from './components/profile/Profile';
import { AdminPanel } from './components/admin/AdminPanel';

// Types
import type { NavMode } from './types';
import { ADMIN_USERNAME } from './types';

function AppContent() {
  const { user, token, isLoading, isAuthenticated, logout, updateUser } = useAuth();
  const [activeNav, setActiveNav] = useState<NavMode>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-screen">
          <span className="logo-kaomoji">(◕‿◕)</span>
          <span className="cursor-blink">Loading</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user || !token) {
    return <LoginScreen />;
  }

  // Handle friend selection
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setActiveNav('profile');
  };

  // Reset to own profile when clicking profile nav
  const handleNavChange = (nav: NavMode) => {
    if (nav === 'profile') {
      setSelectedUserId(null);
    }
    setActiveNav(nav);
  };

  const profileUserId = selectedUserId || user.id;
  const isAdmin = user.username === ADMIN_USERNAME;

  return (
    <div className="container">
      <Header activeNav={activeNav} onNavChange={handleNavChange} isAdmin={isAdmin} />

      <main className="main">
        {activeNav === 'feed' && (
          <Feed token={token} userId={user.id} onUserClick={handleSelectUser} />
        )}
        {activeNav === 'profile' && (
          <Profile
            userId={profileUserId}
            currentUserId={user.id}
            token={token}
            onUserUpdate={updateUser}
            onSelectUser={handleSelectUser}
          />
        )}
        {activeNav === 'admin' && isAdmin && <AdminPanel token={token} />}
      </main>

      <Footer onLogout={logout} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
