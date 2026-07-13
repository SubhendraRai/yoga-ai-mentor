/**
 * poseMath.js — Atlas-Based Real-Time Pose Comparison Engine
 *
 * Compares live MediaPipe landmarks against reference baselines extracted
 * from the Yoga-82 dataset using the MediaPipe Heavy Pose Landmarker.
 *
 * Strategy:
 *  1. Normalize both live and reference landmarks by centering on the hip
 *     midpoint and scaling by torso height — making comparison camera/distance invariant.
 *  2. Compute per-joint 3D Euclidean distance between live and ideal positions.
 *  3. Bucket joints into anatomical clusters (Spine, Hips, Shoulders, Knees, Arms).
 *  4. Convert distances to accuracy % and generate human-readable correction messages.
 */

import POSE_BASELINES from '../data/poseBaselines.json';

// ─── Joint Cluster Definitions ────────────────────────────────────────────────
const JOINT_CLUSTERS = {
  Hips:      [23, 24],
  Shoulders: [11, 12],
  Knees:     [25, 26],
  Ankles:    [27, 28],
  Elbows:    [13, 14],
  Wrists:    [15, 16],
  Spine:     [11, 12, 23, 24],   // shoulder–hip alignment = spinal uprightness
};

// Joint names for user-readable messages
const JOINT_NAMES = {
  11: 'left shoulder', 12: 'right shoulder',
  13: 'left elbow',    14: 'right elbow',
  15: 'left wrist',    16: 'right wrist',
  23: 'left hip',      24: 'right hip',
  25: 'left knee',     26: 'right knee',
  27: 'left ankle',    28: 'right ankle',
};

// ─── Pose ID aliases (handle naming differences) ─────────────────────────────
const POSE_ID_ALIAS = {
  warrior_ii:   'warrior_2',
  warrior_2:    'warrior_2',
  warrior_i:    'warrior_i',
  warrior_iii:  'warrior_iii',
  downward_dog: 'downward_dog',
  tree_pose:    'tree_pose',
  cat_cow:      'cat_cow',
  savasana:     'savasana',
  childs_pose:  'childs_pose',
  bridge_pose:  'bridge_pose',
  cobra_pose:   'cobra_pose',
  chair_pose:   'chair_pose',
  plank_pose:   'plank_pose',
  eagle_pose:   null,  // extraction failed — fall back to angle-based
  locust_pose:  'locust_pose',
  pigeon_pose:  'pigeon_pose',
  low_lunge:    'low_lunge',
  seated_forward_bend: 'seated_forward_bend',
  standing_forward_bend: 'standing_forward_bend',
  bound_angle:  'bound_angle',
  garland_pose: 'garland_pose',
  fish_pose:    'fish_pose',
  happy_baby:   'happy_baby',
  wind_relieving: 'wind_relieving',
};

// ─── Normalization ────────────────────────────────────────────────────────────
/**
 * Normalizes a 33-point landmark array to be:
 * - Centered at the hip midpoint (landmark 23 & 24 average)
 * - Scaled by torso height (distance from hip center to shoulder center)
 *
 * This makes comparison invariant to distance from camera and body size.
 */
function normalizeLandmarks(landmarks) {
  const lHip = landmarks[23];
  const rHip = landmarks[24];
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];

  if (!lHip || !rHip || !lShoulder || !rShoulder) return null;

  const hipCx = (lHip.x + rHip.x) / 2;
  const hipCy = (lHip.y + rHip.y) / 2;
  const hipCz = ((lHip.z || 0) + (rHip.z || 0)) / 2;

  const shoulderCx = (lShoulder.x + rShoulder.x) / 2;
  const shoulderCy = (lShoulder.y + rShoulder.y) / 2;
  const shoulderCz = ((lShoulder.z || 0) + (rShoulder.z || 0)) / 2;

  const torsoHeight = Math.sqrt(
    (shoulderCx - hipCx) ** 2 +
    (shoulderCy - hipCy) ** 2 +
    (shoulderCz - hipCz) ** 2
  );

  if (torsoHeight < 0.01) return null; // degenerate frame

  return landmarks.map(lm => ({
    x: (lm.x - hipCx) / torsoHeight,
    y: (lm.y - hipCy) / torsoHeight,
    z: ((lm.z || 0) - hipCz) / torsoHeight,
    visibility: lm.visibility,
  }));
}

// ─── 3D Euclidean Distance ────────────────────────────────────────────────────
/**
 * Computes the 3D Euclidean distance between two normalized landmark points.
 */
function euclidean3D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

// ─── Distance → Accuracy Mapping ─────────────────────────────────────────────
/**
 * Maps a per-joint Euclidean distance in normalized space to an accuracy %.
 * Threshold tuned for normalized torso-scaled coordinates:
 *   distance = 0.0  → 100% (perfect)
 *   distance = 0.25 → 50%  (moderate error)
 *   distance = 0.5+ → 0%   (completely off)
 */
function distanceToAccuracy(distance, maxDist = 0.5) {
  return Math.max(0, Math.round(100 - (distance / maxDist) * 100));
}

