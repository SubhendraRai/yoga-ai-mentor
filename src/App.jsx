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
  const [poseCheckPose, setPoseCheckPose] = useState(null);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
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
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || 'User',
        });
        // Sync down cloud memory for this user
        await WellnessMemory.syncFromCloud();
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

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    // Note: We don't need to force navigation here. The render logic
    // will automatically show Onboarding if needed, or Dashboard.
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
      <Sidebar 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
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
