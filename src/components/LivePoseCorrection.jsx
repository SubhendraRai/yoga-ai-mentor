import { useState, useEffect, useRef } from 'react';
import { GeminiLiveSession } from '../lib/geminiLive';
import { Camera, CameraOff, AlertCircle, Play, Square, Info } from 'lucide-react';

export default function LivePoseCorrection({ initialPose }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const sessionRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const feedbackEndRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    // Cleanup on unmount
    return () => stopSession();
  }, []);

  useEffect(() => {
    if (feedbackEndRef.current) {
      feedbackEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [feedback]);

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setError('');
    } catch (err) {
      setError('Camera access denied. Please grant permission in your browser settings.');
      console.error('Camera error:', err);
    }
  };

  const startSession = async () => {
    if (!hasPermission) await requestCamera();
    if (!streamRef.current) return;
    
    setError('');
    setIsActive(true);
    setStatus('connecting');
    setFeedback([{ id: 'sys_1', text: 'Connecting to AI Mentor...', time: new Date().toLocaleTimeString(), isSystem: true }]);

    try {
      sessionRef.current = new GeminiLiveSession(apiKey, {
        onConnected: () => {
          setStatus('connected');
          setFeedback(prev => [...prev, { id: 'sys_2', text: 'Connected! Analyzing your posture...', time: new Date().toLocaleTimeString(), isSystem: true }]);
          if (initialPose) {
            sessionRef.current.sendTextPrompt(`I am now attempting ${initialPose}. Please provide feedback on my form.`);
          }
          startCaptureLoop();
        },
        onDisconnected: () => {
          setStatus('disconnected');
          setIsActive(false);
          stopCaptureLoop();
          setFeedback(prev => [...prev, { id: 'sys_3', text: 'Session ended.', time: new Date().toLocaleTimeString(), isSystem: true }]);
        },
        onFeedback: (text) => {
          setFeedback(prev => [...prev, { id: Date.now().toString(), text, time: new Date().toLocaleTimeString() }]);
        },
        onError: (err) => {
          setError(err.message || 'Connection error occurred');
          setStatus('disconnected');
          setIsActive(false);
          stopCaptureLoop();
        }
      });

      await sessionRef.current.connect();
    } catch (err) {
      setError('Failed to connect to AI server. Check your connection or API key.');
      setStatus('disconnected');
      setIsActive(false);
    }
  };

  const startCaptureLoop = () => {
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    
    // Capture and send frame every 1 second
    captureIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && sessionRef.current && sessionRef.current.isConnected) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get base64 JPEG data
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        const base64Data = dataUrl.split(',')[1]; // Remove data:image/jpeg;base64,
        
        sessionRef.current.sendFrame(base64Data);
      }
    }, 1000);
  };

  const stopCaptureLoop = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  };

  const stopSession = () => {
    setIsActive(false);
    stopCaptureLoop();
    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }
    setStatus('disconnected');
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setHasPermission(false);
  };

  if (!hasPermission) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '60px 40px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(196, 169, 106, 0.1)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Camera size={32} />
        </div>
        <h2 className="hero-title" style={{ fontSize: '32px' }}>Live Pose Correction</h2>
        <p className="hero-sub" style={{ marginBottom: '24px' }}>
          Your AI mentor uses your camera to analyze your form in real-time and provide personalized adjustments.
        </p>
        <div className="disclaimer" style={{ marginBottom: '32px', textAlign: 'left' }}>
          <Info size={16} style={{ color: 'var(--accent-gold)' }} />
          <span>This is an experimental AI feature. Not a substitute for a certified instructor. Stay within your limits.</span>
        </div>
        {error && <div className="error" style={{ marginBottom: '24px' }}>{error}</div>}
        <button className="submit-btn" style={{ maxWidth: '240px', margin: '0 auto' }} onClick={startSession}>
          Enable Camera & Start
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="hero-title" style={{ fontSize: '28px', margin: 0 }}>
          {initialPose ? `Checking: ${initialPose}` : 'Live Pose Check'}
        </h2>
        {isActive ? (
          <button className="btn-outline" onClick={stopSession} style={{ color: 'var(--error-color)', borderColor: 'var(--error-color)' }}>
            <Square size={14} /> End Session
          </button>
        ) : (
          <button className="btn-outline" onClick={startSession} style={{ color: 'var(--success-color)', borderColor: 'var(--success-color)' }}>
            <Play size={14} /> Resume Session
          </button>
        )}
      </div>

      {error && (
        <div className="error" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="pose-layout">
        {/* CAMERA FEED */}
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline muted />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div className="camera-status">
            <div className={`status-dot ${status}`} />
            {status === 'connected' ? 'AI Active' : status === 'connecting' ? 'Connecting...' : 'Paused'}
          </div>

          {!isActive && (
            <div className="camera-overlay">
              <div style={{ textAlign: 'center' }}>
                <CameraOff size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <div>Feed Paused</div>
              </div>
            </div>
          )}
        </div>

        {/* FEEDBACK PANEL */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={16} className={status === 'connected' ? 'pulse-icon' : ''} style={{ color: 'var(--accent-gold)' }} /> 
            Live Adjustments
          </h3>
          
          <div className="feedback-panel">
            {feedback.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', fontSize: '13px' }}>
                Waiting for connection...
              </div>
            ) : (
              feedback.map(msg => (
                <div key={msg.id} className="feedback-message" style={{ borderLeftColor: msg.isSystem ? 'var(--text-secondary)' : 'var(--accent-gold)' }}>
                  {msg.text}
                  <div className="time">{msg.time}</div>
                </div>
              ))
            )}
            <div ref={feedbackEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
