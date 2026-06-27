import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import CameraLockScreen from './components/CameraLockScreen';
import PageTransition from './components/motion/PageTransition';
import MotionButton from './components/motion/MotionButton';

import { Lock, Menu, X, Sparkles } from 'lucide-react';
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
  const [profile, setProfile] = useState(null);
  const [showUnlockToast, setShowUnlockToast] = useState(false);

  useEffect(() => {
    // Handle URL routing from OAuth redirects
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    if (pageParam) {
      setCurrentPage(pageParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check initial auth state
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
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
        setCurrentUser(null);
        setProfile(null);
      }
    });

    // Load initial profile
    setProfile(WellnessMemory.getProfile());

    // Listeners for profile updates
    const handleProfileUpdate = (e) => {
      setProfile(e.detail);
    };

    const handleSync = () => {
      setProfile(WellnessMemory.getProfile());
    };

    const handleCameraUnlocked = () => {
      setShowUnlockToast(true);
      // Auto hide toast after 8 seconds
      setTimeout(() => {
        setShowUnlockToast(false);
      }, 8000);
    };

    window.addEventListener('wellness_profile_updated', handleProfileUpdate);
    window.addEventListener('wellness_synced', handleSync);
    window.addEventListener('camera_unlocked', handleCameraUnlocked);

    // Check sidebar state
    const storedSidebar = localStorage.getItem("yoga_sidebar_collapsed");
    if (storedSidebar === 'true') {
      setSidebarCollapsed(true);
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('wellness_profile_updated', handleProfileUpdate);
      window.removeEventListener('wellness_synced', handleSync);
      window.removeEventListener('camera_unlocked', handleCameraUnlocked);
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
    setCurrentUser(null);
  };

  const handleToggleSidebar = () => {
    const newVal = !sidebarCollapsed;
    setSidebarCollapsed(newVal);
    localStorage.setItem("yoga_sidebar_collapsed", newVal.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas relative overflow-hidden">
        <div className="ambient-bg">
          <div className="ambient-orb ambient-orb--mist" />
          <div className="ambient-orb ambient-orb--moss" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <motion.div
            className="w-10 h-10 rounded-full border-2 border-canvas-deep border-t-moss"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: [0.45, 0, 0.2, 1] }}
            className="text-[13px] text-text-secondary tracking-[0.04em]"
          >
            Entering sanctuary…
          </motion.span>
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
    <div className="flex min-h-screen bg-canvas relative">
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb--mist" />
        <div className="ambient-orb ambient-orb--moss" />
        <div className="ambient-orb ambient-orb--clay" />
      </div>

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
      <motion.button 
        className="mobile-fab" 
        style={{ display: 'none' }} // default hidden, overridden by media query
        onClick={() => setMobileMenuOpen(true)}
        whileTap={{ scale: 0.9 }}
      >
        <Menu size={24} />
      </motion.button>

      {/* Mobile Overlay Menu */}
      <div className={`mobile-overlay-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ position: 'absolute', top: '32px', right: '32px' }}>
          <motion.button
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="w-10 h-10 rounded-full border border-canvas-deep bg-white flex items-center justify-center text-text-secondary hover:text-moss-deep"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={22} />
          </motion.button>
        </div>
        
        <div style={{ marginBottom: '48px', color: 'var(--color-moss)', fontFamily: "'Fraunces', serif", fontSize: '28px' }}>
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
            style={{ color: 'var(--color-clay)', marginTop: '24px' }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <main className="main-content relative z-10" style={{ marginLeft: sidebarCollapsed ? '60px' : '240px' }}>
        <div className="main-content-inner">
          <PageTransition pageKey={currentPage}>
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
            currentUser?.id === 'guest' ? (
              <div className="rounded-[28px] bg-white/95 border border-canvas-deep p-10 max-w-[600px] mx-auto mt-24 text-center shadow-[0_8px_32px_rgba(31,43,34,0.06)]">
                <Lock size={44} className="text-moss mx-auto mb-6" />
                <h2 className="font-display text-[26px] text-ink mb-4">Live Coaching Locked</h2>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  Guest accounts cannot access the advanced live computer vision and voice coaching features. 
                  Please sign up for a free account to unlock your personalized posture tracking!
                </p>
                <MotionButton onClick={() => handleLogout()}>Sign Up Now</MotionButton>
              </div>
            ) : !profile?.camera_access ? (
              <CameraLockScreen profile={profile} onBack={() => setCurrentPage('dashboard')} />
            ) : (
              <MediaPipePose session={activeSession} initialPoseIndex={0} onExit={() => setCurrentPage('dashboard')} />
            )
          ) : null}
          
          {currentPage === 'chat' && <MentorChat currentUser={currentUser} />}
          
          {currentPage === 'mood' && (
            <div style={{ padding: '40px 0' }}>
              <MoodTracker />
            </div>
          )}
          
          {currentPage === 'settings' && <Settings user={currentUser} onLogout={handleLogout} />}
          </PageTransition>
        </div>
      </main>

      <AnimatePresence>
        {showUnlockToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-[480px] bg-[#13131a]/95 border-2 border-accent-gold rounded-2xl p-6 shadow-[0_20px_50px_rgba(196,169,106,0.3)] backdrop-blur-md flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-full bg-accent-gold-dim flex items-center justify-center border border-accent-gold/20 shrink-0">
              <Sparkles className="text-accent-gold" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-text-primary mb-1">
                🎉 Early Access Unlocked
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed mb-3">
                You've maintained a 7-day wellness streak and completed 10 yoga sessions.
              </p>
              <p className="text-xs text-accent-gold font-medium">
                AI Pose Detection is now available in your account.
              </p>
            </div>
            <button 
              onClick={() => setShowUnlockToast(false)}
              className="text-text-secondary hover:text-text-primary transition-colors text-xs p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
