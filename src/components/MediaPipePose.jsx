import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, CheckCircle, Activity, Timer, ChevronRight } from 'lucide-react';
import { speechHelper } from '../lib/speech';
import { analyzePose } from '../lib/poseAnalyzer';
import { playSound } from '../lib/audio';
import { WellnessMemory } from '../lib/wellnessMemory';
import { generateSessionSummary } from '../lib/ai';

// Mapping indices to human-friendly key joint names
const KEY_JOINTS = {
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

// Retrieve key joints monitored for the active pose ID
const GET_POSE_KEY_JOINTS = (poseId) => {
  switch (poseId) {
    case 'warrior_ii': return [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    case 'downward_dog': return [11, 12, 15, 16, 23, 24, 25, 26, 27, 28];
    case 'tree_pose': return [11, 12, 23, 24, 25, 26, 27, 28];
    case 'cat_cow': return [11, 12, 13, 14, 15, 16, 23, 24, 25, 26];
    case 'savasana': return [11, 12, 23, 24, 25, 26, 27, 28];
    case 'childs_pose': return [11, 12, 15, 16, 23, 24, 27, 28];
    default: return [];
  }
};

const DEFAULT_POSE = { id: 'generic', englishName: "Free Practice", duration: 1, imageUrl: "https://placehold.co/800x600/13131a/c4a96a?text=Practice" };

export default function MediaPipePose({ session = [], initialPoseIndex = 0, onExit }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const isLoadedRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(initialPoseIndex);
  const [feedback, setFeedback] = useState("Initializing camera...");
  const [accuracy, setAccuracy] = useState(0);
  const [isPerfect, setIsPerfect] = useState(false);
  
  const safeSession = session || [];

  // Timer State
  const [holdTimeLeft, setHoldTimeLeft] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ averageAccuracy: 0, totalTime: 0, totalPoses: 0 });
  const accuracyHistory = useRef([]);
  const sessionStartTime = useRef(Date.now());
  const lastTickTime = useRef(Date.now());
  const accuracyRef = useRef(0);
  const lastUiUpdateTime = useRef(0);
  const mistakesTracker = useRef({});

  // Concurrency & Lifecycle Refs to prevent WebAssembly stack crashes and leaks
  const cameraRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const isUnmountedRef = useRef(false);
  const isProcessingRef = useRef(false);

  // EMA Coordinate & Visibility Smoothing history
  const prevLandmarksRef = useRef(null);

  // Landmark visibility grace period / hysteresis tracker
  const lowVisibilityStartTimesRef = useRef({});
  const actualSmoothedVisibilityRef = useRef({});

  // Diagnostic Stats & Debug HUD State
  const [showDebug, setShowDebug] = useState(false);
  const [debugStats, setDebugStats] = useState({
    cameraFps: 0,
    poseFps: 0,
    received: 0,
    processed: 0,
    dropped: 0,
    poseDetected: false,
    avgVisibility: 0,
    lowestJointName: 'N/A',
    lowestJointVis: 0,
    poseLossReason: 'Initializing...',
    lastValidSecsAgo: 'Never',
    currentPoseName: 'N/A',
    poseMatched: 'NO',
    angleScore: 0,
    visibilityScore: 0,
    finalAccuracy: 0,
    speechEnabled: false,
    speechTriggered: 'NO',
    speechQueueLength: 0,
    lastSpeechEvent: 'None',
    requiredAngles: 'N/A',
    currentAngles: 'N/A',
    angleErrors: 'None',
    poseMatchReason: 'None',
    poseRejectionReason: 'None'
  });

  // Frames counters
  const framesReceivedCountRef = useRef(0);
  const framesProcessedCountRef = useRef(0);
  const framesDroppedCountRef = useRef(0);
  
  const cameraFramesCount = useRef(0);
  const lastCameraFpsTime = useRef(Date.now());
  const currentCameraFps = useRef(0);

  const poseFramesCount = useRef(0);
  const lastPoseFpsTime = useRef(Date.now());
  const currentPoseFps = useRef(0);

  const lastValidPoseTimeRef = useRef(null);
  
  // Speech Throttling State to fix machine-gun stuttering
  const lastSpokenTextRef = useRef("");
  const lastSpokenTimeRef = useRef(0);

  const speakFeedbackThrottled = (text, force = false) => {
    const now = Date.now();
    const timeSinceLastSpeech = now - lastSpokenTimeRef.current;

    if (force) {
      speechHelper.speak(text, true);
      lastSpokenTextRef.current = text;
      lastSpokenTimeRef.current = now;
      return;
    }

    // Do not repeat the exact same feedback within 7 seconds
    if (text === lastSpokenTextRef.current && timeSinceLastSpeech < 7000) {
      return;
    }

    // Avoid speaking anything new if it has been less than 4.5 seconds since last speech started
    if (timeSinceLastSpeech < 4500) {
      return;
    }

    speechHelper.speak(text);
    lastSpokenTextRef.current = text;
    lastSpokenTimeRef.current = now;
  };
  
  // Current pose data
  const currentPose = safeSession.length > currentIndex ? safeSession[currentIndex] : DEFAULT_POSE;

  // Initialize timer when pose changes
  useEffect(() => {
    setHoldTimeLeft(currentPose.duration * 15);
    setAccuracy(0);
    setIsPerfect(false);
    lastValidPoseTimeRef.current = null;
    prevLandmarksRef.current = null;
    lowVisibilityStartTimesRef.current = {};
    speakFeedbackThrottled(`Next pose: ${currentPose.englishName}. Step into the frame.`, true);
  }, [currentIndex, currentPose.id]);

  const currentIndexRef = useRef(currentIndex);
  
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Main Timer Loop
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const delta = (now - lastTickTime.current) / 1000;
      lastTickTime.current = now;

      setHoldTimeLeft(prev => {
        const isTrackingValid = accuracyRef.current >= 85;
        if (isTrackingValid) {
          lastValidPoseTimeRef.current = now;
          if (prev > 0 && !sessionComplete) {
            const newTime = prev - delta;
            if (newTime <= 0) {
              // Use a timeout to prevent state update conflicts in requestAnimationFrame
              setTimeout(() => handlePoseComplete(), 0);
              return currentPose.duration * 15; // reset to full duration
            }
            return newTime;
          }
        } else {
          // If tracking is lost and it has been more than 2 seconds since last valid pose
          const timeSinceLastValid = lastValidPoseTimeRef.current ? (now - lastValidPoseTimeRef.current) : Infinity;
          if (timeSinceLastValid > 2000 && prev < currentPose.duration * 15) {
            // Reset to full duration
            return currentPose.duration * 15;
          }
        }
        return prev;
      });

      requestRef.current = requestAnimationFrame(tick);
    };
    
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, [sessionComplete, currentPose.id, currentPose.duration]);

  const handlePoseComplete = () => {
    playSound.chime();
    speakFeedbackThrottled("Pose completed successfully. Great job.", true);
    
    if (currentIndexRef.current < safeSession.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    setSessionComplete(true);
    const totalTimeSecs = Math.round((Date.now() - sessionStartTime.current) / 1000);
    const avgAcc = accuracyHistory.current.length > 0 
      ? Math.round(accuracyHistory.current.reduce((a, b) => a + b, 0) / accuracyHistory.current.length) 
      : 0;
    
    const commonMistakes = Object.entries(mistakesTracker.current)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    const finalStats = {
      average_accuracy: avgAcc,
      total_time: totalTimeSecs,
      completed_poses: safeSession.length,
      common_mistakes: commonMistakes
    };

    setSessionStats({
      averageAccuracy: avgAcc,
      totalTime: totalTimeSecs,
      totalPoses: safeSession.length
    });

    // Save to memory
    await WellnessMemory.logActivity('ai_session', 'AI Coaching', `${safeSession.length} Poses`, totalTimeSecs / 60);
    await WellnessMemory.logSessionStats(finalStats);

    speakFeedbackThrottled("Session complete! Excellent work today. I am analyzing your performance now.", true);

    // Generate post-session insight
    const pastSessions = WellnessMemory.getSessionHistory(30);
    const aiInsight = await generateSessionSummary(finalStats, pastSessions);
    await WellnessMemory.addObservation(aiInsight);
  };

  // MediaPipe Initialization
  useEffect(() => {
    isUnmountedRef.current = false;

    const loadScript = (src) => new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

    async function initMediaPipe() {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        if (isUnmountedRef.current) return;
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        if (isUnmountedRef.current) return;
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
        if (isUnmountedRef.current) return;
        
        startCamera();
      } catch (e) {
        console.error("Failed to load MediaPipe:", e);
        setFeedback("Failed to load computer vision engine.");
      }
    }

    function startCamera() {
      if (isUnmountedRef.current) return;

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;
      const canvasCtx = canvasElement.getContext('2d');

      function onResults(results) {
        if (isUnmountedRef.current) return;

        if (!isLoadedRef.current) {
          isLoadedRef.current = true;
        }

        // Inference FPS tracking
        const now = Date.now();
        poseFramesCount.current += 1;
        if (now - lastPoseFpsTime.current > 1000) {
          currentPoseFps.current = Math.round((poseFramesCount.current * 1000) / (now - lastPoseFpsTime.current));
          poseFramesCount.current = 0;
          lastPoseFpsTime.current = now;
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        // Apply EMA Coordinate & Visibility Smoothing (alpha = 0.4 for smooth yoga poses)
        let smoothedLandmarks = null;
        if (results.poseLandmarks) {
          const alpha = 0.4;
          if (!prevLandmarksRef.current) {
            prevLandmarksRef.current = JSON.parse(JSON.stringify(results.poseLandmarks));
          } else {
            prevLandmarksRef.current = results.poseLandmarks.map((lm, i) => {
              const prevLm = prevLandmarksRef.current[i] || lm;
              return {
                x: lm.x * alpha + prevLm.x * (1 - alpha),
                y: lm.y * alpha + prevLm.y * (1 - alpha),
                z: lm.z * alpha + prevLm.z * (1 - alpha),
                visibility: lm.visibility * alpha + prevLm.visibility * (1 - alpha)
              };
            });
          }

          // Deep clone smoothed landmarks to apply grace-period/hysteresis visibility adjustments
          smoothedLandmarks = JSON.parse(JSON.stringify(prevLandmarksRef.current));

          // Record true smoothed visibility and apply 400ms grace period visibility hysteresis
          smoothedLandmarks.forEach((lm, i) => {
            actualSmoothedVisibilityRef.current[i] = lm.visibility;
            if (lm.visibility < 0.5) {
              if (!lowVisibilityStartTimesRef.current[i]) {
                lowVisibilityStartTimesRef.current[i] = now;
              }
              const elapsed = now - lowVisibilityStartTimesRef.current[i];
              if (elapsed < 400) {
                // Temporarily bypass immediate joint tracking loss
                lm.visibility = 0.51;
              }
            } else {
              delete lowVisibilityStartTimesRef.current[i];
            }
          });
        } else {
          prevLandmarksRef.current = null;
        }

        const activePoseId = safeSession[currentIndexRef.current]?.id || 'generic';

        if (smoothedLandmarks && window.drawConnectors && window.drawLandmarks) {
          window.drawConnectors(canvasCtx, smoothedLandmarks, window.POSE_CONNECTIONS, { color: 'rgba(255, 255, 255, 0.4)', lineWidth: 4 });
          window.drawLandmarks(canvasCtx, smoothedLandmarks, { color: 'var(--accent-gold)', lineWidth: 2, radius: 4 });

          const analysis = analyzePose(smoothedLandmarks, activePoseId);
          accuracyRef.current = analysis.accuracy;

          // Compute diagnostic statistics for active key joints
          const activeKeyJoints = GET_POSE_KEY_JOINTS(activePoseId);
          let avgVis = 0;
          let lowestVis = 1.0;
          let lowestJoint = 'None';
          
          if (smoothedLandmarks.length > 0) {
            let visSum = 0;
            smoothedLandmarks.forEach((lm) => {
              visSum += lm.visibility || 0;
            });
            avgVis = visSum / smoothedLandmarks.length;

            const jointsToScan = activeKeyJoints.length > 0 ? activeKeyJoints : Array.from({length: 33}, (_, i) => i);
            jointsToScan.forEach(idx => {
              const vis = actualSmoothedVisibilityRef.current[idx] !== undefined ? actualSmoothedVisibilityRef.current[idx] : (smoothedLandmarks[idx]?.visibility || 0);
              if (vis < lowestVis) {
                lowestVis = vis;
                lowestJoint = KEY_JOINTS[idx] || `joint ${idx}`;
              }
            });
          }

          // Throttle React UI and Debug HUD updates to ~5 FPS to eliminate rendering lag
          if (now - lastUiUpdateTime.current > 200) {
            lastUiUpdateTime.current = now;
            setAccuracy(analysis.accuracy);
            accuracyHistory.current.push(analysis.accuracy);
            setFeedback(analysis.feedback);
            setIsPerfect(analysis.accuracy >= 85);

            // Determine pose loss reason
            let poseLossReason = 'None';
            let missingJoint = null;
            for (const idx of activeKeyJoints) {
              const vis = actualSmoothedVisibilityRef.current[idx];
              if (vis < 0.5) {
                const durationBelow = lowVisibilityStartTimesRef.current[idx] ? (now - lowVisibilityStartTimesRef.current[idx]) : 0;
                if (durationBelow >= 400) {
                  missingJoint = KEY_JOINTS[idx] || `joint ${idx}`;
                  break;
                }
              }
            }

            if (missingJoint) {
              poseLossReason = `Missing joint: ${missingJoint}`;
            } else if (analysis.accuracy < 85) {
              poseLossReason = `Poor alignment: ${analysis.feedback}`;
            }

            const speechEnabled = !!window.speechSynthesis;
            const speechQueueLength = window.speechSynthesis ? (window.speechSynthesis.pending ? 1 : 0) : 0;
            const lastSpeechEvent = lastSpokenTextRef.current 
              ? `"${lastSpokenTextRef.current}" (${Math.round((now - lastSpokenTimeRef.current)/1000)}s ago)`
              : 'None';

            setDebugStats({
              cameraFps: currentCameraFps.current,
              poseFps: currentPoseFps.current,
              received: framesReceivedCountRef.current,
              processed: framesProcessedCountRef.current,
              dropped: framesDroppedCountRef.current,
              poseDetected: true,
              avgVisibility: avgVis,
              lowestJointName: lowestJoint,
              lowestJointVis: lowestVis,
              poseLossReason: poseLossReason,
              lastValidSecsAgo: analysis.accuracy >= 85 ? 'Active' : lastValidSecs,
              currentPoseName: `${currentPose.englishName} (${currentPose.id})`,
              poseMatched: analysis.accuracy >= 85 ? 'YES' : 'NO',
              angleScore: analysis.angleScore !== undefined ? analysis.angleScore : analysis.accuracy,
              visibilityScore: analysis.visibilityScore !== undefined ? analysis.visibilityScore : lowestVis,
              finalAccuracy: analysis.accuracy,
              speechEnabled,
              speechTriggered: lastSpokenTimeRef.current === now ? 'YES' : 'NO',
              speechQueueLength,
              lastSpeechEvent,
              requiredAngles: analysis.requiredAngles || 'N/A',
              currentAngles: analysis.currentAngles || 'N/A',
              angleErrors: analysis.angleErrors || 'None',
              poseMatchReason: analysis.poseMatchReason || 'None',
              poseRejectionReason: analysis.poseRejectionReason || 'None'
            });

            if (analysis.accuracy >= 85) {
              speakFeedbackThrottled("Great posture. Hold it there.");
            } else if (analysis.accuracy > 0 && analysis.accuracy < 85) {
              speakFeedbackThrottled(analysis.feedback);
              mistakesTracker.current[analysis.feedback] = (mistakesTracker.current[analysis.feedback] || 0) + 1;
            }
          }

        } else if (!results.poseLandmarks) {
          // No landmarks detected - update accuracy & reasons within the 5 FPS throttled block
          if (now - lastUiUpdateTime.current > 200) {
            lastUiUpdateTime.current = now;
            setAccuracy(0);
            setFeedback("No pose detected. Step into the frame.");
            setIsPerfect(false);

            const lastValidSecs = lastValidPoseTimeRef.current 
              ? `${((now - lastValidPoseTimeRef.current) / 1000).toFixed(1)}s ago`
              : 'Never';

            setDebugStats(prev => ({
              ...prev,
              cameraFps: currentCameraFps.current,
              poseFps: currentPoseFps.current,
              received: framesReceivedCountRef.current,
              processed: framesProcessedCountRef.current,
              dropped: framesDroppedCountRef.current,
              poseDetected: false,
              avgVisibility: 0,
              lowestJointName: 'N/A',
              lowestJointVis: 0,
              poseLossReason: 'No user detected in camera frame',
              lastValidSecsAgo: lastValidSecs,
              currentPoseName: `${currentPose.englishName} (${currentPose.id})`,
              poseMatched: 'NO',
              angleScore: 0,
              visibilityScore: 0,
              finalAccuracy: 0,
              speechEnabled: !!window.speechSynthesis,
              speechTriggered: 'NO',
              speechQueueLength: window.speechSynthesis ? (window.speechSynthesis.pending ? 1 : 0) : 0,
              lastSpeechEvent: lastSpokenTextRef.current 
                ? `"${lastSpokenTextRef.current}" (${Math.round((now - lastSpokenTimeRef.current)/1000)}s ago)`
                : 'None',
              requiredAngles: 'N/A',
              currentAngles: 'N/A',
              angleErrors: 'No user detected',
              poseMatchReason: 'None',
              poseRejectionReason: 'No user detected in camera frame'
            }));
          }
        }
        canvasCtx.restore();
      }

      poseInstanceRef.current = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      poseInstanceRef.current.setOptions({
        modelComplexity: 0, // Lite model for speed on lower-end devices
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      poseInstanceRef.current.onResults(onResults);

      cameraRef.current = new window.Camera(videoElement, {
        onFrame: async () => {
          if (isUnmountedRef.current || sessionComplete) return;

          framesReceivedCountRef.current += 1;
          const now = Date.now();

          // Camera FPS tracking
          cameraFramesCount.current += 1;
          if (now - lastCameraFpsTime.current > 1000) {
            currentCameraFps.current = Math.round((cameraFramesCount.current * 1000) / (now - lastCameraFpsTime.current));
            cameraFramesCount.current = 0;
            lastCameraFpsTime.current = now;
          }

          // Strict Concurrency Lock: Drop overlapping frames to prevent WebAssembly stack queue drifts/freezes
          if (isProcessingRef.current) {
            framesDroppedCountRef.current += 1;
            return;
          }

          if (videoRef.current) {
            isProcessingRef.current = true;
            framesProcessedCountRef.current += 1;
            try {
              await poseInstanceRef.current.send({ image: videoRef.current });
            } catch (err) {
              console.error("Error sending frame to MediaPipe Pose:", err);
            } finally {
              isProcessingRef.current = false;
            }
          }
        },
        width: 640,
        height: 480
      });

      cameraRef.current.start();
    }

    initMediaPipe();

    return () => {
      isUnmountedRef.current = true;
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.error("Error stopping camera:", e);
        }
        cameraRef.current = null;
      }
      if (poseInstanceRef.current) {
        try {
          poseInstanceRef.current.close();
        } catch (e) {
          console.error("Error closing pose:", e);
        }
        poseInstanceRef.current = null;
      }
      speechHelper.cancel();
    };
  }, [sessionComplete]);

  // Calculate circular progress
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const totalHoldTime = currentPose.duration * 15;
  const strokeDashoffset = circumference - ((totalHoldTime - holdTimeLeft) / totalHoldTime) * circumference;

  if (sessionComplete) {
    return createPortal(
      <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '100vw', zIndex: 9999, backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '42px', color: 'var(--accent-gold)', marginBottom: '16px' }}>Session Complete</h2>
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌟</div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Average Accuracy</div>
            <div style={{ fontSize: '32px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{sessionStats.averageAccuracy}%</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Duration</div>
              <div style={{ fontSize: '18px' }}>{Math.floor(sessionStats.totalTime / 60)}m {sessionStats.totalTime % 60}s</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Poses</div>
              <div style={{ fontSize: '18px' }}>{sessionStats.totalPoses}</div>
            </div>
          </div>
          <button className="submit-btn" onClick={onExit}>Return to Dashboard</button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, height: '100vh', width: '100vw', backgroundColor: '#000', overflow: 'hidden' }}>
      
      {/* Hidden Video Element */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline></video>
      
      {/* Canvas Overlay */}
      <canvas 
        ref={canvasRef} 
        width={640} 
        height={480} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
      ></canvas>

      {/* Top Header */}
      <div style={{ position: 'absolute', top: '40px', left: '0', right: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 24px', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-icon" onClick={onExit} style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', backdropFilter: 'blur(10px)' }}>
            <ArrowLeft size={24} />
          </button>
          <button 
            className="btn-icon" 
            onClick={() => setShowDebug(!showDebug)} 
            style={{ 
              background: showDebug ? 'var(--accent-gold)' : 'rgba(0,0,0,0.6)', 
              color: showDebug ? 'var(--bg-primary)' : 'white', 
              border: showDebug ? 'none' : '1px solid rgba(255,255,255,0.2)', 
              backdropFilter: 'blur(10px)',
              cursor: 'pointer'
            }}
            title="Toggle Debug HUD"
          >
            <Activity size={24} />
          </button>
        </div>

        {/* Dynamic Analytics HUD */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Accuracy Score */}
          <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={20} color={accuracy >= 85 ? '#4caf50' : '#ff9800'} />
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Accuracy</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: "'Cormorant Garamond', serif" }}>{accuracy}%</div>
            </div>
          </div>

          {/* Reference Pose PiP */}
          {currentPose.id !== 'generic' && (
            <div style={{ width: '160px', height: '120px', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', background: '#111', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <img 
                src={currentPose.imageUrl} 
                alt={currentPose.englishName} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.8)', padding: '4px 8px', fontSize: '12px', color: 'white', textAlign: 'center' }}>
                {currentPose.englishName}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diagnostics Debug Panel HUD */}
      {showDebug && (
        <div style={{
          position: 'absolute',
          top: '160px',
          right: '24px',
          width: '280px',
          background: 'rgba(13, 13, 15, 0.85)',
          border: '1px solid var(--accent-gold)',
          borderRadius: '12px',
          padding: '16px',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '11px',
          zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold', borderBottom: '1px solid rgba(196,169,106,0.3)', paddingBottom: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>TRACKING DIAGNOSTICS</span>
            <span style={{ fontSize: '9px', opacity: 0.6 }}>v1.1</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px 12px' }}>
            <div>Camera FPS:</div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', color: debugStats.cameraFps > 20 ? '#4caf50' : '#ff9800' }}>{debugStats.cameraFps}</div>

            <div>Inference FPS:</div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', color: debugStats.poseFps > 20 ? '#4caf50' : '#ff9800' }}>{debugStats.poseFps}</div>

            <div>Received Frms:</div>
            <div style={{ textAlign: 'right' }}>{debugStats.received}</div>

            <div>Processed:</div>
            <div style={{ textAlign: 'right' }}>{debugStats.processed}</div>

            <div>Dropped:</div>
            <div style={{ textAlign: 'right', color: debugStats.dropped > 0 ? '#f44336' : '#fff' }}>{debugStats.dropped}</div>

            <div>Pose Detected:</div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', color: debugStats.poseDetected ? '#4caf50' : '#f44336' }}>{debugStats.poseDetected ? 'YES' : 'NO'}</div>

            <div>Avg Joint Vis:</div>
            <div style={{ textAlign: 'right' }}>{debugStats.avgVisibility.toFixed(2)}</div>

            <div>Lowest Joint:</div>
            <div style={{ textAlign: 'right', fontSize: '9px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={debugStats.lowestJointName}>
              {debugStats.lowestJointName}
            </div>

            <div>Min Joint Vis:</div>
            <div style={{ textAlign: 'right', color: debugStats.lowestJointVis < 0.5 ? '#f44336' : '#4caf50' }}>{debugStats.lowestJointVis.toFixed(2)}</div>

            <div>Last Valid Hold:</div>
            <div style={{ textAlign: 'right' }}>{debugStats.lastValidSecsAgo}</div>

            {/* Temporary debug outputs */}
            <div>Target Pose:</div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{debugStats.currentPoseName}</div>

            <div>Pose Matched:</div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', color: debugStats.poseMatched === 'YES' ? '#4caf50' : '#ff9800' }}>{debugStats.poseMatched}</div>

            <div>Final Accuracy:</div>
            <div style={{ textAlign: 'right', fontWeight: 'bold' }}>{debugStats.finalAccuracy}%</div>

            <div>Angle Score:</div>
            <div style={{ textAlign: 'right' }}>{debugStats.angleScore}%</div>

            <div>Vis Score:</div>
            <div style={{ textAlign: 'right' }}>{debugStats.visibilityScore}</div>

            <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(196,169,106,0.15)', paddingTop: '4px', marginTop: '4px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Required Angles:</div>
              <div style={{ color: '#fff', fontSize: '9px', whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>{debugStats.requiredAngles}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Current Angles:</div>
              <div style={{ color: '#fff', fontSize: '9px', whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>{debugStats.currentAngles}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Angle Errors:</div>
              <div style={{ color: debugStats.angleErrors !== 'None' ? '#ff9800' : '#4caf50', fontSize: '9px', whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>{debugStats.angleErrors}</div>
            </div>

            <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(196,169,106,0.15)', paddingTop: '4px', marginTop: '4px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Pose Match Reason:</div>
              <div style={{ color: '#4caf50', fontSize: '9px', whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>{debugStats.poseMatchReason}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Pose Rejection Reason:</div>
              <div style={{ color: debugStats.poseRejectionReason !== 'None' ? '#ff9800' : '#4caf50', fontSize: '9px', whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>{debugStats.poseRejectionReason}</div>
            </div>

            <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(196,169,106,0.15)', paddingTop: '4px', marginTop: '4px' }}></div>

            <div>Speech Enabled:</div>
            <div style={{ textAlign: 'right' }}>{debugStats.speechEnabled ? 'YES' : 'NO'}</div>

            <div>Speech Trigger:</div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', color: debugStats.speechTriggered === 'YES' ? '#4caf50' : '#fff' }}>{debugStats.speechTriggered}</div>

            <div>Speech Q Len:</div>
            <div style={{ textAlign: 'right' }}>{debugStats.speechQueueLength}</div>
          </div>
          <div style={{ marginTop: '8px', borderTop: '1px solid rgba(196,169,106,0.15)', paddingTop: '6px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Last Speech:</div>
            <div style={{ color: '#fff', fontSize: '9px', wordBreak: 'break-word', marginTop: '2px' }}>{debugStats.lastSpeechEvent}</div>

            <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '6px' }}>Loss Reason:</div>
            <div style={{ color: debugStats.poseLossReason !== 'None' ? '#ff9800' : '#4caf50', marginTop: '2px', wordBreak: 'break-word', fontSize: '10px' }}>
              {debugStats.poseLossReason}
            </div>
          </div>
        </div>
      )}

      {/* Timer & Hold Progress */}
      <div style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
        <div style={{ position: 'relative', width: '80px', height: '80px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="80" height="80" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle 
              cx="40" cy="40" r={radius} fill="none" 
              stroke={accuracy >= 85 ? 'var(--accent-gold)' : '#ff9800'} 
              strokeWidth="4" strokeLinecap="round" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{Math.ceil(holdTimeLeft)}s</div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>HOLD</div>
          </div>
        </div>
        {accuracy < 85 && holdTimeLeft < totalHoldTime && (
          <div style={{ color: '#ff9800', fontSize: '12px', marginTop: '8px', textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '8px' }}>Paused</div>
        )}
      </div>

      {/* Bottom Feedback Bar */}
      <div style={{ position: 'absolute', bottom: '40px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
        <div style={{ 
          background: isPerfect ? 'rgba(76, 175, 80, 0.9)' : 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(10px)',
          padding: '16px 32px', 
          borderRadius: '30px', 
          color: 'white', 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
          maxWidth: '60%'
        }}>
          {isPerfect && <CheckCircle size={24} />}
          {feedback}
        </div>

        <button className="btn-outline" onClick={handlePoseComplete} style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
          Skip Pose <ChevronRight size={16} style={{ marginLeft: '8px' }}/>
        </button>
      </div>
    </div>,
    document.body
  );
}
