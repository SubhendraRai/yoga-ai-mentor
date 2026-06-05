import { YOGA_LIBRARY } from '../data/yogaLibrary';

export function generateRuleBasedPlan(profile, moodHistory, sleepHistory) {
  let focus = 'balanced';
  let message = "Here is a balanced sequence to keep your energy flowing and your body agile.";
  
  // 1. Analyze Sleep
  const recentSleep = sleepHistory && sleepHistory.length > 0 ? sleepHistory[sleepHistory.length - 1] : null;
  if (recentSleep && recentSleep.hours < 6) {
    focus = 'restorative';
    message = "I noticed you didn't sleep much last night. Let's do a gentle, restorative flow to help your body recover and calm your nervous system without exhausting you.";
  }
  
  // 2. Analyze Mood
  const recentMood = moodHistory && moodHistory.length > 0 ? moodHistory[moodHistory.length - 1] : null;
  if (focus !== 'restorative' && recentMood && recentMood.level <= 2) {
    focus = 'calming';
    message = "It seems like you've been feeling a bit low. This calming sequence is designed to gently open your chest, release tension, and center your mind.";
  }

  // 3. Analyze Profile Goals
  if (focus === 'balanced' && profile) {
    if (profile.goals?.includes('Flexibility')) {
      focus = 'flexibility';
      message = "Based on your goal to improve flexibility, today's sequence focuses on deep stretching and safely opening up tight muscles.";
    } else if (profile.goals?.includes('Strength')) {
      focus = 'strength';
      message = "Let's build some fire! This sequence is designed to challenge your stamina and build functional strength.";
    }
  }

  // Select Poses based on Focus
  let selectedIds = [];
  
  if (focus === 'restorative') {
    selectedIds = ['childs_pose', 'savasana', 'legs_up_wall'];
  } else if (focus === 'calming') {
    selectedIds = ['childs_pose', 'cat_cow', 'downward_dog', 'savasana'];
  } else if (focus === 'flexibility') {
    selectedIds = ['downward_dog', 'tree_pose', 'pigeon_pose', 'savasana'];
  } else if (focus === 'strength') {
    selectedIds = ['downward_dog', 'warrior_ii', 'tree_pose', 'savasana'];
  } else {
    selectedIds = ['cat_cow', 'downward_dog', 'warrior_ii', 'savasana']; // balanced
  }

  // Map IDs to full library objects
  const poses = selectedIds.map(id => YOGA_LIBRARY[id]);

  return {
    message,
    poses
  };
}
