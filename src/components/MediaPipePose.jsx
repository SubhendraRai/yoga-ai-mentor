// src/components/MediaPipePose.jsx
import { ArrowLeft } from 'lucide-react';

export default function MediaPipePose({ initialPose = "Tree Pose", onExit }) {
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: 'white' }}>
      <h2>Camera MVP (Coming in Phase 5)</h2>
      <p>Practicing: {initialPose}</p>
      <button className="submit-btn" onClick={onExit} style={{ marginTop: '20px', maxWidth: '200px' }}>
        <ArrowLeft size={16} /> End Practice
      </button>
    </div>
  );
}
