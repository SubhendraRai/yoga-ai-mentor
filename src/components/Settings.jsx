import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WellnessMemory } from '../lib/wellnessMemory';
import { Save, Download, Trash2, LogOut, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import MotionButton from './motion/MotionButton';
import Reveal from './motion/Reveal';

export default function Settings({ user, onLogout }) {
  const profile = WellnessMemory.getProfile() || {};

  const [formData, setFormData] = useState({
    name: profile.name || '',
    age: profile.age || '',
    occupation: profile.occupation || '',
    timePerDay: profile.timePerDay || '15',
    stressLevel: profile.stressLevel || '5'
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const [identities, setIdentities] = useState([]);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    async function loadUser() {
      if (user?.id === 'guest') {
        setFetchingUser(false);
        return;
      }
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) {
          setIdentities(sbUser.identities || []);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      } finally {
        setFetchingUser(false);
      }
    }
    loadUser();
  }, [user]);

  const isProviderConnected = (provider) => {
    return identities.some(identity => identity.provider === provider);
  };

  const handleLinkIdentity = async (provider) => {
    setAuthError("");
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: window.location.origin + '?page=settings'
        }
      });
      if (error) {
        setAuthError(error.message);
      }
    } catch (err) {
      setAuthError(`Failed to connect ${provider} account.`);
      console.error(err);
    }
  };

  const handleUnlinkIdentity = async (provider) => {
    setAuthError("");
    try {
      const targetIdentity = identities.find(id => id.provider === provider);
      if (!targetIdentity) return;

      if (identities.length <= 1) {
        setAuthError("You cannot unlink your only authentication method.");
        return;
      }

      const { error } = await supabase.auth.unlinkIdentity(targetIdentity);
      if (error) {
        setAuthError(error.message);
      } else {
        setIdentities(prev => prev.filter(id => id.provider !== provider));
      }
    } catch (err) {
      setAuthError(`Failed to disconnect ${provider} account.`);
      console.error(err);
    }
  };

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSaveProfile = () => {
    WellnessMemory.updateProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleExportData = () => {
    const dataStr = WellnessMemory.exportData();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `wellness_data_${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleClearData = () => {
    WellnessMemory.clearAllData();
    window.location.reload(); // Quickest way to reset the app state
  };

  return (
    <div className="max-w-[800px] mx-auto pb-10">
      <Reveal>
        <h2 className="font-display text-[32px] font-medium text-ink mb-8">Settings</h2>
      </Reveal>

      {/* PROFILE SECTION */}
      <Reveal delay={0.05}>
        <SettingsCard title="Profile & Preferences">
          <div className="grid sm:grid-cols-2 gap-4">
            <SField label="Name">
              <input type="text" value={formData.name} onChange={e => updateForm('name', e.target.value)} className="o-input" />
            </SField>
            <SField label="Age">
              <input type="number" value={formData.age} onChange={e => updateForm('age', e.target.value)} className="o-input" />
            </SField>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <SField label="Occupation">
              <input type="text" value={formData.occupation} onChange={e => updateForm('occupation', e.target.value)} className="o-input" />
            </SField>
            <SField label="Preferred Session Length (mins)">
              <select value={formData.timePerDay} onChange={e => updateForm('timePerDay', e.target.value)} className="o-input o-select">
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
              </select>
            </SField>
          </div>

          <SField label={`Base Stress Level (1–10): ${formData.stressLevel}`}>
            <input type="range" min="1" max="10" value={formData.stressLevel} onChange={e => updateForm('stressLevel', e.target.value)} className="w-full accent-moss" />
          </SField>

          <MotionButton onClick={handleSaveProfile} icon={<Save size={16} />}>
            {saved ? 'Saved!' : 'Save profile'}
          </MotionButton>
        </SettingsCard>
      </Reveal>

      {/* SYSTEM SECTION */}
      <Reveal delay={0.1}>
        <SettingsCard title="System & AI">
          <SField label="AI Provider">
            <div className="bg-canvas border border-canvas-deep rounded-xl px-4 py-3 text-[14px] text-text-secondary">
              Google Gemini 2.0 Flash
              <div className="text-[12px] mt-1 text-moss-deep flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                Active (API key loaded from environment)
              </div>
            </div>
          </SField>
        </SettingsCard>
      </Reveal>

      {/* DATA SECTION */}
      <Reveal delay={0.15}>
        <SettingsCard title="Data Management">
          <p className="text-[13px] text-text-secondary mb-4">
            Your wellness data is stored locally in this browser.
          </p>
          <div className="flex gap-4 flex-wrap">
            <MotionButton variant="outline" onClick={handleExportData} icon={<Download size={16} />}>
              Export my data (JSON)
            </MotionButton>
            <MotionButton
              variant="outline"
              onClick={() => setShowConfirm(true)}
              icon={<Trash2 size={16} />}
              className="!text-clay !border-clay/30 hover:!border-clay"
            >
              Clear all wellness data
            </MotionButton>
          </div>
        </SettingsCard>
      </Reveal>

      {/* ACCOUNT SECTION */}
      <Reveal delay={0.2}>
        <SettingsCard title="Account">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-[14px] text-ink font-medium">Signed in as {user?.name || 'User'}</div>
              <div className="text-[12px] text-text-secondary">{user?.email || 'Local Session'}</div>
            </div>
            <MotionButton variant="outline" onClick={onLogout} icon={<LogOut size={16} />}>
              Sign out
            </MotionButton>
          </div>
        </SettingsCard>
      </Reveal>

      {/* CONNECTED ACCOUNTS SECTION */}
      {user?.id !== 'guest' ? (
        <Reveal delay={0.22}>
          <SettingsCard title="Connected Accounts">
            <p className="text-[13px] text-text-secondary mb-5">
              Link your social accounts to sign in with Google or GitHub and sync your progress.
            </p>
            
            {authError && (
              <div className="mb-4 text-clay text-[13px] bg-clay/8 border border-clay/20 rounded-xl py-2 px-3">
                {authError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Google */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GoogleIcon />
                  <div>
                    <div className="text-[14px] text-ink font-medium">Google Account</div>
                    <div className="text-[12px] text-text-secondary">
                      {fetchingUser ? 'Checking...' : isProviderConnected('google') ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>
                {!fetchingUser && (
                  isProviderConnected('google') ? (
                    <MotionButton 
                      variant="outline" 
                      onClick={() => handleUnlinkIdentity('google')}
                      className="!text-clay !border-clay/30 hover:!border-clay"
                    >
                      Disconnect
                    </MotionButton>
                  ) : (
                    <MotionButton 
                      variant="outline" 
                      onClick={() => handleLinkIdentity('google')}
                    >
                      Connect
                    </MotionButton>
                  )
                )}
              </div>
            </div>
          </SettingsCard>
        </Reveal>
      ) : (
        <Reveal delay={0.22}>
          <SettingsCard title="Connected Accounts">
            <div className="bg-canvas border border-canvas-deep rounded-xl px-4 py-4 text-center">
              <p className="text-[14px] text-text-secondary mb-3">
                You are currently browsing in Guest mode. Social account linking and cloud backups are disabled.
              </p>
              <p className="text-[12px] text-moss-deep">
                Create a permanent account to secure your wellness logs and accesspose checking on any device.
              </p>
            </div>
          </SettingsCard>
        </Reveal>
      )}

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[24px] w-full max-w-[440px] p-8 shadow-[0_24px_64px_rgba(31,43,34,0.2)]"
            >
              <h3 className="flex items-center gap-2 font-display text-[22px] text-clay mb-4">
                <AlertTriangle size={22} /> Warning
              </h3>
              <p className="text-text-body text-[14px] leading-relaxed mb-7">
                Are you sure you want to delete all your wellness data? This will erase your profile, mood history, completed activities, and AI memory. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <MotionButton variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
                  Cancel
                </MotionButton>
                <MotionButton
                  className="flex-1 !bg-gradient-to-br !from-clay !to-clay/80 !shadow-[0_4px_20px_rgba(201,139,107,0.3)]"
                  onClick={handleClearData}
                >
                  Yes, delete data
                </MotionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsCard({ title, children }) {
  return (
    <div className="rounded-[28px] bg-white/95 border border-canvas-deep p-7 mb-6 shadow-[0_8px_32px_rgba(31,43,34,0.06)]">
      <h3 className="font-display text-[19px] text-moss-deep mb-5">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function SField({ label, children }) {
  return (
    <div className="mb-5">
      <label className="block text-[11px] uppercase tracking-[0.1em] text-text-secondary font-medium mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);


