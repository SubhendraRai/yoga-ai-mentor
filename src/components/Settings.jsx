import { useState } from 'react';
import { WellnessMemory } from '../lib/wellnessMemory';
import { Save, Download, Trash2, LogOut, AlertTriangle } from 'lucide-react';

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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 className="hero-title" style={{ fontSize: '32px', textAlign: 'left', marginBottom: '32px' }}>Settings</h2>

      {/* PROFILE SECTION */}
      <div className="card settings-section">
        <h3>Profile & Preferences</h3>
        <div className="row">
          <div className="field">
            <label>Name</label>
            <input type="text" value={formData.name} onChange={e => updateForm('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Age</label>
            <input type="number" value={formData.age} onChange={e => updateForm('age', e.target.value)} />
          </div>
        </div>
        
        <div className="row">
          <div className="field">
            <label>Occupation</label>
            <input type="text" value={formData.occupation} onChange={e => updateForm('occupation', e.target.value)} />
          </div>
          <div className="field">
            <label>Preferred Session Length (mins)</label>
            <select value={formData.timePerDay} onChange={e => updateForm('timePerDay', e.target.value)}>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="45">45</option>
              <option value="60">60</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Base Stress Level (1-10): {formData.stressLevel}</label>
          <input type="range" min="1" max="10" value={formData.stressLevel} onChange={e => updateForm('stressLevel', e.target.value)} style={{ width: '100%' }} />
        </div>

        <button className="submit-btn" style={{ maxWidth: '200px' }} onClick={handleSaveProfile}>
          <Save size={16} /> {saved ? 'Saved!' : 'Save Profile'}
        </button>
      </div>

      {/* DATA SECTION */}
      <div className="card settings-section">
        <h3>Data Management</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Your wellness data is stored locally in this browser.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={handleExportData}>
            <Download size={16} /> Export My Data (JSON)
          </button>
          <button className="btn-outline" style={{ color: 'var(--error-color)', borderColor: 'rgba(224, 112, 112, 0.3)' }} onClick={() => setShowConfirm(true)}>
            <Trash2 size={16} /> Clear All Wellness Data
          </button>
        </div>
      </div>

      {/* ACCOUNT SECTION */}
      <div className="card settings-section">
        <h3>Account</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>Signed in as {user?.name || 'User'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user?.email || 'Local Session'}</div>
          </div>
          <button className="btn-outline" onClick={onLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error-color)' }}>
              <AlertTriangle size={24} /> Warning
            </h3>
            <p style={{ color: 'var(--text-body)', lineHeight: '1.6', marginBottom: '24px' }}>
              Are you sure you want to delete all your wellness data? This will erase your profile, mood history, completed activities, and AI memory. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button 
                className="submit-btn" 
                style={{ flex: 1, background: 'var(--error-color)', marginTop: 0 }} 
                onClick={handleClearData}
              >
                Yes, Delete Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
