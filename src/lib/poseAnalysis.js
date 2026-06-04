// src/lib/poseAnalysis.js

/**
 * Calculates the angle between three 2D points (a, b, c).
 * b is the vertex.
 */
function calculateAngle(a, b, c) {
  if (!a || !b || !c) return 0;
  
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * Extracts a simplified state of the body based on 33 landmarks.
 * @param {Array} landmarks - MediaPipe Pose landmarks array
 * @returns {Object} A summary of key angles and positions
 */
export function analyzePose(landmarks) {
  if (!landmarks || landmarks.length < 33) return null;

  // Extract key landmarks
  const l_shoulder = landmarks[11];
  const r_shoulder = landmarks[12];
  const l_elbow = landmarks[13];
  const r_elbow = landmarks[14];
  const l_wrist = landmarks[15];
  const r_wrist = landmarks[16];
  
  const l_hip = landmarks[23];
  const r_hip = landmarks[24];
  const l_knee = landmarks[25];
  const r_knee = landmarks[26];
  const l_ankle = landmarks[27];
  const r_ankle = landmarks[28];

  // Calculate critical angles
  const leftArmAngle = calculateAngle(l_shoulder, l_elbow, l_wrist);
  const rightArmAngle = calculateAngle(r_shoulder, r_elbow, r_wrist);
  const leftLegAngle = calculateAngle(l_hip, l_knee, l_ankle);
  const rightLegAngle = calculateAngle(r_hip, r_knee, r_ankle);

  // Check shoulder alignment (are they level horizontally?)
  // Y goes top-down in MediaPipe, so lower Y is higher up physically
  const shoulderDiffY = Math.abs(l_shoulder.y - r_shoulder.y);
  let shoulderAlignment = "level";
  if (shoulderDiffY > 0.05) {
    shoulderAlignment = l_shoulder.y < r_shoulder.y ? "left_higher" : "right_higher";
  }

  // Determine arm positions
  const getArmState = (angle, wrist, shoulder) => {
    if (angle > 160) {
      if (wrist.y < shoulder.y) return "raised_straight";
      return "lowered_straight";
    }
    return "bent";
  };

  const getLegState = (angle) => {
    if (angle > 160) return "straight";
    if (angle > 90) return "slightly_bent";
    return "deeply_bent";
  };

  return {
    arms: {
      left: getArmState(leftArmAngle, l_wrist, l_shoulder),
      right: getArmState(rightArmAngle, r_wrist, r_shoulder),
      left_angle: Math.round(leftArmAngle),
      right_angle: Math.round(rightArmAngle)
    },
    legs: {
      left: getLegState(leftLegAngle),
      right: getLegState(rightLegAngle),
      left_angle: Math.round(leftLegAngle),
      right_angle: Math.round(rightLegAngle)
    },
    shoulders: shoulderAlignment,
    visibility: {
      hips_visible: l_hip.visibility > 0.5 && r_hip.visibility > 0.5,
      feet_visible: l_ankle.visibility > 0.5 && r_ankle.visibility > 0.5
    }
  };
}
