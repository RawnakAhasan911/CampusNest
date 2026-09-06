import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Modal from './components/Modal';
import { CheckCircle2 } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import Roommates from './pages/Roommates';
import Connections from './pages/Connections';
import Messages from './pages/Messages';
import Favourites from './pages/Favourites';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import SecurityDocs from './pages/SecurityDocs';

import Login from './pages/Login';
import Register from './pages/Register';

function AppContent() {
  const { isAuthenticated, isAdmin } = useAuth();

  const [currentTab, setCurrentTab] = useState('home');
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [chatPartnerId, setChatPartnerId] = useState(null);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [verifyEmailData, setVerifyEmailData] = useState(null); // { userId, email }

  function handleOpenAuth(mode = 'login') {
    setAuthModalMode(mode);
    setVerifyEmailData(null);
    setAuthModalOpen(true);
  }

  function handleSelectListing(id) {
    setSelectedListingId(id);
    setCurrentTab('listing-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleStartChat(partnerId) {
    setChatPartnerId(partnerId);
    setCurrentTab('messages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleViewProfile(userId) {
    // If viewing own profile or going to profile
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleEmailNeedsVerify(userId, email) {
    setVerifyEmailData({ userId, email });
    setAuthModalMode('register');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* Universal Navigation */}
      <Navbar
        currentTab={currentTab}
        setTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Page View */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <Home
            setTab={setCurrentTab}
            onOpenAuth={handleOpenAuth}
            onSelectListing={handleSelectListing}
            onConnectUser={() => setCurrentTab('roommates')}
            onViewProfile={handleViewProfile}
          />
        )}

        {currentTab === 'listings' && (
          <Listings
            onSelectListing={handleSelectListing}
            setTab={setCurrentTab}
          />
        )}

        {currentTab === 'listing-detail' && (
          <ListingDetail
            listingId={selectedListingId}
            onBack={() => setCurrentTab('listings')}
            onConnectOwner={(owner) => {
              if (!isAuthenticated) {
                handleOpenAuth('login');
              } else {
                setCurrentTab('roommates');
              }
            }}
            setTab={setCurrentTab}
          />
        )}

        {currentTab === 'create-listing' && (
          <CreateListing
            onBack={() => setCurrentTab('listings')}
            onListingCreated={(newId) => handleSelectListing(newId)}
          />
        )}

        {currentTab === 'roommates' && (
          <Roommates
            onConnectUser={() => { }}
            onViewProfile={handleViewProfile}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'connections' && (
          <Connections
            onStartChat={handleStartChat}
            onViewProfile={handleViewProfile}
          />
        )}

        {currentTab === 'messages' && (
          <Messages
            initialPartnerId={chatPartnerId}
          />
        )}

        {currentTab === 'favourites' && (
          <Favourites
            onSelectListing={handleSelectListing}
            setTab={setCurrentTab}
          />
        )}

        {currentTab === 'profile' && (
          <Profile />
        )}

        {currentTab === 'admin' && (
          <Admin />
        )}

        {currentTab === 'crypto-hub' && (
          <SecurityDocs />
        )}
      </main>

      {/* Footer */}
      <Footer setTab={setCurrentTab} />

      {/* Authentication Modal */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authModalMode === 'login' ? 'University Student Login' : 'Register Student Account'}
      >
        {authModalMode === 'login' ? (
          <Login
            onClose={() => setAuthModalOpen(false)}
            onSwitchToRegister={() => {
              setVerifyEmailData(null);
              setAuthModalMode('register');
            }}
            onEmailNeedsVerify={handleEmailNeedsVerify}
          />
        ) : (
          <Register
            onClose={() => setAuthModalOpen(false)}
            onSwitchToLogin={() => setAuthModalMode('login')}
            initialUserId={verifyEmailData?.userId}
            initialEmail={verifyEmailData?.email}
          />
        )}
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
