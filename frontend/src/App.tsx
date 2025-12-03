import { useState } from 'react';
import './styles/index.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { LoginScreen } from './components/auth/LoginScreen';
import { Feed } from './components/feed/Feed';
import { CreatePost } from './components/feed/CreatePost';
import { Profile } from './components/profile/Profile';
import { AdminPanel } from './components/admin/AdminPanel';

// Types
import type { NavMode } from './types';
import { ADMIN_USERNAME } from './types';

function AppContent() {
  const { user, token, isLoading, isAuthenticated, logout, updateUser } = useAuth();
  const [activeNav, setActiveNav] = useState<NavMode>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

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

  // Handle create post
  const handleCreatePost = () => {
    setShowCreatePost(true);
  };

  const handlePostCreated = () => {
    setFeedKey((k) => k + 1); // Force feed refresh
    setActiveNav('feed');
  };

  const profileUserId = selectedUserId || user.id;
  const isAdmin = user.username === ADMIN_USERNAME;

  return (
    <div className="container">
      <Header token={token} onNavChange={handleNavChange} onLogout={logout} />

      <main className="main">
        {activeNav === 'feed' && (
          <Feed key={feedKey} token={token} userId={user.id} onUserClick={handleSelectUser} />
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

      <BottomNav
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onCreatePost={handleCreatePost}
        isAdmin={isAdmin}
      />

      {showCreatePost && (
        <CreatePost
          token={token}
          onPostCreated={handlePostCreated}
          onClose={() => setShowCreatePost(false)}
        />
      )}
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
