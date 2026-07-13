import { getPoseImageUrl } from './poseImages';

// ─── Full Yoga-82 Pose Database (with categories) ───────────────────────────
const POSE_CATALOG = {
  // RESTORATIVE / GENTLE
  childs_pose: { englishName: "Child's Pose", sanskritName: "Balasana", duration: 3, difficulty: "Beginner", categories: ["restorative", "back_pain", "stress", "beginner", "sleep", "anxiety"], shortBenefits: ["Calms the mind", "Relieves back pain", "Gentle hip opener"], steps: ["Kneel on the floor, toes together, knees wide.", "Exhale and lower your torso between your thighs.", "Extend arms forward, forehead to the floor.", "Breathe deeply and hold for 3 minutes."], precautions: ["Avoid with knee injury — place folded blanket under knees if needed."], mistakes: ["Collapsing the chest instead of opening the back."], aiTip: "With every exhale, let your hips melt a little closer to your heels.", fullBenefits: "Deeply calms the nervous system, gently stretches the hips and lower back, and reduces stress and fatigue. An ideal counter-pose and resting posture." },
  cat_cow: { englishName: "Cat-Cow Stretch", sanskritName: "Marjaryasana-Bitilasana", duration: 3, difficulty: "Beginner", categories: ["warmup", "back_pain", "beginner", "flexibility", "stress"], shortBenefits: ["Warms the spine", "Relieves back tension", "Links breath to movement"], steps: ["Start on hands and knees, wrists under shoulders.", "Inhale: drop belly, lift chest and tailbone (Cow).", "Exhale: round spine toward ceiling, tuck chin (Cat).", "Repeat 8-10 breath cycles."], precautions: ["Move slowly; avoid overarching the lower back."], mistakes: ["Moving from the neck instead of the mid-spine."], aiTip: "Let the breath initiate the movement — inhale first, then arch; exhale first, then round.", fullBenefits: "A foundational warmup flow that mobilizes the entire spine, coordinates breath and movement, and gently massages the abdominal organs." },
  savasana: { englishName: "Corpse Pose", sanskritName: "Savasana", duration: 5, difficulty: "Beginner", categories: ["restorative", "stress", "anxiety", "sleep", "beginner"], shortBenefits: ["Deep relaxation", "Reduces blood pressure", "Integrates practice"], steps: ["Lie flat on your back, feet mat-width apart.", "Let arms rest alongside your body, palms up.", "Close your eyes and release all muscular effort.", "Breathe naturally for 5 minutes."], precautions: ["Use a blanket under the knees for lower back discomfort."], mistakes: ["Skipping this essential integration pose."], aiTip: "Release the space between your eyebrows and let your jaw soften completely.", fullBenefits: "Savasana allows the nervous system to integrate the benefits of the entire practice, deeply relaxing the body and mind." },
  legs_up_wall: { englishName: "Legs-Up-The-Wall Pose", sanskritName: "Viparita Karani", duration: 5, difficulty: "Beginner", categories: ["restorative", "sleep", "stress", "anxiety", "back_pain"], shortBenefits: ["Relieves tired legs", "Aids deep sleep", "Calms anxiety"], steps: ["Sit sideways next to a wall.", "Swing legs up as you lower your torso to the floor.", "Adjust distance from wall based on hamstring flexibility.", "Close eyes and breathe deeply for 5 minutes."], precautions: ["Avoid during menstruation; use props if hamstrings are very tight."], mistakes: ["Forcing hips flush against the wall; allow some space."], aiTip: "Place a folded blanket under your lower back for added comfort and elevation.", fullBenefits: "This gentle inversion reverses blood flow, calms the nervous system, aids sleep onset, and relieves anxiety and restlessness." },
  happy_baby: { englishName: "Happy Baby Pose", sanskritName: "Ananda Balasana", duration: 3, difficulty: "Beginner", categories: ["restorative", "stress", "back_pain", "flexibility", "beginner"], shortBenefits: ["Opens hips", "Releases lower back", "Calming"], steps: ["Lie on your back and exhale, drawing knees toward chest.", "Grip the outside edges of your feet.", "Gently pull down to flex hips and open the groin.", "Rock slowly side to side."], precautions: ["Avoid with neck or knee injury."], mistakes: ["Lifting the tailbone off the floor instead of pressing it down."], aiTip: "Keep your shoulder blades pressing gently into the mat as you open the hips.", fullBenefits: "A deeply relaxing hip opener that gently decompresses the lower back and calms the mind." },
  seated_forward_bend: { englishName: "Seated Forward Bend Pose", sanskritName: "Paschimottanasana", duration: 3, difficulty: "Beginner", categories: ["flexibility", "stress", "sleep", "back_pain"], shortBenefits: ["Stretches hamstrings", "Calms mind", "Lengthens spine"], steps: ["Sit with legs extended straight, feet flexed.", "Inhale and lengthen your spine upward.", "Exhale and hinge forward from the hips (not the waist).", "Reach for your feet or shins and breathe."], precautions: ["Keep a slight bend in the knees if hamstrings are very tight."], mistakes: ["Rounding from the lower back instead of hinging from the hips."], aiTip: "Think of bringing your belly toward your thighs rather than your nose to your knees.", fullBenefits: "Stretches the hamstrings, lower back, and spine while stimulating calming parasympathetic response." },
  bridge_pose: { englishName: "Bridge Pose", sanskritName: "Setu Bandha Sarvangasana", duration: 2, difficulty: "Beginner", categories: ["strength", "flexibility", "back_pain", "beginner", "energy"], shortBenefits: ["Strengthens glutes", "Opens chest", "Relieves back pain"], steps: ["Lie on back, knees bent, feet hip-width apart.", "Press feet into the floor and lift hips toward ceiling.", "Clasp hands beneath your body and press arms down.", "Hold and breathe for 30-60 seconds."], precautions: ["Avoid if you have neck injuries; do not turn your head in the pose."], mistakes: ["Splaying the knees outward or squeezing them together too much."], aiTip: "Press equally through all four corners of each foot to build a stable base.", fullBenefits: "Strengthens the glutes, hamstrings, and lower back while opening the chest and hip flexors. Energizes the body and calms mild anxiety." },
  downward_dog: { englishName: "Downward-Facing Dog Pose", sanskritName: "Adho Mukha Svanasana", duration: 2, difficulty: "Beginner", categories: ["strength", "flexibility", "energy", "warmup", "weight_management", "back_pain"], shortBenefits: ["Builds strength", "Stretches hamstrings", "Energizes body"], steps: ["Start on hands and knees, wrists under shoulders.", "Tuck toes, push hips up and back, forming an inverted V.", "Press firmly through all fingers; lengthen the spine.", "Keep knees slightly bent if hamstrings are tight."], precautions: ["Use caution with carpal tunnel or high blood pressure."], mistakes: ["Rounding the upper back instead of creating a long, flat spine."], aiTip: "Prioritize a straight spine over straight legs — bend your knees as much as you need.", fullBenefits: "Builds full-body strength while stretching the hamstrings and calves, improving circulation and leaving the body energized." },
  warrior_i: { englishName: "Warrior I Pose", sanskritName: "Virabhadrasana I", duration: 2, difficulty: "Beginner", categories: ["strength", "energy", "weight_management", "focus"], shortBenefits: ["Builds leg strength", "Opens chest", "Builds focus"], steps: ["Step one foot forward into a lunge, back foot 45° out.", "Square the hips toward the front, bend the front knee.", "Raise arms overhead, shoulder-width apart.", "Gaze forward and breathe steadily."], precautions: ["Avoid with knee or hip injuries; modify the depth of the lunge."], mistakes: ["Allowing the front knee to cave inward."], aiTip: "Ground down through the outer edge of your back foot to build a strong foundation.", fullBenefits: "A powerful standing pose that builds leg strength, opens the chest and hip flexors, and builds mental focus and stamina." },
  warrior_ii: { englishName: "Warrior II Pose", sanskritName: "Virabhadrasana II", duration: 2, difficulty: "Beginner", categories: ["strength", "energy", "weight_management", "focus", "flexibility"], shortBenefits: ["Strengthens legs", "Opens hips", "Increases stamina"], steps: ["Step feet 3-4 feet apart.", "Turn front foot out 90°, back foot slightly in.", "Bend front knee over ankle, extend arms parallel to floor.", "Gaze over front fingertips with a steady, fierce expression."], precautions: ["Modify lunge depth with knee issues."], mistakes: ["Leaning the torso forward over the front leg."], aiTip: "Imagine being pulled equally by both hands — stay perfectly centered.", fullBenefits: "Builds stamina and concentration while deeply stretching the hips, groins, and shoulders and strengthening the legs and core." },
  warrior_iii: { englishName: "Warrior III Pose", sanskritName: "Virabhadrasana III", duration: 2, difficulty: "Intermediate", categories: ["strength", "balance", "focus", "energy"], shortBenefits: ["Full-body strengthener", "Improves balance", "Sharpens focus"], steps: ["Stand tall, shift weight onto one leg.", "Hinge forward from the hip while lifting the back leg.", "Extend arms forward or alongside body.", "Create one long line from heel to fingertips."], precautions: ["Use a wall for balance support if needed."], mistakes: ["Letting the lifted hip open outward — keep both hips level."], aiTip: "Fix your gaze at one point on the floor about 4 feet ahead to stabilize the balance.", fullBenefits: "A comprehensive balancing pose that strengthens the ankles, legs, glutes, and core while sharpening concentration and mental focus." },
  tree_pose: { englishName: "Tree Pose", sanskritName: "Vrksasana", duration: 2, difficulty: "Beginner", categories: ["balance", "focus", "strength", "energy"], shortBenefits: ["Improves balance", "Focuses the mind", "Strengthens core"], steps: ["Stand on your left foot, bend the right knee.", "Place right sole on inner left thigh or calf (not the knee).", "Bring hands to heart center or raise overhead.", "Find a fixed gaze point and breathe steadily."], precautions: ["Practice near a wall if balance is challenged."], mistakes: ["Placing the foot directly on the inner knee joint."], aiTip: "Press your standing foot and planted leg-foot equally against each other to find stability.", fullBenefits: "Develops balance, coordination, and mental focus while strengthening the legs, ankles, and core." },
  cobra_pose: { englishName: "Cobra Pose", sanskritName: "Bhujangasana", duration: 2, difficulty: "Beginner", categories: ["back_pain", "flexibility", "strength", "energy", "beginner"], shortBenefits: ["Strengthens the back", "Opens the chest", "Relieves back pain"], steps: ["Lie face-down, hands under shoulders.", "Inhale and lift your chest using back muscles (not arm push).", "Keep elbows slightly bent and shoulders relaxed.", "Hold 20-30 seconds and release."], precautions: ["Avoid with herniated discs or recent back injury."], mistakes: ["Using arm strength to push up instead of engaging the back muscles."], aiTip: "Keep your navel lightly touching the mat — this is low Cobra, and it's more therapeutic than high Cobra.", fullBenefits: "Gently strengthens the spinal extensors, opens the chest, and counteracts the effects of prolonged sitting." },
  pigeon_pose: { englishName: "Pigeon Pose", sanskritName: "Eka Pada Rajakapotasana", duration: 3, difficulty: "Intermediate", categories: ["flexibility", "stress", "back_pain", "sleep"], shortBenefits: ["Deep hip opener", "Releases emotional tension", "Stretches groin"], steps: ["From Downward Dog, bring right knee behind right wrist.", "Extend left leg straight back.", "Square hips toward the front mat.", "Stay upright or fold forward over front leg."], precautions: ["Place a block under the right hip if it hovers off the floor."], mistakes: ["Collapsing all weight onto the bent-leg hip side."], aiTip: "Breathe directly into any tightness in the hip — use the exhale to soften and release.", fullBenefits: "A powerful hip opener that releases physical and emotional tension stored in the pelvis, increasing flexibility and providing a calming, cathartic effect." },
  chair_pose: { englishName: "Chair Pose", sanskritName: "Utkatasana", duration: 2, difficulty: "Beginner", categories: ["strength", "weight_management", "energy", "focus"], shortBenefits: ["Builds leg strength", "Fires core", "Boosts energy"], steps: ["Stand with feet together, inhale and raise arms overhead.", "Exhale, bend knees and lower as if sitting in a chair.", "Keep chest lifted, weight in the heels.", "Hold for 30-60 seconds, breathing steadily."], precautions: ["Ensure knees track over the second toe and don't pass in front of toes."], mistakes: ["Collapsing the torso forward onto the thighs."], aiTip: "Keep your inner thighs pressing together and pull your lower belly in to support the lower back.", fullBenefits: "Strongly activates the quadriceps, glutes, and core, builds endurance, and generates internal heat." },
  plank_pose: { englishName: "Plank Pose", sanskritName: "Kumbhakasana", duration: 1, difficulty: "Beginner", categories: ["strength", "weight_management", "energy", "focus"], shortBenefits: ["Core strengthener", "Full-body activation", "Builds endurance"], steps: ["Start in a push-up position, arms straight.", "Keep the body in a straight line from head to heels.", "Engage your core, glutes, and quads.", "Breathe steadily and hold for 30-60 seconds."], precautions: ["Drop to knees if shoulder or wrist discomfort arises."], mistakes: ["Letting the hips sag or poke up — maintain a flat body line."], aiTip: "Press the ground away from you through your hands to engage your shoulders and protect the wrists.", fullBenefits: "Builds total-body functional strength, targeting the core, shoulders, arms, and legs simultaneously." },
  low_lunge: { englishName: "Low Lunge Pose", sanskritName: "Anjaneyasana", duration: 2, difficulty: "Beginner", categories: ["flexibility", "back_pain", "strength", "energy", "warmup"], shortBenefits: ["Opens hip flexors", "Stretches groins", "Builds leg strength"], steps: ["Step one foot forward into a deep lunge.", "Lower the back knee to the mat.", "Sink the hips forward and down.", "Raise arms overhead and lift your chest."], precautions: ["Place a folded blanket under the back knee for comfort."], mistakes: ["Letting the front knee collapse inward or jut past the ankle."], aiTip: "Press the top of your back foot into the mat to activate the glute and protect the lower back.", fullBenefits: "Deeply stretches the hip flexors and quadriceps, strengthens the legs and arms, and opens the chest and groin." },
  locust_pose: { englishName: "Locust Pose", sanskritName: "Salabhasana", duration: 2, difficulty: "Beginner", categories: ["back_pain", "strength", "energy"], shortBenefits: ["Strengthens back", "Opens chest", "Counters desk posture"], steps: ["Lie face down, arms alongside body, palms facing up.", "Inhale and lift your chest, arms, and legs simultaneously.", "Squeeze inner thighs together and keep the neck long.", "Hold 20-30 seconds, then release."], precautions: ["Avoid with recent back surgery; keep neck neutral."], mistakes: ["Turning the head to look up, straining the neck."], aiTip: "Imagine someone pulling your legs straight back — lengthen before you lift.", fullBenefits: "Strongly strengthens all spinal extensors and counters the forward-rounding effects of sitting at a desk all day." },
  bound_angle: { englishName: "Bound Angle Pose", sanskritName: "Baddha Konasana", duration: 3, difficulty: "Beginner", categories: ["flexibility", "stress", "sleep", "anxiety"], shortBenefits: ["Opens inner thighs", "Calming", "Improves circulation"], steps: ["Sit on the floor, bring the soles of your feet together.", "Allow knees to drop out to the sides.", "Hold feet with both hands and gently press knees toward floor.", "Sit tall and breathe deeply."], precautions: ["Never force the knees down — let gravity do the work."], mistakes: ["Rounding the lower back instead of maintaining an upright spine."], aiTip: "Think of your knees like butterfly wings — allow them to open with gravity, not force.", fullBenefits: "Opens the inner thighs and groins, stimulates the abdominal organs, and produces a deeply calming effect on the nervous system." },
  garland_pose: { englishName: "Garland Pose", sanskritName: "Malasana", duration: 2, difficulty: "Beginner", categories: ["flexibility", "weight_management", "energy", "back_pain"], shortBenefits: ["Opens hips", "Stretches ankles", "Strengthens groin"], steps: ["Stand feet slightly wider than hip-width, toes angled out.", "Squat deeply, bringing hips toward the floor.", "Press elbows against inner knees, palms in prayer.", "Lengthen the spine and breathe deeply."], precautions: ["Place a folded blanket under heels if they don't reach the floor."], mistakes: ["Rounding the spine — focus on lifting the chest."], aiTip: "Use your elbows to gently create space in your inner thighs as you lengthen your torso upward.", fullBenefits: "A powerful hip and groin opener that also strengthens the ankles and calves and tones the abdominal organs." },
  standing_forward_bend: { englishName: "Standing Forward Bend Pose", sanskritName: "Uttanasana", duration: 2, difficulty: "Beginner", categories: ["flexibility", "stress", "energy", "back_pain", "warmup"], shortBenefits: ["Calms the brain", "Relieves stress", "Stretches hamstrings"], steps: ["Stand with feet hip-width apart.", "Exhale and hinge from the hips, folding forward.", "Bend knees generously if hamstrings are tight.", "Let head hang heavy and breathe."], precautions: ["Come up slowly to avoid dizziness — use bent knees to rise."], mistakes: ["Bending from the waist instead of the hip joint."], aiTip: "Hold opposite elbows and let the weight of your arms gently deepen the release.", fullBenefits: "Stretches the entire back of the body, calms the nervous system, and reverses blood flow gently to refresh the mind." },
  eagle_pose: { englishName: "Eagle Pose", sanskritName: "Garudasana", duration: 2, difficulty: "Intermediate", categories: ["balance", "focus", "flexibility", "stress"], shortBenefits: ["Improves concentration", "Stretches shoulders", "Strengthens legs"], steps: ["Stand and cross right arm under left, palms touching if possible.", "Bend knees and cross right leg over left, hooking the foot.", "Sink the hips and lift the elbows to shoulder height.", "Focus your gaze and breathe steadily."], precautions: ["Use a wall for balance support if needed."], mistakes: ["Letting the standing knee collapse inward."], aiTip: "Press your forearms away from your face while squeezing them together to deepen the shoulder stretch.", fullBenefits: "Simultaneously strengthens the legs and core while deeply stretching the shoulders and upper back. Excellent for mental focus." },
  fish_pose: { englishName: "Fish Pose", sanskritName: "Matsyasana", duration: 2, difficulty: "Beginner", categories: ["flexibility", "stress", "anxiety", "energy", "back_pain"], shortBenefits: ["Opens chest", "Stretches throat", "Counterpose to shoulder stand"], steps: ["Lie on back with legs straight.", "Slide hands under hips, palms down.", "Press elbows into the floor and arch your back, lifting the chest.", "Rest the top of the head lightly on the floor."], precautions: ["Avoid with neck injury; keep weight on elbows, not the head."], mistakes: ["Bearing too much weight on the top of the head."], aiTip: "Keep most of the weight on your elbows — the head barely grazes the floor.", fullBenefits: "Opens the chest and throat, stretches the hip flexors and neck, and can relieve respiratory ailments and mild backaches." },
  half_moon: { englishName: "Half Moon Pose", sanskritName: "Ardha Chandrasana", duration: 2, difficulty: "Intermediate", categories: ["balance", "strength", "focus", "flexibility"], shortBenefits: ["Builds balance", "Strengthens core", "Opens hips"], steps: ["From Warrior II, shift weight to front foot.", "Place fingertips on the floor (or a block) 12 inches forward.", "Lift back leg parallel to the floor, stack hips.", "Open chest toward the ceiling, extend top arm up."], precautions: ["Use a block under the hand to make balance more accessible."], mistakes: ["Letting the standing hip collapse instead of actively stacking hips."], aiTip: "Flex the lifted foot strongly as if pressing it into a wall — this stabilizes the pose.", fullBenefits: "Builds single-leg balance and full-body coordination while strengthening the core and opening the hips and chest." },
  wind_relieving: { englishName: "Wind Relieving Pose", sanskritName: "Pawanmuktasana", duration: 2, difficulty: "Beginner", categories: ["back_pain", "stress", "sleep", "beginner", "anxiety"], shortBenefits: ["Relieves lower back tension", "Aids digestion", "Relaxing"], steps: ["Lie on your back and draw both knees to your chest.", "Wrap arms around shins and hug knees tightly.", "Rock gently from side to side to massage the lower back.", "Breathe deeply and relax the back into the floor."], precautions: ["Avoid with recent abdominal surgery."], mistakes: ["Lifting the head and neck, causing neck strain."], aiTip: "Let the weight of your arms do all the work — your back muscles should be completely passive.", fullBenefits: "Releases tension in the lower back, gently compresses the abdominal organs to aid digestion, and is profoundly relaxing." },
};

