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
 */
function getAccuracy(current, ideal, tolerance = 45) {
  const diff = Math.abs(current - ideal);
  if (diff > tolerance) return 50; // Floor at 50% for trying
  return Math.max(0, 100 - ((diff / tolerance) * 50)); // Scale 100 down to 50
}

const landmarkNames = {
  11: "left shoulder",
  12: "right shoulder",
  13: "left elbow",
  14: "right elbow",
  15: "left wrist",
  16: "right wrist",
  23: "left hip",
  24: "right hip",
  25: "left knee",
  26: "right knee",
  27: "left ankle",
  28: "right ankle"
};

/**
 * Checks if key landmarks are visible enough.
 * Returns { visible: true } or { visible: false, feedback: string }
 */
function checkKeyVisibility(landmarks, indices) {
  for (const idx of indices) {
    const landmark = landmarks[idx];
    // A threshold of 0.5 is standard for MediaPipe pose landmarks visibility
    if (!landmark || landmark.visibility < 0.5) {
      const name = landmarkNames[idx] || `joint ${idx}`;
      return { 
        visible: false, 
        feedback: `Ensure your ${name} is fully in the camera frame.` 
      };
    }
  }
  return { visible: true };
}

/**
 * Analyzes landmarks against a target pose.
 * @returns { accuracy: number, feedback: string }
 */
