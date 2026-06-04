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

import { supabase } from './lib/supabase';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [poseCheckPose, setPoseCheckPose] = useState(null);

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
  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <div className="mobile-header" style={{ display: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 500 }}>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%234A5D4E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='16.39 21 21 16.39 21 7.61 16.39 3 7.61 3 3 7.61 3 16.39 7.61 21 16.39 21'%3E%3C/polygon%3E%3Cpath d='m16.71 13.88-3.41 3.41a2 2 0 0 1-2.82 0l-3.41-3.41'%3E%3C/path%3E%3C/svg%3E" alt="Logo" /> Yogtatva
        </div>
        <button className="btn-icon" onClick={() => setMobileMenuOpen(true)} style={{ border: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
      </div>

      <Sidebar 
        currentPage={currentPage}
        onNavigate={(page) => { setCurrentPage(page); setMobileMenuOpen(false); }}
        user={currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      
      {mobileMenuOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      <main className="main-content" style={{ marginLeft: sidebarCollapsed ? '60px' : '240px' }}>
        <div className="main-content-inner">
          {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
          
          {currentPage === 'plan' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <WellnessPlan plan={WellnessMemory.getDailyPlan()} />
            </div>
          )}
          
          {currentPage === 'yoga' && (
            <YogaSession 
              onStartPoseCheck={(pose) => { 
                setPoseCheckPose(pose); 
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
