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
  if (diff > tolerance) return 0; // Drop to 0% to prevent casual standing from matching
  return Math.max(0, 100 - (diff / tolerance) * 100); // Scale down from 100 to 0
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
 * @returns { accuracy: number, feedback: string, angleScore: number, visibilityScore: number, requiredAngles: string, currentAngles: string, angleErrors: string, poseMatchReason: string, poseRejectionReason: string }
 */
export function analyzePose(landmarks, poseId) {
  if (!landmarks || landmarks.length < 33) return { 
    accuracy: 0, 
    feedback: "Please step into the frame.",
    angleScore: 0,
    visibilityScore: 0,
    requiredAngles: "N/A",
    currentAngles: "N/A",
    angleErrors: "Missing landmarks",
    poseMatchReason: "None",
    poseRejectionReason: "User is out of frame"
  };

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
  
  let requiredAngles = "N/A";
  let currentAngles = "N/A";
  let angleErrors = "None";
  let poseMatchReason = "None";
  let poseRejectionReason = "None";

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
      requiredAngles = "Arms: 90° (tol: 30°), Elbows: 180° (tol: 25°), Front Knee: 100° (tol: 35°), Back Knee: 180° (tol: 20°)";
      
      const lArmAngle = calculateAngle(lWrist, lShoulder, lHip);
      const rArmAngle = calculateAngle(rWrist, rShoulder, rHip);
      const armAcc = (getAccuracy(lArmAngle, 90, 30) + getAccuracy(rArmAngle, 90, 30)) / 2;

      const lElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
      const rElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);
      const elbowAcc = (getAccuracy(lElbowAngle, 180, 25) + getAccuracy(rElbowAngle, 180, 25)) / 2;

      const lLegAngle = calculateAngle(lHip, lKnee, lAnkle);
      const rLegAngle = calculateAngle(rHip, rKnee, rAnkle);
      
      const isLeftFront = lLegAngle < rLegAngle;
      const frontKneeAngle = isLeftFront ? lLegAngle : rLegAngle;
      const backKneeAngle = isLeftFront ? rLegAngle : lLegAngle;

      const kneeAcc = getAccuracy(frontKneeAngle, 100, 35);
      const backLegAcc = getAccuracy(backKneeAngle, 180, 20);

      currentAngles = `L-Arm: ${Math.round(lArmAngle)}°, R-Arm: ${Math.round(rArmAngle)}°, L-Elb: ${Math.round(lElbowAngle)}°, R-Elb: ${Math.round(rElbowAngle)}°, FrontKnee: ${Math.round(frontKneeAngle)}°, BackKnee: ${Math.round(backKneeAngle)}°`;

      const errors = [];
      if (Math.abs(lArmAngle - 90) > 30) errors.push(`L-Arm: ${Math.round(lArmAngle)}°`);
      if (Math.abs(rArmAngle - 90) > 30) errors.push(`R-Arm: ${Math.round(rArmAngle)}°`);
      if (Math.abs(lElbowAngle - 180) > 25) errors.push(`L-Elb: ${Math.round(lElbowAngle)}°`);
      if (Math.abs(rElbowAngle - 180) > 25) errors.push(`R-Elb: ${Math.round(rElbowAngle)}°`);
      if (Math.abs(frontKneeAngle - 100) > 35) errors.push(`FrontKnee: ${Math.round(frontKneeAngle)}°`);
      if (Math.abs(backKneeAngle - 180) > 20) errors.push(`BackKnee: ${Math.round(backKneeAngle)}°`);
      angleErrors = errors.join(", ") || "None";

      const vis = checkKeyVisibility(landmarks, [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]);
      if (!vis.visible) {
        accuracy = 40;
        feedback = vis.feedback;
        poseRejectionReason = `Visibility: ${vis.feedback}`;
      } else if (lLegAngle > 150 && rLegAngle > 150) {
        accuracy = 30;
        feedback = "Bend your front knee and step wide.";
        poseRejectionReason = "Standing posture detected (both knees straight)";
      } else if (lArmAngle < 50 || rArmAngle < 50) {
        accuracy = 35;
        feedback = "Raise your arms parallel to the floor.";
        poseRejectionReason = "Arms are lowered near hips";
      } else {
        angleScore = (armAcc + elbowAcc + kneeAcc + backLegAcc) / 4;
        accuracy = angleScore;
        
        if (accuracy >= 85) {
          poseMatchReason = "All joint angles and visibilities within tolerance";
        } else {
          poseRejectionReason = errors.join(", ") ? `Off-angles: ${errors.join(", ")}` : "Low alignment accuracy";
        }

        if (elbowAcc < 80) feedback = "Straighten your elbows. Reach out with your hands.";
        else if (armAcc < 80) feedback = "Raise your arms to be parallel to the floor.";
        else if (kneeAcc < 80) feedback = "Bend your front knee closer to a 90-degree angle.";
        else if (backLegAcc < 80) feedback = "Straighten your back leg fully.";
        else feedback = "Perfect Warrior II form! Keep breathing.";
      }
      break;
    }

    case 'downward_dog': {
      requiredAngles = "Hips: 80° (tol: 25°), Shoulders: 180° (tol: 30°), Knees: 180° (tol: 25°)";
      
      const isHipsHighest = lHip.y < lShoulder.y && lHip.y < lKnee.y;
      
      const lHipAngle = calculateAngle(lShoulder, lHip, lKnee);
      const rHipAngle = calculateAngle(rShoulder, rHip, rKnee);
      const hipAcc = (getAccuracy(lHipAngle, 80, 25) + getAccuracy(rHipAngle, 80, 25)) / 2;

      const lShoulderAngle = calculateAngle(lWrist, lShoulder, lHip);
      const rShoulderAngle = calculateAngle(rWrist, rShoulder, rHip);
      const shoulderAcc = (getAccuracy(lShoulderAngle, 180, 30) + getAccuracy(rShoulderAngle, 180, 30)) / 2;

      const lKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
      const rKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
      const legsAcc = (getAccuracy(lKneeAngle, 180, 25) + getAccuracy(rKneeAngle, 180, 25)) / 2;

      currentAngles = `Hips: ${Math.round((lHipAngle + rHipAngle)/2)}°, Shld: ${Math.round((lShoulderAngle + rShoulderAngle)/2)}°, Knees: ${Math.round((lKneeAngle + rKneeAngle)/2)}°`;

      const errors = [];
      if (Math.abs(lHipAngle - 80) > 25 || Math.abs(rHipAngle - 80) > 25) errors.push(`Hips: ${Math.round((lHipAngle + rHipAngle)/2)}°`);
      if (Math.abs(lShoulderAngle - 180) > 30 || Math.abs(rShoulderAngle - 180) > 30) errors.push(`Shoulders: ${Math.round((lShoulderAngle + rShoulderAngle)/2)}°`);
      if (Math.abs(lKneeAngle - 180) > 25 || Math.abs(rKneeAngle - 180) > 25) errors.push(`Knees: ${Math.round((lKneeAngle + rKneeAngle)/2)}°`);
      angleErrors = errors.join(", ") || "None";

      const vis = checkKeyVisibility(landmarks, [11, 12, 15, 16, 23, 24, 25, 26, 27, 28]);
      if (!vis.visible) {
        accuracy = 40;
        feedback = vis.feedback;
        poseRejectionReason = `Visibility: ${vis.feedback}`;
      } else if (lShoulder.y < lHip.y) {
        accuracy = 25;
        feedback = "Lower your chest and press hips high into an inverted V.";
        poseRejectionReason = "Upright/standing posture detected (shoulders above hips)";
      } else if (!isHipsHighest) {
        accuracy = 30;
        feedback = "Push your hips higher toward the ceiling.";
        poseRejectionReason = "Hips are not the highest point of the body";
      } else {
        angleScore = (hipAcc + shoulderAcc + legsAcc) / 3;
        accuracy = angleScore;

        if (accuracy >= 85) {
          poseMatchReason = "Inverted V-shape correctly aligned";
        } else {
          poseRejectionReason = errors.join(", ") ? `Off-angles: ${errors.join(", ")}` : "Low alignment accuracy";
        }

        if (hipAcc < 80) feedback = "Push your hips higher toward the ceiling.";
        else if (shoulderAcc < 80) feedback = "Press firmly into your hands and flatten your spine.";
        else if (legsAcc < 80) feedback = "Straighten your legs as much as possible, heels toward the mat.";
        else feedback = "Perfect Downward Dog. Push through your palms.";
      }
      break;
    }

    case 'tree_pose': {
      requiredAngles = "Standing Knee: 180° (tol: 15°), Raised Knee: 100° (tol: 40°), Hands: Heart Center/Raised";
      
      const lLegAngle = calculateAngle(lHip, lKnee, lAnkle);
      const rLegAngle = calculateAngle(rHip, rKnee, rAnkle);
      const isLeftRaised = lLegAngle < rLegAngle;
      const standingLegAngle = isLeftRaised ? rLegAngle : lLegAngle;
      const raisedLegAngle = isLeftRaised ? lLegAngle : rLegAngle;
      
      const standingAcc = getAccuracy(standingLegAngle, 180, 15);
      const raisedAcc = getAccuracy(raisedLegAngle, 100, 40);

      let handsAcc = 70;
      const lWristVisible = lWrist && lWrist.visibility > 0.4;
      const rWristVisible = rWrist && rWrist.visibility > 0.4;
      let handsAtHeart = false;
      let handsRaised = false;

      if (lWristVisible && rWristVisible) {
        const handDist = Math.hypot(lWrist.x - rWrist.x, lWrist.y - rWrist.y);
        handsAtHeart = handDist < 0.15 && lWrist.y > lShoulder.y && lWrist.y < lHip.y;
        handsRaised = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y && handDist < 0.25;
        if (handsAtHeart || handsRaised) {
          handsAcc = 100;
        } else {
          handsAcc = 60;
        }
      }

      currentAngles = `StandKnee: ${Math.round(standingLegAngle)}°, RaiseKnee: ${Math.round(raisedLegAngle)}°, Hands: ${handsAtHeart ? 'Heart' : (handsRaised ? 'Raised' : 'Incorrect')}`;

      const errors = [];
      if (standingLegAngle < 165) errors.push(`StandKnee: ${Math.round(standingLegAngle)}°`);
      if (raisedLegAngle > 140) errors.push(`RaiseKnee: ${Math.round(raisedLegAngle)}°`);
      if (handsAcc < 85) errors.push("Hands position");
      angleErrors = errors.join(", ") || "None";

      const vis = checkKeyVisibility(landmarks, [11, 12, 23, 24, 25, 26, 27, 28]);
      if (!vis.visible) {
        accuracy = 40;
        feedback = vis.feedback;
        poseRejectionReason = `Visibility: ${vis.feedback}`;
      } else if (standingLegAngle < 160 || raisedLegAngle > 140) {
        accuracy = 30;
        feedback = "Place one foot on your inner thigh and balance.";
        poseRejectionReason = "Standing posture detected (both legs straight)";
      } else {
        angleScore = (standingAcc + raisedAcc + handsAcc) / 3;
        accuracy = angleScore;

        if (accuracy >= 85) {
          poseMatchReason = "Single-leg balance with hands correctly placed";
        } else {
          poseRejectionReason = errors.join(", ") ? `Off-alignments: ${errors.join(", ")}` : "Low balance alignment";
        }

        if (standingAcc < 85) feedback = "Keep your standing leg straight and strong.";
        else if (raisedAcc < 80) feedback = "Open your hip and place your foot against your inner thigh or calf.";
        else if (handsAcc < 85) feedback = "Bring hands to heart center or reach them above your head.";
        else feedback = "Beautiful balance. Find a focal point to hold steady.";
      }
      break;
    }

    case 'cat_cow': {
      requiredAngles = "Spine: Horizontal tabletop (shoulders level with hips)";
      
      const shoulderHipYDiff = Math.abs((lShoulder.y + rShoulder.y)/2 - (lHip.y + rHip.y)/2);
      const isHorizontal = shoulderHipYDiff < 0.15;
      
      currentAngles = `Shoulder-Hip Height Diff: ${shoulderHipYDiff.toFixed(2)}`;
      
      const errors = [];
      if (!isHorizontal) errors.push(`Tabletop Diff: ${shoulderHipYDiff.toFixed(2)}`);
      angleErrors = errors.join(", ") || "None";

      const vis = checkKeyVisibility(landmarks, [11, 12, 13, 14, 15, 16, 23, 24, 25, 26]);
      if (!vis.visible) {
        accuracy = 40;
        feedback = vis.feedback;
        poseRejectionReason = `Visibility: ${vis.feedback}`;
      } else if (lShoulder.y < lHip.y - 0.15) {
        accuracy = 25;
        feedback = "Come down to your hands and knees in tabletop position.";
        poseRejectionReason = "Standing posture detected (shoulders too high above hips)";
      } else {
        angleScore = isHorizontal ? 90 : 70;
        accuracy = angleScore;

        if (accuracy >= 85) {
          poseMatchReason = "Tabletop horizontal configuration detected";
        } else {
          poseRejectionReason = "Tabletop position not level";
        }

        if (!isHorizontal) {
          feedback = "Bring your shoulders and hips level in a tabletop position.";
        } else {
          feedback = "Flow with your breath: arch your back on inhales, round it on exhales.";
        }
      }
      break;
    }

    case 'savasana': {
      requiredAngles = "Spine: Fully horizontal lying down flat";
      
      const heightDiff = Math.abs(lShoulder.y - lAnkle.y);
      const isFlat = heightDiff < 0.25;
      
      currentAngles = `Shoulder-Ankle Vertical Dist: ${heightDiff.toFixed(2)}`;
      
      const errors = [];
      if (!isFlat) errors.push(`Vertical height difference: ${heightDiff.toFixed(2)}`);
      angleErrors = errors.join(", ") || "None";

      const vis = checkKeyVisibility(landmarks, [11, 12, 23, 24, 25, 26, 27, 28]);
      if (!vis.visible) {
        accuracy = 40;
        feedback = vis.feedback;
        poseRejectionReason = `Visibility: ${vis.feedback}`;
      } else if (Math.abs(lShoulder.y - lAnkle.y) > 0.4) {
        accuracy = 20;
        feedback = "Lie down flat on your mat for corpse pose.";
        poseRejectionReason = "Standing posture detected (body is aligned vertically)";
      } else {
        angleScore = isFlat ? 95 : 75;
        accuracy = angleScore;

        if (accuracy >= 85) {
          poseMatchReason = "Lying flat corpse configuration validated";
        } else {
          poseRejectionReason = "Body is not fully reclined or flat";
        }

        if (!isFlat) {
          feedback = "Lie down fully flat on your back.";
        } else {
          feedback = "Perfect savasana. Relax your body and release all thoughts.";
        }
      }
      break;
    }

    case 'childs_pose': {
      requiredAngles = "Hips: Low sitting on heels, Chest: Folded low to floor";
      
      const hipAnkleDist = Math.hypot(lHip.x - lAnkle.x, lHip.y - lAnkle.y);
      const isHipsLow = hipAnkleDist < 0.25;
      const isChestLow = lShoulder.y > lHip.y || Math.abs(lShoulder.y - lHip.y) < 0.15;
      
      currentAngles = `Hips-Ankle Dist: ${hipAnkleDist.toFixed(2)}, Shoulder-Hip Y-Diff: ${(lShoulder.y - lHip.y).toFixed(2)}`;
      
      const errors = [];
      if (!isHipsLow) errors.push("Hips too high");
      if (!isChestLow) errors.push("Chest too high");
      angleErrors = errors.join(", ") || "None";

      const vis = checkKeyVisibility(landmarks, [11, 12, 15, 16, 23, 24, 27, 28]);
      if (!vis.visible) {
        accuracy = 40;
        feedback = vis.feedback;
        poseRejectionReason = `Visibility: ${vis.feedback}`;
      } else if (Math.abs(lShoulder.y - lAnkle.y) > 0.4) {
        accuracy = 20;
        feedback = "Kneel down, sit back on your heels, and fold forward.";
        poseRejectionReason = "Standing posture detected (kneeling not observed)";
      } else {
        angleScore = (isHipsLow ? 50 : 25) + (isChestLow ? 50 : 25);
        accuracy = angleScore;

        if (accuracy >= 85) {
          poseMatchReason = "Kneeling forward fold validated";
        } else {
          poseRejectionReason = errors.join(", ") ? `Off-limits: ${errors.join(", ")}` : "Low alignment";
        }

        if (!isHipsLow) feedback = "Sink your hips back closer to your heels.";
        else if (!isChestLow) feedback = "Lower your forehead and chest toward the floor.";
        else feedback = "Perfect Child's Pose. Breathe into your lower back.";
      }
      break;
    }

    default: {
      requiredAngles = "Generic check: Upright and relative straight posture";
      currentAngles = `Shld-Hip L: ${(lShoulder.y - lHip.y).toFixed(2)}, Shld-Hip R: ${(rShoulder.y - rHip.y).toFixed(2)}`;
      
      const isUpright = lShoulder.y < lHip.y && rShoulder.y < rHip.y;
      angleErrors = isUpright ? "None" : "Not upright";

      if (isUpright) {
        angleScore = 90;
        feedback = "Good posture. Keep holding steady.";
        poseMatchReason = "Upright standing alignment validated";
      } else {
        angleScore = 60;
        feedback = "Adjust your posture to align with the camera.";
        poseRejectionReason = "Body is not vertical or upright";
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
    visibilityScore: Number(visibilityScore.toFixed(3)),
    requiredAngles,
    currentAngles,
    angleErrors,
    poseMatchReason,
    poseRejectionReason
  };
}
