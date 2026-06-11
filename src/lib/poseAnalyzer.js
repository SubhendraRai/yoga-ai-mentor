// src/lib/poseAnalyzer.js

/**
 * Calculates the angle between three points in 2D space.
 * B is the vertex.
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
 * Maps a deviation from an ideal angle into an accuracy percentage (0-100).
 * @param {number} current - Current angle
 * @param {number} ideal - Ideal angle
 * @param {number} tolerance - How much deviation drops the score to 0
 */
function getAccuracy(current, ideal, tolerance = 45) {
  const diff = Math.abs(current - ideal);
  if (diff > tolerance) return 50; // Floor at 50% for trying
  return Math.max(0, 100 - ((diff / tolerance) * 50)); // Scale 100 down to 50
}

/**
 * Analyzes landmarks against a target pose.
 * @returns { accuracy: number, feedback: string }
 */
export function analyzePose(landmarks, poseId) {
  if (!landmarks || landmarks.length < 33) return { accuracy: 0, feedback: "Please step into the frame." };

  // Common landmarks
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lElbow = landmarks[13];
  const rElbow = landmarks[14];
  const lWrist = landmarks[15];
  const rWrist = landmarks[16];
  const lHip = landmarks[23];
  const rHip = landmarks[24];
  const lKnee = landmarks[25];
  const rKnee = landmarks[26];
  const lAnkle = landmarks[27];
  const rAnkle = landmarks[28];

  let accuracy = 0;
  let feedback = "";

  switch (poseId) {
    case 'warrior_ii': {
      // Arms should be parallel to floor (~90 deg from torso)
      const lArmAngle = calculateAngle(lWrist, lShoulder, lHip);
      const rArmAngle = calculateAngle(rWrist, rShoulder, rHip);
      const armAcc = (getAccuracy(lArmAngle, 90) + getAccuracy(rArmAngle, 90)) / 2;

      // Front knee should be bent (~90-110), back leg straight (~180)
      // We don't know which is front, so we check both
      const lLegAngle = calculateAngle(lHip, lKnee, lAnkle);
      const rLegAngle = calculateAngle(rHip, rKnee, rAnkle);
      
      const isLeftFront = lLegAngle < rLegAngle;
      const frontKneeAngle = isLeftFront ? lLegAngle : rLegAngle;
      const backKneeAngle = isLeftFront ? rLegAngle : lLegAngle;

      const kneeAcc = getAccuracy(frontKneeAngle, 100, 40);
      const backLegAcc = getAccuracy(backKneeAngle, 180, 20);

      accuracy = (armAcc + kneeAcc + backLegAcc) / 3;

      if (armAcc < 80) feedback = "Keep your arms parallel to the floor.";
      else if (kneeAcc < 80) feedback = "Bend your front knee a bit more.";
      else if (backLegAcc < 80) feedback = "Straighten your back leg.";
      else feedback = "Excellent form! Hold it.";
      break;
    }

    case 'downward_dog': {
      // Body forms an inverted V. Hips are highest point.
      // Angle at hips should be ~70-90 degrees. Angle at shoulders ~180.
      const lHipAngle = calculateAngle(lShoulder, lHip, lKnee);
      const rHipAngle = calculateAngle(rShoulder, rHip, rKnee);
      const hipAcc = (getAccuracy(lHipAngle, 80, 30) + getAccuracy(rHipAngle, 80, 30)) / 2;

      const lShoulderAngle = calculateAngle(lWrist, lShoulder, lHip);
      const rShoulderAngle = calculateAngle(rWrist, rShoulder, rHip);
      const shoulderAcc = (getAccuracy(lShoulderAngle, 180, 30) + getAccuracy(rShoulderAngle, 180, 30)) / 2;

      accuracy = (hipAcc + shoulderAcc) / 2;

      if (shoulderAcc < 80) feedback = "Press firmly into your hands and straighten your back.";
      else if (hipAcc < 80) feedback = "Push your hips higher toward the ceiling.";
      else feedback = "Perfect Downward Dog. Breathe.";
      break;
    }

    case 'tree_pose': {
      // One leg straight (~180), one leg bent with knee out.
      const lLegAngle = calculateAngle(lHip, lKnee, lAnkle);
      const rLegAngle = calculateAngle(rHip, rKnee, rAnkle);
      
      const isLeftRaised = lLegAngle < rLegAngle;
      const standingLegAngle = isLeftRaised ? rLegAngle : lLegAngle;
      const standingAcc = getAccuracy(standingLegAngle, 180, 15);

      // Hands at heart center (wrists near each other)
      const handDist = Math.hypot(lWrist.x - rWrist.x, lWrist.y - rWrist.y);
      const handsAcc = handDist < 0.15 ? 100 : 70; // arbitrary normalized distance

      accuracy = (standingAcc + handsAcc) / 2;

      if (standingAcc < 85) feedback = "Keep your standing leg straight and engaged.";
      else if (handsAcc < 85) feedback = "Bring your hands together at heart center.";
      else feedback = "Beautiful balance. Find your focal point.";
      break;
    }

    default: {
      // Generic check: Ensure they are relatively upright and visible.
      // Check if shoulders are above hips. (y is inverted, so smaller y = higher)
      if (lShoulder.y < lHip.y && rShoulder.y < rHip.y) {
        accuracy = 90; 
        feedback = "Good posture. Hold steady.";
      } else {
        accuracy = 60;
        feedback = "Adjust your posture to match the reference.";
      }
      break;
    }
  }

  // Add some smoothing to accuracy so it doesn't jitter wildly
  accuracy = Math.round(accuracy);
  
  return { accuracy, feedback };
}