export function analyzePose(landmarks, poseId) {
  if (!landmarks || landmarks.length < 33) return { accuracy: 0, feedback: "Please step into the frame.", angleScore: 0, visibilityScore: 0 };

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
  let angleScore = 100;
  let visibilityScore = 1.0;

  // Calculate minimum visibility of all landmarks
  let minVis = 1.0;
  landmarks.forEach(lm => {
    if (lm && lm.visibility !== undefined && lm.visibility < minVis) {
      minVis = lm.visibility;
    }
  });
  visibilityScore = minVis;

  switch (poseId) {
    case 'warrior_ii': {
      // 1. Visibility Check
      const vis = checkKeyVisibility(landmarks, [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]);

      // Arms should be parallel to floor (~90 deg from torso)
      const lArmAngle = calculateAngle(lWrist, lShoulder, lHip);
      const rArmAngle = calculateAngle(rWrist, rShoulder, rHip);
      const armAcc = (getAccuracy(lArmAngle, 90, 30) + getAccuracy(rArmAngle, 90, 30)) / 2;

      // Elbows should be straight (~180 deg)
      const lElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
      const rElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);
      const elbowAcc = (getAccuracy(lElbowAngle, 180, 25) + getAccuracy(rElbowAngle, 180, 25)) / 2;

      // Front knee should be bent (~90-110), back leg straight (~180)
      const lLegAngle = calculateAngle(lHip, lKnee, lAnkle);
      const rLegAngle = calculateAngle(rHip, rKnee, rAnkle);
      
      const isLeftFront = lLegAngle < rLegAngle;
      const frontKneeAngle = isLeftFront ? lLegAngle : rLegAngle;
      const backKneeAngle = isLeftFront ? rLegAngle : lLegAngle;

      const kneeAcc = getAccuracy(frontKneeAngle, 100, 35);
      const backLegAcc = getAccuracy(backKneeAngle, 180, 20);

      angleScore = (armAcc + elbowAcc + kneeAcc + backLegAcc) / 4;

      if (!vis.visible) {
        accuracy = 50;
        feedback = vis.feedback;
      } else {
        accuracy = angleScore;
        if (elbowAcc < 80) feedback = "Straighten your elbows. Reach out with your hands.";
        else if (armAcc < 80) feedback = "Raise your arms to be parallel to the floor.";
        else if (kneeAcc < 80) feedback = "Bend your front knee closer to a 90-degree angle.";
        else if (backLegAcc < 80) feedback = "Straighten your back leg fully.";
        else feedback = "Perfect Warrior II form! Keep breathing.";
      }
      break;
    }

    case 'downward_dog': {
      // Hips are highest point (y-axis inverted, so smaller y = higher up)
      const isHipsHighest = lHip.y < lShoulder.y && lHip.y < lKnee.y;
      
      // Hips angle should be ~70-90 degrees
      const lHipAngle = calculateAngle(lShoulder, lHip, lKnee);
      const rHipAngle = calculateAngle(rShoulder, rHip, rKnee);
      const hipAcc = (getAccuracy(lHipAngle, 80, 25) + getAccuracy(rHipAngle, 80, 25)) / 2;

      // Spine & arms should form a straight line (~180 degrees at shoulder)
      const lShoulderAngle = calculateAngle(lWrist, lShoulder, lHip);
      const rShoulderAngle = calculateAngle(rWrist, rShoulder, rHip);
      const shoulderAcc = (getAccuracy(lShoulderAngle, 180, 30) + getAccuracy(rShoulderAngle, 180, 30)) / 2;

      // Legs should be relatively straight (~180 degrees at knee)
      const lKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
      const rKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
      const legsAcc = (getAccuracy(lKneeAngle, 180, 25) + getAccuracy(rKneeAngle, 180, 25)) / 2;

      angleScore = (hipAcc + shoulderAcc + legsAcc) / 3;
      if (!isHipsHighest) {
        angleScore = Math.min(angleScore, 70);
      }

      const vis = checkKeyVisibility(landmarks, [11, 12, 15, 16, 23, 24, 25, 26, 27, 28]);
      if (!vis.visible) {
        accuracy = 50;
        feedback = vis.feedback;
      } else {
        accuracy = angleScore;
        if (!isHipsHighest || hipAcc < 80) feedback = "Push your hips higher toward the ceiling.";
        else if (shoulderAcc < 80) feedback = "Press firmly into your hands and flatten your spine.";
        else if (legsAcc < 80) feedback = "Straighten your legs as much as possible, heels toward the mat.";
        else feedback = "Perfect Downward Dog. Push through your palms.";
      }
      break;
    }

    case 'tree_pose': {
      // One leg straight (~180), one leg bent with knee out.
      const lLegAngle = calculateAngle(lHip, lKnee, lAnkle);
      const rLegAngle = calculateAngle(rHip, rKnee, rAnkle);
      
      const isLeftRaised = lLegAngle < rLegAngle;
      const standingLegAngle = isLeftRaised ? rLegAngle : lLegAngle;
      const raisedLegAngle = isLeftRaised ? lLegAngle : rLegAngle;
      
      const standingAcc = getAccuracy(standingLegAngle, 180, 15);
      const raisedAcc = getAccuracy(raisedLegAngle, 100, 40); // Knee bent at ~90-110

      // Hands at heart center (wrists near each other at torso level)
      // Or hands raised above head (wrists above shoulders)
      let handsAcc = 70;
      const lWristVisible = lWrist && lWrist.visibility > 0.4;
      const rWristVisible = rWrist && rWrist.visibility > 0.4;

      if (lWristVisible && rWristVisible) {
        const handDist = Math.hypot(lWrist.x - rWrist.x, lWrist.y - rWrist.y);
        const handsAtHeart = handDist < 0.15 && lWrist.y > lShoulder.y && lWrist.y < lHip.y;
        const handsRaised = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y && handDist < 0.25;
        
        if (handsAtHeart || handsRaised) {
          handsAcc = 100;
        } else {
          handsAcc = 60;
        }
      }

      angleScore = (standingAcc + raisedAcc + handsAcc) / 3;

      const vis = checkKeyVisibility(landmarks, [11, 12, 23, 24, 25, 26, 27, 28]);
      if (!vis.visible) {
        accuracy = 50;
        feedback = vis.feedback;
      } else {
        accuracy = angleScore;
        if (standingAcc < 85) feedback = "Keep your standing leg straight and strong.";
        else if (raisedAcc < 80) feedback = "Open your hip and place your foot against your inner thigh or calf.";
        else if (handsAcc < 85) feedback = "Bring hands to heart center or reach them above your head.";
        else feedback = "Beautiful balance. Find a focal point to hold steady.";
      }
      break;
    }

    case 'cat_cow': {
      // Verify spine is horizontal (shoulders and hips at similar y height)
      const shoulderHipYDiff = Math.abs((lShoulder.y + rShoulder.y)/2 - (lHip.y + rHip.y)/2);
      const isHorizontal = shoulderHipYDiff < 0.15;

      angleScore = isHorizontal ? 90 : 70;

      const vis = checkKeyVisibility(landmarks, [11, 12, 13, 14, 15, 16, 23, 24, 25, 26]);
      if (!vis.visible) {
        accuracy = 50;
        feedback = vis.feedback;
      } else {
        accuracy = angleScore;
        if (!isHorizontal) {
          feedback = "Bring your shoulders and hips level in a tabletop position.";
        } else {
          feedback = "Flow with your breath: arch your back on inhales, round it on exhales.";
        }
      }
      break;
    }

    case 'savasana': {
      // Corpse pose: Lie flat. Shoulders, hips, and knees at similar y heights (close to floor)
      const heightDiff = Math.abs(lShoulder.y - lAnkle.y);
      const isFlat = heightDiff < 0.25;

      angleScore = isFlat ? 95 : 75;

      const vis = checkKeyVisibility(landmarks, [11, 12, 23, 24, 25, 26, 27, 28]);
      if (!vis.visible) {
        accuracy = 50;
        feedback = vis.feedback;
      } else {
        accuracy = angleScore;
        if (!isFlat) {
          feedback = "Lie down fully flat on your back.";
        } else {
          feedback = "Perfect savasana. Relax your body and release all thoughts.";
        }
      }
      break;
    }

    case 'childs_pose': {
      // Kneeling, chest low, arms extended
      const hipAnkleDist = Math.hypot(lHip.x - lAnkle.x, lHip.y - lAnkle.y);
      const isHipsLow = hipAnkleDist < 0.25;

      // Shoulders should be low (arms extended forward)
      const isChestLow = lShoulder.y > lHip.y || Math.abs(lShoulder.y - lHip.y) < 0.15;

      angleScore = (isHipsLow ? 50 : 25) + (isChestLow ? 50 : 25);

      const vis = checkKeyVisibility(landmarks, [11, 12, 15, 16, 23, 24, 27, 28]);
      if (!vis.visible) {
        accuracy = 50;
        feedback = vis.feedback;
      } else {
        accuracy = angleScore;
        if (!isHipsLow) feedback = "Sink your hips back closer to your heels.";
        else if (!isChestLow) feedback = "Lower your forehead and chest toward the floor.";
        else feedback = "Perfect Child's Pose. Breathe into your lower back.";
      }
      break;
    }

    default: {
      // Generic check: Ensure they are relatively upright and visible.
      if (lShoulder.y < lHip.y && rShoulder.y < rHip.y) {
        angleScore = 90; 
        feedback = "Good posture. Keep holding steady.";
      } else {
        angleScore = 60;
        feedback = "Adjust your posture to align with the camera.";
      }
      accuracy = angleScore;
      break;
    }
  }

  // Smooth accuracy
  accuracy = Math.round(accuracy);
  
  return { 
    accuracy, 
    feedback, 
    angleScore: Math.round(angleScore), 
    visibilityScore: Number(visibilityScore.toFixed(3)) 
  };
}
