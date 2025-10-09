import React, { useState, useEffect } from 'react';

const Bubble: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }
        
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        
        @keyframes glow {
          0%, 100% { 
            box-shadow: 
              0 0 0 1px rgba(255, 255, 255, 0.1),
              0 8px 32px rgba(59, 130, 246, 0.3),
              0 4px 12px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 0 0 0 rgba(59, 130, 246, 0.7); 
          }
          50% { 
            box-shadow: 
              0 0 0 1px rgba(255, 255, 255, 0.2),
              0 12px 40px rgba(59, 130, 246, 0.4),
              0 6px 16px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              0 0 0 8px rgba(59, 130, 246, 0); 
          }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
          40% { transform: translateY(-8px) scale(1.05); }
          60% { transform: translateY(-4px) scale(1.02); }
        }
        
        .bubble-container {
          position: relative;
          width: 72px;
          height: 72px;
          cursor: pointer;
          user-select: none;
          animation: float 6s ease-in-out infinite;
        }
        
        .bubble-main {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #1a1a1a;
          border: 2px solid #333;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 4px 12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .bubble-main.dark {
          background: #0a0a0a;
          border: 2px solid #222;
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 4px 12px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        
        .bubble-main:hover {
          transform: scale(1.1) rotate(5deg);
          animation: glow 2s ease-in-out infinite;
        }
        
        .bubble-main:active {
          transform: scale(0.95);
          animation: bounce 0.6s ease-in-out;
        }
        
        .bubble-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.4) 0%, 
            rgba(147, 51, 234, 0.4) 100%);
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
          z-index: -1;
        }
        
        .bubble-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
          transition: all 0.3s ease;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
        }
        
        .bubble-main:hover .bubble-icon {
          transform: scale(1.1);
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15)) brightness(1.1);
        }
        
        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 50%;
          border: 2px solid white;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      
      <div 
        className="bubble-container"
        onClick={() => {
          console.log('Bubble clicked!');
          setIsClicked(true);
          setTimeout(() => setIsClicked(false), 600);
          // Send IPC message to main process
          if ((window as any).electronAPI?.bubbleClicked) {
            (window as any).electronAPI.bubbleClicked();
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="bubble-pulse" />
        <div className={`bubble-main ${isDarkMode ? 'dark' : ''}`}>
          <img
            src="./favicon100x100.png"
            alt="AI Assistant"
            className="bubble-icon"
          />
        </div>
        {/* Uncomment to show notification dot */}
        {/* <div className="notification-dot" /> */}
      </div>
    </>
  );
};

export default Bubble;
