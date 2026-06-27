import React from 'react';

export default function SkeletonLoader({ type = 'text', count = 1 }) {
  const getStyle = () => {
    switch(type) {
      case 'title': return { height: '32px', width: '60%', marginBottom: '16px', borderRadius: '4px' };
      case 'text': return { height: '16px', width: '100%', marginBottom: '8px', borderRadius: '4px' };
      case 'card': return { height: '200px', width: '100%', borderRadius: '12px', marginBottom: '16px' };
      case 'pose': return { height: '120px', width: '100%', borderRadius: '8px', marginBottom: '12px' };
      default: return { height: '20px', width: '100%', borderRadius: '4px' };
    }
  };

  return (
    <div className="skeleton-wrapper">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton-pulse" style={getStyle()} />
      ))}
    </div>
  );
}
