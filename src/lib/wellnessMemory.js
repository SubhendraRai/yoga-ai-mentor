import { supabase } from './supabase';

// Helper to generate UUID if crypto.randomUUID is not available
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const WellnessMemory = {
  // Sync flag
  isSyncing: false,

  notifyPersonalizationChange: (reason) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('wellness_personalization_updated', {
      detail: { reason, updatedAt: new Date().toISOString() }
    }));
  },
  
  // Scoping helpers to isolate data by active user
  getUserIdSync: () => {
    try {
      const localUser = JSON.parse(localStorage.getItem("yoga_current_user"));
      if (localUser) return localUser.id || 'guest';
    } catch (e) {}
    return 'guest';
  },

  getScopedKey: (keyName) => {
    const userId = WellnessMemory.getUserIdSync();
    return `wellness_${userId}_${keyName}`;
  },

  getItem: (key) => {
    return localStorage.getItem(WellnessMemory.getScopedKey(key));
  },

  setItem: (key, value) => {
    localStorage.setItem(WellnessMemory.getScopedKey(key), value);
  },

  removeItem: (key) => {
    localStorage.removeItem(WellnessMemory.getScopedKey(key));
  },

  // Current user (async for database operations)
  getUserId: async () => {
    try {
      const localUser = JSON.parse(localStorage.getItem("yoga_current_user"));
      if (localUser && localUser.id === 'guest') return 'guest';
    } catch (e) {}

    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || 'guest';
  },

  // ------------------------------------------------------------------------
  // PROFILE
  // ------------------------------------------------------------------------
  getProfile: () => {
    return JSON.parse(WellnessMemory.getItem('profile')) || null;
  },

  updateProfile: async (updates) => {
    const current = WellnessMemory.getProfile() || {};
    const updated = { ...current, ...updates };
    WellnessMemory.setItem('profile', JSON.stringify(updated));
    WellnessMemory.notifyPersonalizationChange('profile');
    
    // Cloud Sync
    const userId = await WellnessMemory.getUserId();
    if (userId && userId !== 'guest') {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        name: updated.name,
        age: parseInt(updated.age) || null,
        goals: updated.goals || [],
        fitness_level: updated.fitnessLevel || 'beginner',
        schedule: {
          timePerDay: updated.timePerDay,
          preferredTime: updated.preferredTime,
          daysPerWeek: updated.daysPerWeek,
          bedtime: updated.bedtime,
          wakeTime: updated.wakeTime,
          stressLevel: updated.stressLevel
        },
        ai_profile_summary: updated.aiAssessment || null
      });
      if (error) {
        console.error("Supabase Profile Upsert Error:", error);
      }
    }
    return updated;
  },

  isOnboardingComplete: () => {
    return WellnessMemory.getItem('onboarding_complete') === 'true';
  },

  completeOnboarding: async (profileData) => {
    await WellnessMemory.updateProfile(profileData);
    WellnessMemory.setItem('onboarding_complete', 'true');
  },

  // ------------------------------------------------------------------------
  // MOOD
  // ------------------------------------------------------------------------
  logMood: async (level, note) => {
    const entry = { id: generateUUID(), level, note, timestamp: new Date().toISOString() };
    const history = WellnessMemory.getMoodHistory(30);
    history.push(entry);
    WellnessMemory.setItem('mood', JSON.stringify(history));
    WellnessMemory.notifyPersonalizationChange('mood');

    // Cloud Sync
    const userId = await WellnessMemory.getUserId();
    if (userId && userId !== 'guest') {
      await supabase.from('wellness_logs').insert({
        user_id: userId,
        log_type: 'mood',
        value: level,
        note: note
      });
    }
  },

  getMoodHistory: (days = 7) => {
    const history = JSON.parse(WellnessMemory.getItem('mood')) || [];
    if (!days) return history;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return history.filter(h => new Date(h.timestamp) > cutoff);
  },

  getLatestMood: () => {
    const history = WellnessMemory.getMoodHistory(1);
    return history.length > 0 ? history[history.length - 1] : null;
  },

  // ------------------------------------------------------------------------
  // SLEEP
  // ------------------------------------------------------------------------
  logSleep: async (hours, quality) => {
    const entry = { id: generateUUID(), hours, quality, timestamp: new Date().toISOString() };
    const history = WellnessMemory.getSleepHistory(30);
    history.push(entry);
    WellnessMemory.setItem('sleep', JSON.stringify(history));
    WellnessMemory.notifyPersonalizationChange('sleep');

    // Cloud Sync
    const userId = await WellnessMemory.getUserId();
    if (userId && userId !== 'guest') {
      await supabase.from('wellness_logs').insert({
        user_id: userId,
        log_type: 'sleep',
        value: hours,
        note: `Quality: ${quality}/5`
      });
    }
  },

  getSleepHistory: (days = 7) => {
    const history = JSON.parse(WellnessMemory.getItem('sleep')) || [];
    if (!days) return history;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return history.filter(h => new Date(h.timestamp) > cutoff);
  },

  // ------------------------------------------------------------------------
  // ACTIVITIES & STREAK
  // ------------------------------------------------------------------------
  logActivity: async (activityId, type, name, duration) => {
    const entry = { id: activityId, type, name, duration, timestamp: new Date().toISOString() };
    const history = WellnessMemory.getActivityHistory(30);
    history.push(entry);
    WellnessMemory.setItem('activities', JSON.stringify(history));
    WellnessMemory.notifyPersonalizationChange('activity');

    // Cloud Sync
    const userId = await WellnessMemory.getUserId();
    if (userId && userId !== 'guest') {
      await supabase.from('wellness_logs').insert({
        user_id: userId,
        log_type: 'activity',
        value: duration,
        note: `Pose: ${name}`
      });
    }
  },

  getActivityHistory: (days = 7) => {
    const history = JSON.parse(WellnessMemory.getItem('activities')) || [];
    if (!days) return history;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return history.filter(h => new Date(h.timestamp) > cutoff);
  },

  logSessionStats: async (stats) => {
    const entry = { id: generateUUID(), ...stats, timestamp: new Date().toISOString() };
    const history = WellnessMemory.getSessionHistory(30);
    history.push(entry);
    WellnessMemory.setItem('sessions', JSON.stringify(history));
    WellnessMemory.notifyPersonalizationChange('session');

    // Cloud Sync
    const userId = await WellnessMemory.getUserId();
    if (userId && userId !== 'guest') {
      await supabase.from('wellness_logs').insert({
        user_id: userId,
        log_type: 'session_stats',
        value: stats.average_accuracy,
        note: JSON.stringify(stats)
      });
    }
  },

  getSessionHistory: (days = 30) => {
    const history = JSON.parse(WellnessMemory.getItem('sessions')) || [];
    if (!days) return history;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return history.filter(h => new Date(h.timestamp) > cutoff);
  },

  getStreak: () => {
    const history = WellnessMemory.getActivityHistory(30);
    if (history.length === 0) return 0;

    // Extract unique active dates (YYYY-MM-DD)
    const activeDates = [...new Set(history.map(h => h.timestamp.split('T')[0]))].sort().reverse();
    
    let streak = 0;
    let checkDate = new Date(); // Start with today
    
    // Check if today or yesterday is the latest active date
    const todayStr = checkDate.toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (!activeDates.includes(todayStr) && !activeDates.includes(yesterdayStr)) {
      return 0; // Streak broken
    }

    // If active today, count it and move to yesterday
    if (activeDates.includes(todayStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // active yesterday but not today (yet)
      checkDate.setDate(checkDate.getDate() - 1); // check yesterday
    }

    // Keep counting backwards
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (activeDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  },

  // ------------------------------------------------------------------------
  // AI OBSERVATIONS (The Memory System)
  // ------------------------------------------------------------------------
  addObservation: async (text) => {
    const entry = { id: generateUUID(), text, timestamp: new Date().toISOString() };
    const history = WellnessMemory.getObservations();
    history.push(entry);
    // Keep last 100 observations
    if (history.length > 100) history.shift();
    WellnessMemory.setItem('observations', JSON.stringify(history));
    WellnessMemory.notifyPersonalizationChange('observation');

    // Cloud Sync
    const userId = await WellnessMemory.getUserId();
    if (userId && userId !== 'guest') {
      await supabase.from('ai_observations').insert({
        user_id: userId,
        observation: text
      });
    }
  },

  getObservations: () => {
    return JSON.parse(WellnessMemory.getItem('observations')) || [];
  },

  // ------------------------------------------------------------------------
  // WELLNESS SCORE
  // ------------------------------------------------------------------------
  calculateWellnessScore: () => {
    let activityScore = 0;
    let moodScore = 0;
    let sleepScore = 0;
    let streakScore = 0;

    // 1. Activity (25pts): Did they do anything today?
    const todayStr = new Date().toISOString().split('T')[0];
    const activities = WellnessMemory.getActivityHistory(1);
    if (activities.some(a => a.timestamp.startsWith(todayStr))) {
      activityScore = 25; // Simple check for MVP
    } else if (activities.length > 0) {
      activityScore = 10;
    }

    // 2. Mood (25pts): Average of last 3 days
    const moods = WellnessMemory.getMoodHistory(3);
    if (moods.length > 0) {
      const avg = moods.reduce((acc, m) => acc + m.level, 0) / moods.length;
      moodScore = Math.round((avg / 5) * 25);
    } else {
      moodScore = 15; // default
    }

    // 3. Sleep (25pts): 7-9 hours is ideal
    const sleeps = WellnessMemory.getSleepHistory(3);
    if (sleeps.length > 0) {
      const latest = sleeps[sleeps.length - 1];
      if (latest.hours >= 7 && latest.hours <= 9) sleepScore = 25;
      else if (latest.hours >= 6) sleepScore = 18;
      else sleepScore = 10;
    } else {
      sleepScore = 15; // default
    }

    // 4. Streak (25pts): Max out at 7 days
    const streak = WellnessMemory.getStreak();
    streakScore = Math.min(25, (streak / 7) * 25);

    const total = Math.round(activityScore + moodScore + sleepScore + streakScore);

    return { total, activityScore, moodScore, sleepScore, streakScore };
  },

  logScore: (score) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const history = WellnessMemory.getScoreHistory(30);
    
    // Remove if already logged today
    const filtered = history.filter(h => !h.timestamp.startsWith(todayStr));
    filtered.push({ score, timestamp: new Date().toISOString() });
    
    WellnessMemory.setItem('scores', JSON.stringify(filtered));
  },

  getScoreHistory: (days = 7) => {
    const history = JSON.parse(WellnessMemory.getItem('scores')) || [];
    if (!days) return history;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return history.filter(h => new Date(h.timestamp) > cutoff);
  },

  // ------------------------------------------------------------------------
  // CONTEXT COMPILATION (Crucial for Gemini)
  // ------------------------------------------------------------------------
  getContextForAI: () => {
    const profile = WellnessMemory.getProfile();
    let localUser = null;
    try {
      localUser = JSON.parse(localStorage.getItem("yoga_current_user"));
    } catch (e) {}
    const userName = profile?.name || localUser?.name || 'Friend';

    const latestMood = WellnessMemory.getLatestMood();
    const latestSleep = WellnessMemory.getSleepHistory(7).at(-1);
    const recentActivities = WellnessMemory.getActivityHistory(7);
    const latestSession = WellnessMemory.getSessionHistory(7).at(-1);
    const streak = WellnessMemory.getStreak();
    const score = WellnessMemory.calculateWellnessScore();
    const observations = WellnessMemory.getObservations().slice(-5).map(o => o.text);
    const memories = JSON.parse(WellnessMemory.getItem('memories') || '[]').slice(-10);

    let context = `USER PROFILE:\n`;
    context += `Name: ${userName}\n`;
    if (profile) {
      context += `Age: ${profile.age}\n`;
      context += `Occupation: ${profile.occupation}\n`;
      context += `Goals: ${profile.goals?.join(', ')}\n`;
      context += `Fitness Level: ${profile.fitnessLevel}\n`;
      if (profile.healthConditions) context += `Health Conditions: ${profile.healthConditions}\n`;
      context += `Available Time: ${profile.timePerDay} minutes per day, ${profile.daysPerWeek} days a week (prefers ${profile.preferredTime})\n`;
    } else {
      context += `Note: User has not completed detailed onboarding survey yet.\n`;
    }
    
    context += `\nCURRENT STATUS:\n`;
    context += `Wellness Score: ${score.total}/100\n`;
    context += `Activity Streak: ${streak} days\n`;
    if (latestMood) context += `Latest Mood: ${latestMood.level}/5 (${latestMood.note || 'No note'})\n`;
    if (latestSleep) context += `Latest Sleep: ${latestSleep.hours} hours, quality ${latestSleep.quality || 3}/5\n`;
    context += `Movement in last 7 days: ${Math.round(recentActivities.reduce((total, activity) => total + (Number(activity.duration) || 0), 0))} minutes\n`;
    if (latestSession?.average_accuracy) context += `Latest posture-session accuracy: ${latestSession.average_accuracy}%\n`;
    
    if (observations.length > 0) {
      context += `\nAI MEMORY / PAST OBSERVATIONS:\n`;
      observations.forEach(o => { context += `- ${o}\n`; });
    }

    if (memories.length > 0) {
      context += `\nSAVED PERSONAL PREFERENCES AND CONTEXT:\n`;
      memories.forEach(memory => { context += `- ${memory}\n`; });
    }

    return context;
  },

  getPersonalizationFingerprint: () => {
    const profile = WellnessMemory.getProfile() || {};
    const getRecent = (items, fields) => items.map(item =>
      fields.reduce((result, field) => ({ ...result, [field]: item[field] }), {})
    );

    return JSON.stringify({
      profile: {
        goals: profile.goals || [],
        fitnessLevel: profile.fitnessLevel || 'beginner',
        timePerDay: profile.timePerDay || '20',
        healthConditions: profile.healthConditions || '',
        stressLevel: profile.stressLevel || '5',
        preferredTime: profile.preferredTime || '',
        daysPerWeek: profile.daysPerWeek || '',
      },
      mood: getRecent(WellnessMemory.getMoodHistory(7), ['level', 'note', 'timestamp']),
      sleep: getRecent(WellnessMemory.getSleepHistory(7), ['hours', 'quality', 'timestamp']),
      activity: getRecent(WellnessMemory.getActivityHistory(7), ['type', 'name', 'duration', 'timestamp']),
      sessions: getRecent(WellnessMemory.getSessionHistory(7), ['average_accuracy', 'total_time', 'completed_poses', 'timestamp']),
      observations: WellnessMemory.getObservations().slice(-5).map(item => item.text),
      memories: JSON.parse(WellnessMemory.getItem('memories') || '[]').slice(-10),
    });
  },

  // ------------------------------------------------------------------------
  // PLANS & CONVERSATIONS
  // ------------------------------------------------------------------------
  saveDailyPlan: (plan) => {
    const data = { plan, date: new Date().toISOString().split('T')[0] };
    WellnessMemory.setItem('daily_plan', JSON.stringify(data));
  },

  getDailyPlan: () => {
    const dataStr = WellnessMemory.getItem('daily_plan');
    if (!dataStr) return null;
    try {
      const data = JSON.parse(dataStr);
      const todayStr = new Date().toISOString().split('T')[0];
      if (data.date === todayStr) return data.plan;
      return null;
    } catch (e) {
      return null;
    }
  },

  saveConversation: (messages) => {
    // Keep last 20 messages to prevent context window explosion
    const truncated = messages.slice(-20);
    WellnessMemory.setItem('conversation', JSON.stringify(truncated));
  },

  getConversation: () => {
    return JSON.parse(WellnessMemory.getItem('conversation')) || [];
  },

  // ------------------------------------------------------------------------
  // CLOUD SYNC ON LOGIN
  // ------------------------------------------------------------------------
  syncFromCloud: async () => {
    const userId = await WellnessMemory.getUserId();
    if (!userId || userId === 'guest' || userId.startsWith('mock_')) return;

    const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || 
                          import.meta.env.VITE_SUPABASE_URL.includes('placeholder.supabase.co');
    if (isPlaceholder) return;

    const lastSync = WellnessMemory.getItem('last_sync');
    if (lastSync && Date.now() - parseInt(lastSync) < 5 * 60 * 1000) {
      console.log('Skipping cloud sync, last sync was < 5 mins ago');
      return;
    }

    try {
      // Execute all 3 fetches concurrently to speed up login time
      const [profileRes, obsRes, logsRes, memoriesRes] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('ai_observations').select('*').eq('user_id', userId).order('created_at', { ascending: true }).limit(100),
        supabase.from('wellness_logs').select('*').eq('user_id', userId).order('created_at', { ascending: true }).limit(200),
        supabase.from('memories').select('memory').eq('user_id', userId).order('created_at', { ascending: true }).limit(100)
      ]);

      // 1. Process Profile
      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        const profile = profileRes.value.data;
        WellnessMemory.setItem('profile', JSON.stringify({
          name: profile.name,
          age: profile.age,
          goals: profile.goals,
          fitnessLevel: profile.fitness_level,
          timePerDay: profile.schedule?.timePerDay,
          preferredTime: profile.schedule?.preferredTime,
          daysPerWeek: profile.schedule?.daysPerWeek,
          bedtime: profile.schedule?.bedtime,
          wakeTime: profile.schedule?.wakeTime,
          stressLevel: profile.schedule?.stressLevel,
          aiAssessment: profile.ai_profile_summary
        }));
        WellnessMemory.setItem('onboarding_complete', 'true');
      }

      // 2. Process Observations
      if (obsRes.status === 'fulfilled' && obsRes.value.data) {
        const obsLocal = obsRes.value.data.map(o => ({ id: o.id, text: o.observation, timestamp: o.created_at }));
        WellnessMemory.setItem('observations', JSON.stringify(obsLocal));
      }

      // 3. Process Wellness Logs and Merge
      if (logsRes.status === 'fulfilled' && logsRes.value.data) {
        const logs = logsRes.value.data;
        
        // Helper to safely merge cloud data with local data by ID
        const mergeData = (localKey, cloudArray) => {
          const localArray = JSON.parse(WellnessMemory.getItem(localKey)) || [];
          const merged = [...localArray];
          
          cloudArray.forEach(cloudItem => {
            if (!merged.find(localItem => localItem.id === cloudItem.id)) {
              merged.push(cloudItem);
            }
          });
          
          // Sort chronologically
          merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          WellnessMemory.setItem(localKey, JSON.stringify(merged));
        };

        const moods = logs.filter(l => l.log_type === 'mood').map(l => ({ 
          id: l.id, 
          level: l.value, 
          note: l.note || '', 
          timestamp: l.created_at 
        }));
        
        const sleeps = logs.filter(l => l.log_type === 'sleep').map(l => ({ 
          id: l.id, 
          hours: l.value, 
          quality: l.note ? parseInt(l.note.replace(/\D/g, '')) || 3 : 3, 
          timestamp: l.created_at 
        }));

        const activities = logs.filter(l => l.log_type === 'activity').map(l => ({
          id: l.id,
          poseName: l.note ? l.note.replace('Pose: ', '') : 'Yoga',
          duration: l.value,
          timestamp: l.created_at
        }));

        const sessions = logs.filter(l => l.log_type === 'session_stats').map(l => {
          let stats = {};
          try {
            stats = JSON.parse(l.note || '{}');
          } catch {
            stats = {};
          }
          return {
            id: l.id,
            average_accuracy: Number(stats.average_accuracy) || Number(l.value) || 0,
            total_time: Number(stats.total_time) || 0,
            completed_poses: Number(stats.completed_poses) || 0,
            common_mistakes: stats.common_mistakes || [],
            timestamp: l.created_at
          };
        });
        
        mergeData('mood', moods);
        mergeData('sleep', sleeps);
        mergeData('activities', activities);
        mergeData('sessions', sessions);
      }

      if (memoriesRes.status === 'fulfilled' && memoriesRes.value.data) {
        const cloudMemories = memoriesRes.value.data
          .map(entry => entry.memory)
          .filter(Boolean);
        const localMemories = JSON.parse(WellnessMemory.getItem('memories') || '[]');
        WellnessMemory.setItem('memories', [...new Set([...localMemories, ...cloudMemories])].slice(-100));
      }
      
      WellnessMemory.setItem('last_sync', Date.now().toString());
      WellnessMemory.notifyPersonalizationChange('cloud_sync');
    } catch (e) {
      console.error("Failed to sync from cloud", e);
    }
  },

  // ------------------------------------------------------------------------
  // UTILITY
  // ------------------------------------------------------------------------
  clearAllData: () => {
    const userId = WellnessMemory.getUserIdSync();
    const prefix = `wellness_${userId}_`;
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith(prefix)) {
        localStorage.removeItem(k);
      }
    });
  },

  exportData: () => {
    const data = {};
    const userId = WellnessMemory.getUserIdSync();
    const prefix = `wellness_${userId}_`;
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith(prefix)) {
        const cleanKey = k.replace(prefix, 'wellness_');
        try { data[cleanKey] = JSON.parse(localStorage.getItem(k)); } 
        catch (e) { data[cleanKey] = localStorage.getItem(k); }
      }
    });
    return JSON.stringify(data, null, 2);
  }
};