// ─── Goal → Pose Category Mapping ────────────────────────────────────────────
const GOAL_CATEGORY_MAP = {
  'Stress Relief':       ['stress', 'restorative', 'anxiety'],
  'Anxiety Management':  ['anxiety', 'restorative', 'stress'],
  'Flexibility':         ['flexibility', 'warmup'],
  'Weight Management':   ['weight_management', 'strength', 'energy'],
  'Better Sleep':        ['sleep', 'restorative', 'anxiety'],
  'Build Strength':      ['strength', 'energy'],
  'Better Focus':        ['focus', 'balance', 'energy'],
  'More Energy':         ['energy', 'strength'],
  'Pain Relief':         ['back_pain', 'restorative', 'flexibility'],
  'Meditation':          ['restorative', 'stress', 'anxiety'],
};

// ─── Time → Pose Count Mapping ────────────────────────────────────────────────
function getPoseCountForDuration(timePerDay) {
  const mins = parseInt(timePerDay) || 20;
  if (mins <= 10) return 3;
  if (mins <= 20) return 4;
  if (mins <= 30) return 5;
  if (mins <= 45) return 6;
  return 8;
}

// ─── Main Plan Generator ─────────────────────────────────────────────────────
export function generateRuleBasedPlan(profile, moodHistory, sleepHistory) {
  const name = profile?.name || 'friend';
  const goals = profile?.goals || [];
  const fitnessLevel = profile?.fitnessLevel || 'beginner';
  const timePerDay = profile?.timePerDay || '20';
  const healthConditions = (profile?.healthConditions || '').toLowerCase();
  const stressLevel = parseInt(profile?.stressLevel) || 5;

  // ── 1. Contextual overrides (highest priority) ──
  const recentSleep = sleepHistory?.length > 0 ? sleepHistory[sleepHistory.length - 1] : null;
  const recentMood = moodHistory?.length > 0 ? moodHistory[moodHistory.length - 1] : null;
  const isLowSleep = recentSleep && recentSleep.hours < 6;
  const isLowMood = recentMood && recentMood.level <= 2;
  const isHighStress = stressLevel >= 7;
  const hasBackPain = healthConditions.includes('back') || healthConditions.includes('spine') || healthConditions.includes('lumbar');

  // ── 2. Determine primary + secondary focus categories ──
  let primaryCategories = [];
  let message = '';
  let dayTheme = 'balance';

  if (isLowSleep) {
    primaryCategories = ['restorative', 'back_pain', 'stress'];
    message = `${name}, your body needs recovery today — you haven't had enough sleep. This gentle restorative flow will calm your nervous system and let you rest without exhaustion.`;
    dayTheme = 'recovery';
  } else if (isLowMood) {
    primaryCategories = ['stress', 'anxiety', 'restorative'];
    message = `${name}, I can see you've been feeling low. This nurturing flow is designed to open your chest, release tension from the hips, and gently bring your energy back up. You're not alone in this.`;
    dayTheme = 'lift';
  } else if (hasBackPain) {
    primaryCategories = ['back_pain', 'flexibility', 'restorative'];
    message = `${name}, since you've mentioned back issues, today's sequence prioritizes spinal decompression, gentle back strengthening, and core activation. Always listen to your body and never push through sharp pain.`;
    dayTheme = 'back_care';
  } else if (goals.length > 0) {
    // Build category pool from user goals
    const categoryPool = new Set();
    for (const goal of goals) {
      const cats = GOAL_CATEGORY_MAP[goal] || [];
      cats.forEach(c => categoryPool.add(c));
    }
    primaryCategories = [...categoryPool];

    // Craft a personalised message based on their primary goal
    const primaryGoal = goals[0];
    if (primaryGoal === 'Stress Relief' || primaryGoal === 'Anxiety Management') {
      message = `${name}, today's flow is designed around your goal of ${primaryGoal.toLowerCase()}. We start with grounding movements to calm your nervous system and end with deep restoration.`;
    } else if (primaryGoal === 'Flexibility') {
      message = `${name}, let's work on opening you up! Today's flow targets deep stretches and joint mobility aligned with your flexibility goal.`;
    } else if (primaryGoal === 'Build Strength' || primaryGoal === 'Weight Management') {
      message = `${name}, today's sequence is energizing and challenging. We're building functional strength across all major muscle groups — stay with your breath!`;
    } else if (primaryGoal === 'Better Sleep') {
      message = `${name}, we're preparing your body and mind for deeper sleep tonight. This sequence activates the parasympathetic system and gently releases the tensions of the day.`;
    } else if (primaryGoal === 'Better Focus' || primaryGoal === 'Meditation') {
      message = `${name}, today's flow emphasizes balance poses and breath work to sharpen your mental clarity and bring you into a deeply focused state.`;
    } else if (primaryGoal === 'Pain Relief') {
      message = `${name}, this therapeutic sequence focuses on decompressing and strengthening the areas causing discomfort, always staying within safe, comfortable limits.`;
    } else if (primaryGoal === 'More Energy') {
      message = `${name}, let's wake your body up! This energizing sequence builds heat, increases circulation, and leaves you feeling vibrant and alive.`;
    } else {
      message = `${name}, here's a well-rounded flow tailored to your goals of ${goals.slice(0, 2).join(' and ').toLowerCase()}.`;
    }
    dayTheme = 'goals';
  } else {
    primaryCategories = ['warmup', 'flexibility', 'strength', 'restorative'];
    message = `${name}, here is your balanced wellness flow for today — a thoughtful mix of movement, strength, and restoration.`;
    dayTheme = 'balanced';
  }

  // ── 3. Filter poses by fitness level ──
  const DIFFICULTY_MAP = {
    beginner:     ['Beginner'],
    intermediate: ['Beginner', 'Intermediate'],
    advanced:     ['Beginner', 'Intermediate', 'Advanced'],
  };
  const allowedDifficulties = DIFFICULTY_MAP[fitnessLevel] || ['Beginner'];

  // ── 4. Score and rank poses by relevance ──
  const scoredPoses = Object.entries(POSE_CATALOG)
    .filter(([_, pose]) => allowedDifficulties.includes(pose.difficulty))
    .map(([id, pose]) => {
      let score = 0;
      for (const cat of pose.categories) {
        if (primaryCategories.includes(cat)) score += 3;
      }
      // Penalise back_pain poses if no back condition
      if (pose.categories.includes('back_pain') && !hasBackPain && dayTheme !== 'back_care' && dayTheme !== 'recovery') {
        score -= 1;
      }
      // Always include a restorative/savasana at the end
      if (id === 'savasana') score += 2;
      return { id, pose, score };
    })
    .sort((a, b) => b.score - a.score);

  // ── 5. Select the right number of poses for the user's time commitment ──
  const poseCount = getPoseCountForDuration(timePerDay);
  
  // Always end with savasana; select the rest from top scorers
  const savasanaEntry = scoredPoses.find(p => p.id === 'savasana');
  const otherPoses = scoredPoses.filter(p => p.id !== 'savasana').slice(0, poseCount - 1);
  
  const selectedPoses = [...otherPoses, savasanaEntry].filter(Boolean).map(({ id, pose }) => ({
    id,
    englishName: pose.englishName,
    sanskritName: pose.sanskritName,
    duration: pose.duration,
    difficulty: pose.difficulty,
    shortBenefits: pose.shortBenefits,
    fullBenefits: pose.fullBenefits,
    steps: pose.steps,
    precautions: pose.precautions,
    mistakes: pose.mistakes,
    aiTip: pose.aiTip,
    imageUrl: getPoseImageUrl(pose.englishName),
  }));

  // ── 6. Append high-stress note if relevant ──
  if (isHighStress && dayTheme !== 'recovery' && dayTheme !== 'lift') {
    message += ` I noticed your stress level is high — take extra time in each pose and prioritize breath over depth.`;
  }

  return { message, poses: selectedPoses };
}
