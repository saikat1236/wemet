import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ChatRoom from './components/ChatRoom';
import WalletModal from './components/WalletModal';
import { Coins } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(100);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [matchPreferences, setMatchPreferences] = useState({ myGender: 'Any', lookingFor: 'Any' });

  const handleStart = (prefs) => {
    // In a real app, handle login here
    setUser({ username: 'User', isGuest: false });
    setMatchPreferences(prefs);
    setCurrentPage('chat');
  };

  const handleGuestStart = (prefs) => {
    setUser({ username: `Guest_${Math.random().toString(36).substr(2, 6)}`, isGuest: true });
    setMatchPreferences(prefs);
    setCurrentPage('chat');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
  };

  return (
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
    </div>
  );
}

export default App;
