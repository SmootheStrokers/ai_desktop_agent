import React from 'react';

const Bubble: React.FC = () => {
  return (
    <div
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: '#3b82f6',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'transform 0.2s ease',
        userSelect: 'none',
        position: 'relative'
      }}
      onClick={() => {
        console.log('Bubble clicked!');
        // Send IPC message to main process
        if ((window as any).electronAPI?.bubbleClicked) {
          (window as any).electronAPI.bubbleClicked();
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.background = '#2563eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = '#3b82f6';
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        AI
      </div>
    </div>
  );
};

export default Bubble;