// ─── Correction Message Generator ────────────────────────────────────────────
const CORRECTION_MESSAGES = {
  Hips: {
    RAISE:      'Lift your hips higher — press your sit bones up toward the ceiling.',
    LOWER:      'Sink your hips a little lower into the pose.',
    FORWARD:    'Shift your hips slightly forward to align over your feet.',
    BACK:       'Draw your hips back to stack over your ankles.',
    WIDEN:      'Allow your hips to open wider.',
    NARROW:     'Draw your hips closer together.',
  },
  Shoulders: {
    RAISE:      'Lift your arms — bring your shoulders up toward your ears slightly.',
    LOWER:      'Roll your shoulders down and away from your ears.',
    OPEN:       'Open your chest — draw your shoulder blades together.',
    FORWARD:    'Your shoulders are rounding forward — press them back gently.',
    EXTEND:     'Extend your arms fully out to the sides at shoulder height.',
  },
  Knees: {
    BEND_MORE:  'Bend your front knee deeper to roughly 90 degrees.',
    STRAIGHTEN: 'Straighten your back leg fully.',
    TRACK:      'Make sure your knee tracks directly over your second toe.',
  },
  Spine: {
    LENGTHEN:   'Lengthen your spine — grow tall from your tailbone to the crown of your head.',
    STRAIGHTEN: 'Keep your spine long and neutral — avoid rounding your lower back.',
    FORWARD:    'Hinge forward from your hips, not your waist — spine stays long.',
  },
  Elbows: {
    EXTEND:     'Straighten your elbows — reach fully through your fingertips.',
    BEND:       'Allow a soft bend in your elbows.',
  },
  Wrists: {
    EXTEND:     'Reach your arms fully through to your fingertips.',
  },
  Ankles: {
    PRESS:      'Press through the outer edge of your back foot firmly into the mat.',
    HEEL:       'Press your heels gently toward the floor.',
  },
};

function generateCorrectionMessage(cluster, live, ideal) {
  // Determine directional error from live vs ideal coordinates
  const msgs = CORRECTION_MESSAGES[cluster];
  if (!msgs) return `Adjust your ${cluster.toLowerCase()} position.`;

  // Pick the most actionable message based on the cluster
  switch (cluster) {
    case 'Spine':
      return msgs.LENGTHEN;
    case 'Hips': {
      const liveY = (live[23]?.y + live[24]?.y) / 2;
      const idealY = (ideal[23]?.y + ideal[24]?.y) / 2;
      if (liveY > idealY + 0.1) return msgs.RAISE;
      if (liveY < idealY - 0.1) return msgs.LOWER;
      return msgs.WIDEN;
    }
    case 'Shoulders': {
      const liveX = Math.abs((live[11]?.x || 0) - (live[12]?.x || 0));
      const idealX = Math.abs((ideal[11]?.x || 0) - (ideal[12]?.x || 0));
      if (liveX < idealX - 0.15) return msgs.EXTEND;
      return msgs.LOWER;
    }
    case 'Knees': {
      const liveKneeY = (live[25]?.y + live[26]?.y) / 2;
      const idealKneeY = (ideal[25]?.y + ideal[26]?.y) / 2;
      if (liveKneeY < idealKneeY - 0.15) return msgs.BEND_MORE;
      return msgs.STRAIGHTEN;
    }
    case 'Elbows':
      return msgs.EXTEND;
    case 'Wrists':
      return msgs.EXTEND;
    case 'Ankles':
      return msgs.PRESS;
    default:
      return `Adjust your ${cluster.toLowerCase()} slightly.`;
  }
}

// ─── Main Atlas Comparison Function ──────────────────────────────────────────
/**
 * Compares live MediaPipe landmarks against the extracted reference baseline
 * for the given poseId.
 *
 * @param {Array} liveLandmarks - Array of 33 {x, y, z, visibility} from MediaPipe
 * @param {string} poseId - Snake_case pose identifier e.g. 'warrior_ii', 'downward_dog'
 * @returns {{ accuracy: number, feedback: string, corrections: Array, hasBaseline: boolean }}
 */
