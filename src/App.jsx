import { useState, useEffect } from 'react';
import { WellnessMemory } from './lib/wellnessMemory';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WellnessPlan from './components/WellnessPlan';
import YogaSession from './components/YogaSession';
import MediaPipePose from './components/MediaPipePose';
import MentorChat from './components/MentorChat';
import MoodTracker from './components/MoodTracker';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import PoseDetail from './components/PoseDetail';

import { supabase } from './lib/supabase';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [poseCheckPose, setPoseCheckPose] = useState(null);
  const [selectedPose, setSelectedPose] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Await sync BEFORE showing the app to ensure onboarding flag is set
        await WellnessMemory.syncFromCloud();
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || 'User',
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setLoading(true);
        await WellnessMemory.syncFromCloud();
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || 'User',
        });
        setLoading(false);
      } else {
        setCurrentUser(null);
      }
    });

    // Check sidebar state
    const storedSidebar = localStorage.getItem("yoga_sidebar_collapsed");
    if (storedSidebar === 'true') {
      setSidebarCollapsed(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = async (user) => {
    setLoading(true);
    await WellnessMemory.syncFromCloud();
    setCurrentUser(user);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("yoga_current_user");
    setCurrentUser(null);
  };

  const handleToggleSidebar = () => {
    const newVal = !sidebarCollapsed;
    setSidebarCollapsed(newVal);
    localStorage.setItem("yoga_sidebar_collapsed", newVal.toString());
  };

  if (loading) {
    return (
      <div className="app-fullscreen" style={{ justifyContent: "center" }}>
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Entering sanctuary...</span>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in, but needs onboarding
  if (!WellnessMemory.isOnboardingComplete()) {
    return <Onboarding user={currentUser} onComplete={() => setCurrentPage('dashboard')} />;
  }

  // Fully authenticated and onboarded - Main Layout
  
  // Icons for mobile menu
  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'plan', label: "Today's Plan" },
    { id: 'yoga', label: 'Yoga Session' },
    { id: 'pose', label: 'Live Pose Check' },
    { id: 'chat', label: 'Talk to Mentor' },
    { id: 'mood', label: 'Mood & Journal' },
  ];

  return (
    <div className="app-layout">
      {/* Desktop Sidebar (hidden on mobile via CSS) */}
      <Sidebar 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
      {/* Mobile FAB (hidden on desktop via CSS) */}
      <button 
        className="mobile-fab" 
        style={{ display: 'none' }} // default hidden, overridden by media query
        onClick={() => setMobileMenuOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>

      {/* Mobile Overlay Menu */}
      <div className={`mobile-overlay-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ position: 'absolute', top: '32px', right: '32px' }}>
          <button className="btn-icon" onClick={() => setMobileMenuOpen(false)} style={{ border: 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div style={{ marginBottom: '48px', color: 'var(--accent-gold)', fontFamily: "'Cormorant Garamond', serif", fontSize: '28px' }}>
          Yogtatva
        </div>

        <div className="mobile-nav-items">
          {mobileNavItems.map(item => (
            <button 
              key={item.id} 
              className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentPage(item.id);
                setMobileMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
          <button 
            className="mobile-nav-item" 
            style={{ color: 'var(--error-color)', marginTop: '24px' }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <main className="main-content" style={{ marginLeft: sidebarCollapsed ? '60px' : '240px' }}>
        <div className="main-content-inner">
          {currentPage === 'dashboard' && (
            <Dashboard 
              onNavigate={setCurrentPage} 
              onStartSession={(pose) => {
                setActiveSession([pose]);
                setCurrentPage('yoga');
              }}
              onLearnMore={(pose) => {
                setSelectedPose(pose);
                setCurrentPage('pose_detail');
              }}
            />
          )}
          
          {currentPage === 'pose_detail' && (
            <PoseDetail 
              pose={selectedPose} 
              onBack={() => setCurrentPage('dashboard')} 
              onStartSession={(pose) => {
                setActiveSession([pose]);
                setCurrentPage('yoga');
              }}
            />
          )}

          {currentPage === 'plan' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <WellnessPlan 
                plan={WellnessMemory.getDailyPlan()} 
                onStartSession={(pose) => {
                  setActiveSession([pose]);
                  setCurrentPage('yoga');
                }}
                onLearnMore={(pose) => {
                  setSelectedPose(pose);
                  setCurrentPage('pose_detail');
                }}
              />
            </div>
          )}
          
          {currentPage === 'yoga' && (
            <YogaSession 
              session={activeSession}
              onStartPoseCheck={(poseName) => { 
                setPoseCheckPose(poseName); 
                setCurrentPage('pose'); 
              }} 
              onComplete={() => setCurrentPage('dashboard')} 
            />
          )}
          
          {currentPage === 'pose' && <MediaPipePose initialPose={poseCheckPose} onExit={() => setCurrentPage('yoga')} />}
          
          {currentPage === 'chat' && <MentorChat currentUser={currentUser} />}
          
          {currentPage === 'mood' && (
            <div style={{ padding: '40px 0' }}>
              <MoodTracker />
            </div>
          )}
          
          {currentPage === 'settings' && <Settings user={currentUser} onLogout={handleLogout} />}
        </div>
      </main>
    </div>
  );
}
