import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, CheckCircle, Activity, Timer, ChevronRight } from 'lucide-react';
import { speechHelper } from '../lib/speech';
import { analyzePose } from '../lib/poseAnalyzer';
import { playSound } from '../lib/audio';
import { WellnessMemory } from '../lib/wellnessMemory';
import { generateSessionSummary } from '../lib/ai';

export default function MediaPipePose({ session = [], initialPoseIndex = 0, onExit }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
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
  
  // Current pose data
  const defaultPose = { id: 'generic', englishName: "Free Practice", duration: 1, imageUrl: "https://placehold.co/800x600/13131a/c4a96a?text=Practice" };
  const currentPose = safeSession.length > currentIndex ? safeSession[currentIndex] : defaultPose;

  // Initialize timer when pose changes
  useEffect(() => {
    setHoldTimeLeft(currentPose.duration * 60); // duration is usually minutes, let's assume it's minutes for yoga plan but maybe we just do 30 seconds for AI MVP?
    // Let's force a 30 second hold for the AI MVP to make it testable, unless duration is specified in seconds.
    setHoldTimeLeft(30); 
    setAccuracy(0);
    setIsPerfect(false);
    speechHelper.speak(`Next pose: ${currentPose.englishName}. Step into the frame.`);
  }, [currentIndex, currentPose]);

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
        if (accuracyRef.current >= 85 && prev > 0 && !sessionComplete) {
          const newTime = prev - delta;
          if (newTime <= 0) {
            // Use a timeout to prevent state update conflicts in requestAnimationFrame
            setTimeout(() => handlePoseComplete(), 0);
            return 30; // reset to 30 immediately to avoid repeated completions
          }
          return newTime;
        }
        return prev;
      });

      requestRef.current = requestAnimationFrame(tick);
    };
    
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, [sessionComplete]);

  const handlePoseComplete = () => {
    playSound.chime();
    speechHelper.speak("Pose completed successfully. Great job.", true);
    
    if (currentIndex < session.length - 1) {
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

    speechHelper.speak("Session complete! Excellent work today. I am analyzing your performance now.");

    // Generate post-session insight
    const pastSessions = WellnessMemory.getSessionHistory(30);
    const aiInsight = await generateSessionSummary(finalStats, pastSessions);
    await WellnessMemory.addObservation(aiInsight);
  };

  // MediaPipe Initialization
  useEffect(() => {
    const loadScript = (src) => new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

    let camera = null;
    let poseObj = null;

    async function initMediaPipe() {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
        startCamera();
      } catch (e) {
        console.error("Failed to load MediaPipe:", e);
        setFeedback("Failed to load computer vision engine.");
      }
    }

    function startCamera() {
      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;
      const canvasCtx = canvasElement.getContext('2d');

      function onResults(results) {
        if (!isLoaded) {
          setIsLoaded(true);
          setFeedback("Camera ready. Analyzing posture...");
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.poseLandmarks && window.drawConnectors && window.drawLandmarks) {
          window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, { color: 'rgba(255, 255, 255, 0.4)', lineWidth: 4 });
          window.drawLandmarks(canvasCtx, results.poseLandmarks, { color: 'var(--accent-gold)', lineWidth: 2, radius: 4 });

          const activePoseId = safeSession[currentIndexRef.current]?.id || 'generic';
          const analysis = analyzePose(results.poseLandmarks, activePoseId);
          
          accuracyRef.current = analysis.accuracy;

          // Throttle React UI updates to ~5 times a second to prevent lag
          const now = Date.now();
          if (now - lastUiUpdateTime.current > 200) {
            lastUiUpdateTime.current = now;
            setAccuracy(analysis.accuracy);
            accuracyHistory.current.push(analysis.accuracy);
            setFeedback(analysis.feedback);
            setIsPerfect(analysis.accuracy >= 85);

            if (analysis.accuracy >= 85) {
              speechHelper.speak("Great posture. Hold it there.");
            } else if (analysis.accuracy > 0 && analysis.accuracy < 85) {
              speechHelper.speak(analysis.feedback);
              // Track mistake frequencies
              mistakesTracker.current[analysis.feedback] = (mistakesTracker.current[analysis.feedback] || 0) + 1;
            }
          }

        } else if (!results.poseLandmarks) {
          setAccuracy(0);
          setFeedback("No pose detected. Step into the frame.");
          setIsPerfect(false);
        }
        canvasCtx.restore();
      }

      poseObj = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      poseObj.setOptions({
        modelComplexity: 0, // Lite model for maximum performance/parallel processing feel
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      poseObj.onResults(onResults);

      camera = new window.Camera(videoElement, {
        onFrame: async () => {
          if (videoRef.current && !sessionComplete) {
            await poseObj.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });

      camera.start();
    }

    initMediaPipe();

    return () => {
      if (camera) camera.stop();
      if (poseObj) poseObj.close();
      speechHelper.cancel();
    };
  }, [sessionComplete]); // Removed isLoaded to prevent camera re-initialization crash

  // Calculate circular progress
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const totalHoldTime = 30; // MVP default
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
        <button className="btn-icon" onClick={onExit} style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', backdropFilter: 'blur(10px)' }}>
          <ArrowLeft size={24} />
        </button>

        {/* Dynamic Analytics Hud */}
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