export function compareWithAtlas(liveLandmarks, poseId) {
  const baselineKey = POSE_ID_ALIAS[poseId];
  const referenceRaw = baselineKey ? POSE_BASELINES[baselineKey] : null;

  if (!referenceRaw || !liveLandmarks || liveLandmarks.length < 33) {
    return { accuracy: 0, feedback: '', corrections: [], hasBaseline: false };
  }

  // Normalize both sets
  const liveNorm = normalizeLandmarks(liveLandmarks);
  const idealNorm = normalizeLandmarks(referenceRaw);

  if (!liveNorm || !idealNorm) {
    return { accuracy: 0, feedback: '', corrections: [], hasBaseline: false };
  }

  // ── Per-cluster error computation ──────────────────────────────────────────
  const clusterErrors = {};
  const corrections = [];

  for (const [clusterName, indices] of Object.entries(JOINT_CLUSTERS)) {
    if (clusterName === 'Spine') continue; // handled separately below

    let totalDist = 0;
    let validCount = 0;

    for (const idx of indices) {
      const live = liveNorm[idx];
      const ideal = idealNorm[idx];
      if (!live || !ideal) continue;
      // Only score joints that are visible in the live feed
      if (liveLandmarks[idx]?.visibility < 0.5) continue;

      totalDist += euclidean3D(live, ideal);
      validCount++;
    }

    if (validCount === 0) continue;

    const avgDist = totalDist / validCount;
    const clusterAcc = distanceToAccuracy(avgDist);
    clusterErrors[clusterName] = clusterAcc;

    if (clusterAcc < 75) {
      corrections.push({
        joint_cluster: clusterName,
        direction: avgDist > 0.3 ? 'CRITICAL' : 'MINOR',
        severity: avgDist > 0.3 ? 'critical' : 'minor',
        feedback_message: generateCorrectionMessage(clusterName, liveNorm, idealNorm),
        accuracy: clusterAcc,
      });
    }
  }

  // ── Spine alignment: angle between shoulder-midpoint and hip-midpoint ───────
  const lShoulder = liveNorm[11], rShoulder = liveNorm[12];
  const lHip = liveNorm[23], rHip = liveNorm[24];
  const iShoulder = idealNorm[11], iRShoulder = idealNorm[12];
  const iHip = idealNorm[23], iRHip = idealNorm[24];

  if (lShoulder && rShoulder && lHip && rHip && iShoulder && iRShoulder && iHip && iRHip) {
    const liveSpineVec = {
      x: ((lShoulder.x + rShoulder.x) / 2) - ((lHip.x + rHip.x) / 2),
      y: ((lShoulder.y + rShoulder.y) / 2) - ((lHip.y + rHip.y) / 2),
    };
    const idealSpineVec = {
      x: ((iShoulder.x + iRShoulder.x) / 2) - ((iHip.x + iRHip.x) / 2),
      y: ((iShoulder.y + iRShoulder.y) / 2) - ((iHip.y + iRHip.y) / 2),
    };

    const dot = liveSpineVec.x * idealSpineVec.x + liveSpineVec.y * idealSpineVec.y;
    const magLive = Math.sqrt(liveSpineVec.x ** 2 + liveSpineVec.y ** 2);
    const magIdeal = Math.sqrt(idealSpineVec.x ** 2 + idealSpineVec.y ** 2);

    if (magLive > 0.01 && magIdeal > 0.01) {
      const cosAngle = Math.max(-1, Math.min(1, dot / (magLive * magIdeal)));
      const angleDegrees = Math.acos(cosAngle) * (180 / Math.PI);
      const spineAcc = Math.max(0, Math.round(100 - (angleDegrees / 45) * 100));
      clusterErrors['Spine'] = spineAcc;

      if (spineAcc < 75) {
        corrections.push({
          joint_cluster: 'Spine',
          direction: 'STRAIGHTEN',
          severity: spineAcc < 50 ? 'critical' : 'minor',
          feedback_message: CORRECTION_MESSAGES.Spine.LENGTHEN,
          accuracy: spineAcc,
        });
      }
    }
  }

  // ── Overall accuracy: weighted average of cluster accuracies ────────────────
  const clusterValues = Object.values(clusterErrors);
  const overallAccuracy = clusterValues.length > 0
    ? Math.round(clusterValues.reduce((a, b) => a + b, 0) / clusterValues.length)
    : 0;

  // Sort corrections by severity (most critical first)
  corrections.sort((a, b) => a.accuracy - b.accuracy);

  // ── Primary feedback message ────────────────────────────────────────────────
  let feedback;
  if (overallAccuracy >= 90) {
    feedback = '✨ Excellent form! Hold this position and breathe deeply.';
  } else if (overallAccuracy >= 75) {
    feedback = corrections[0]?.feedback_message || 'Almost there — make small adjustments.';
  } else if (overallAccuracy >= 50) {
    feedback = corrections[0]?.feedback_message || 'Keep working on your alignment.';
  } else {
    feedback = corrections[0]?.feedback_message || 'Step into the pose slowly — focus on the key joints.';
  }

  return {
    accuracy: overallAccuracy,
    feedback,
    corrections,
    clusterErrors,
    hasBaseline: true,
  };
}

/**
 * Returns true if an atlas baseline exists for the given poseId.
 */
export function hasAtlasBaseline(poseId) {
  const key = POSE_ID_ALIAS[poseId];
  return !!(key && POSE_BASELINES[key]);
}

/**
 * Simple 3D joint angle calculator — kept for backward compatibility with
 * the angle-based poseAnalyzer for poses without atlas baselines.
 *
 * @param {object} p1 - {x, y, z}
 * @param {object} p2 - Vertex joint {x, y, z}
 * @param {object} p3 - {x, y, z}
 * @returns {number} Angle in degrees at the vertex p2
 */
export function calculateJointAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return 0;
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: (p1.z || 0) - (p2.z || 0) };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: (p3.z || 0) - (p2.z || 0) };

  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);

  if (mag1 < 0.0001 || mag2 < 0.0001) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2)))) * (180 / Math.PI);
}
