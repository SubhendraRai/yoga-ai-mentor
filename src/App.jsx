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

import { Lock } from 'lucide-react';
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
    const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || 
                          import.meta.env.VITE_SUPABASE_URL.includes('placeholder.supabase.co');

    // Restore guest or mock sessions from local storage immediately on startup
    const stored = localStorage.getItem("yoga_current_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
      } catch (e) {
        console.error(e);
      }
    }

    if (isPlaceholder) {
      setLoading(false);
      return;
    }

    let subscription = null;

    try {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || 'User',
          });
          // Run sync in the background so the UI renders instantly
          WellnessMemory.syncFromCloud().then(() => {
            window.dispatchEvent(new Event('wellness_synced'));
          });
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });

      // Listen for auth changes
      const authListener = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setLoading(true);
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || 'User',
          });
          setLoading(false);
          // Run sync in background
          WellnessMemory.syncFromCloud().then(() => {
            window.dispatchEvent(new Event('wellness_synced'));
          });
        } else {
          // Only clear if not a local guest/mock user
          const currentUserVal = localStorage.getItem("yoga_current_user");
          if (!currentUserVal) {
            setCurrentUser(null);
          }
        }
      });
      subscription = authListener.data.subscription;
    } catch (e) {
      console.error(e);
      setLoading(false);
    }

    // Check sidebar state
    const storedSidebar = localStorage.getItem("yoga_sidebar_collapsed");
    if (storedSidebar === 'true') {
      setSidebarCollapsed(true);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
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
    setCurrentPage('dashboard');
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
              onStartSession={(poses) => {
                setActiveSession(Array.isArray(poses) ? poses : [poses]);
                setCurrentPage('pose'); // Route directly to AI coach!
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
              onStartSession={(poses) => {
                setActiveSession(Array.isArray(poses) ? poses : [poses]);
                setCurrentPage('pose'); // Route directly to AI coach!
              }}
            />
          )}

          {currentPage === 'plan' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <WellnessPlan 
                plan={WellnessMemory.getDailyPlan()} 
                onStartSession={(poses) => {
                  setActiveSession(Array.isArray(poses) ? poses : [poses]);
                  setCurrentPage('pose'); // Route directly to AI coach!
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
          
          {currentPage === 'pose' ? (
            localStorage.getItem("pose_detection_unlocked") === "true" ? (
              <MediaPipePose session={activeSession} initialPoseIndex={0} onExit={() => setCurrentPage('dashboard')} />
            ) : (
              <div className="card" style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center', padding: '40px 32px', borderRadius: '16px' }}>
                <Lock size={48} style={{ color: 'var(--accent-gold)', margin: '0 auto 24px' }} />
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', color: 'var(--text-primary)', marginBottom: '16px', fontWeight: '400' }}>Feature Temporarily Locked</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px' }}>
                  Live AI Pose Detection is currently locked in preparation for an upcoming surprise. 
                  It will be unlocked once the green flag is given!
                </p>
                <button 
                  className="submit-btn" 
                  onClick={() => setCurrentPage('dashboard')}
                  style={{ maxWidth: '200px', margin: '0 auto' }}
                >
                  Back to Dashboard
                </button>
              </div>
            )
          ) : null}
          
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
