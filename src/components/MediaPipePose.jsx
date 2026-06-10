import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { speechHelper } from '../lib/speech';

export default function MediaPipePose({ initialPose = "Tree Pose", onExit }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [feedback, setFeedback] = useState("Initializing camera...");
  const [isPerfect, setIsPerfect] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');
    
    let camera = null;

    function onResults(results) {
      if (!isLoaded) {
        setIsLoaded(true);
        setFeedback("Camera ready. Step back so your full body is visible.");
        speechHelper.speak("Camera ready. Please step back so I can see you.");
      }

      // Draw standard video frame
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      // Draw mirrored video
      canvasCtx.translate(canvasElement.width, 0);
      canvasCtx.scale(-1, 1);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.poseLandmarks) {
        // Draw the skeleton
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: 'rgba(255, 255, 255, 0.5)', lineWidth: 4 });
        drawLandmarks(canvasCtx, results.poseLandmarks, { color: 'var(--accent-gold)', lineWidth: 2, radius: 4 });

        // MVP Posture Logic (Checking for Raised Arms / Tree Pose)
        const leftShoulder = results.poseLandmarks[11];
        const rightShoulder = results.poseLandmarks[12];
        const leftWrist = results.poseLandmarks[15];
        const rightWrist = results.poseLandmarks[16];

        if (leftShoulder && rightShoulder && leftWrist && rightWrist) {
          // In MediaPipe, y=0 is top of the screen.
          // If wrists are below the shoulders (meaning y is larger), arms are down.
          const leftArmRaised = leftWrist.y < leftShoulder.y;
          const rightArmRaised = rightWrist.y < rightShoulder.y;

          if (leftArmRaised && rightArmRaised) {
            setFeedback("Perfect! Hold that pose.");
            setIsPerfect(true);
            speechHelper.speak("Great job! Hold it there.");
          } else {
            setFeedback("Raise your arms a little higher.");
            setIsPerfect(false);
            speechHelper.speak("Raise your arms a little higher.");
          }
        }
      } else {
        setFeedback("No pose detected. Make sure you are in frame.");
        setIsPerfect(false);
      }
      canvasCtx.restore();
    }

    const pose = new Pose({
      locateFile: (file) => {
        return \`https://cdn.jsdelivr.net/npm/@mediapipe/pose/\${file}\`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);

    camera = new Camera(videoElement, {
      onFrame: async () => {
        if (videoRef.current) {
          await pose.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });

    camera.start();

    return () => {
      if (camera) camera.stop();
      if (pose) pose.close();
      speechHelper.cancel();
    };
  }, [isLoaded]);

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
      
      {/* Hidden Video Element (used as source) */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline></video>
      
      {/* Canvas Overlay for Skeleton */}
      <canvas 
        ref={canvasRef} 
        width={640} 
        height={480} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
      ></canvas>

      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: '40px', left: '0', right: '0', display: 'flex', justifyContent: 'space-between', padding: '0 24px', zIndex: 10 }}>
        <button className="btn-icon" onClick={onExit} style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '20px', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontSize: '20px' }}>
          {initialPose}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '40px', left: '24px', right: '24px', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ 
          background: isPerfect ? 'rgba(76, 175, 80, 0.9)' : 'rgba(0,0,0,0.7)', 
          padding: '16px 32px', 
          borderRadius: '30px', 
          color: 'white', 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}>
          {isPerfect && <CheckCircle size={24} />}
          {feedback}
        </div>
      </div>
    </div>
  );
}
