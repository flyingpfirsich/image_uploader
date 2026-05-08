import { useState, useEffect } from 'react';
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

// Utils
import {
  getSharedContent,
  clearSharedContent,
  arrayBufferToFile,
} from './utils/shareStorage';

// Types
import type { NavMode } from './types';
import { ADMIN_USERNAME } from './types';

interface SharedFiles {
  files: File[];
  text?: string;
}

function AppContent() {
  const { user, token, isLoading, isAuthenticated, logout, updateUser } = useAuth();
  const [activeNav, setActiveNav] = useState<NavMode>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const [sharedData, setSharedData] = useState<SharedFiles | null>(null);

  // Check for shared content on mount and when URL changes
  useEffect(() => {
    const checkForSharedContent = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('shared') === 'true') {
        // Clear the URL parameter
        window.history.replaceState({}, '', '/');

        try {
          const content = await getSharedContent();
          if (content) {
            const files: File[] = [];
            if (content.files) {
              for (const fileData of content.files) {
                const file = arrayBufferToFile(fileData.data, fileData.name, fileData.type);
                files.push(file);
              }
            }

            // Combine text, title, and URL into caption
            const textParts: string[] = [];
            if (content.title) textParts.push(content.title);
            if (content.text) textParts.push(content.text);
            if (content.url) textParts.push(content.url);

            setSharedData({
              files,
              text: textParts.join('\n'),
            });

            await clearSharedContent();
            setShowCreatePost(true);
          }
        } catch (err) {
          console.error('Failed to process shared content:', err);
        }
      }
    };

    if (isAuthenticated) {
      checkForSharedContent();
    }
  }, [isAuthenticated]);

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
          onClose={() => {
            setShowCreatePost(false);
            setSharedData(null);
          }}
          initialFiles={sharedData?.files}
          initialText={sharedData?.text}
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
