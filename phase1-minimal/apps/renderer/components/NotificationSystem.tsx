import React, { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onRemove }) => {
  useEffect(() => {
    const timers = notifications.map(notification => {
      const duration = notification.duration || 5000;
      return setTimeout(() => {
        onRemove(notification.id);
      }, duration);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, onRemove]);

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          icon: '✓'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          icon: '✕'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          icon: '⚠'
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          icon: 'ℹ'
        };
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }

        .notifications-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        .notification {
          min-width: 300px;
          max-width: 400px;
          padding: 16px 20px;
          border-radius: 12px;
          color: white;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          animation: slideInRight 0.3s ease-out;
          pointer-events: auto;
          backdrop-filter: blur(10px);
        }

        .notification-icon {
          font-size: 20px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .notification-message {
          flex: 1;
          font-size: 14px;
          line-height: 1.5;
        }

        .notification-close {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
          font-size: 18px;
          flex-shrink: 0;
        }

        .notification-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div className="notifications-container">
        {notifications.map(notification => {
          const styles = getTypeStyles(notification.type);
          return (
            <div
              key={notification.id}
              className="notification"
              style={{ background: styles.background }}
            >
              <div className="notification-icon">{styles.icon}</div>
              <div className="notification-message">{notification.message}</div>
              <button
                className="notification-close"
                onClick={() => onRemove(notification.id)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    message: string,
    type: Notification['type'] = 'info',
    duration?: number
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification
  };
};

