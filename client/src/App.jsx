import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ChatRoom from './components/ChatRoom';
import WalletModal from './components/WalletModal';
import ProfileModal from './components/ProfileModal';
import ErrorBoundary from './components/ErrorBoundary';
import { Coins } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(100);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [matchPreferences, setMatchPreferences] = useState({ myGender: 'Any', lookingFor: 'Any' });

  // Load profile and ID from local storage
  useEffect(() => {
    let weMetId = localStorage.getItem('wemet_id');
    if (!weMetId) {
      weMetId = 'wm_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('wemet_id', weMetId);
    }

    const savedProfile = localStorage.getItem('wemet_profile');
    if (savedProfile) {
      setUser({ ...JSON.parse(savedProfile), weMetId, isGuest: false });
    } else {
      // Initialize a default guest identity
      setUser({ 
        weMetId,
        username: `Guest_${weMetId.substr(3, 4)}`, 
        isGuest: true,
        avatar: '👋',
        bio: 'Just visiting WeMet!'
      });
    }

    // Initialize favorites if not exists
    if (!localStorage.getItem('wemet_favorites')) {
      localStorage.setItem('wemet_favorites', JSON.stringify([]));
    }
  }, []);

  const handleStart = (prefs) => {
    setMatchPreferences(prefs);
    if (!user) {
        setUser({ username: 'User', isGuest: false, avatar: '😊', bio: 'Ready to chat!' });
    }
    setCurrentPage('chat');
  };

  const handleGuestStart = (prefs) => {
    // Determine the ID to use: existing user ID, generated ID from useEffect, or fallback new ID
    let currentId = user?.weMetId || localStorage.getItem('wemet_id');
    if (!currentId) {
       currentId = 'wm_' + Math.random().toString(36).substr(2, 9);
       localStorage.setItem('wemet_id', currentId);
    }

    const guestUser = { 
        ...user,
        weMetId: currentId,
        username: user?.username || `Guest_${currentId.substr(3, 4)}`, 
        isGuest: true,
        avatar: user?.avatar || '👋',
        bio: user?.bio || 'Just visiting!'
    };
    setUser(guestUser);
    setMatchPreferences(prefs);
    setCurrentPage('chat');
  };

  const handleUpdateProfile = (updatedProfile) => {
    const newUser = { ...user, ...updatedProfile };
    setUser(newUser);
    localStorage.setItem('wemet_profile', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    // setUser(null); // Keep profile for next time
    setCurrentPage('landing');
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        {currentPage === 'landing' && (
          <LandingPage onStart={handleStart} onGuestStart={handleGuestStart} />
        )}

        {currentPage === 'chat' && (
          <ChatRoom 
            user={user} 
            matchPreferences={matchPreferences}
            onLogout={handleLogout}
            coins={coins}
            setCoins={setCoins}
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        )}

        {isWalletOpen && (
          <WalletModal 
            isOpen={isWalletOpen} 
            onClose={() => setIsWalletOpen(false)} 
            coins={coins}
            setCoins={setCoins}
          />
        )}

        {isProfileOpen && (
          <ProfileModal
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              user={user}
              onUpdateProfile={handleUpdateProfile}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
