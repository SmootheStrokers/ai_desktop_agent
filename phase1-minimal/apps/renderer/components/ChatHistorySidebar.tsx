import React, { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  isDarkMode = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'assistant'>('all');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      loadStats();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      const history = await (window as any).electronAPI.getConversationHistory();
      setMessages(history || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const conversationStats = await (window as any).electronAPI.getConversationStats();
      setStats(conversationStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
      try {
        await (window as any).electronAPI.clearConversation();
        setMessages([]);
        loadStats();
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const exported = await (window as any).electronAPI.exportConversation();
      // Create a download link
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting history:', error);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRole === 'all' || msg.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .history-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .history-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 400px;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(248, 250, 252, 0.95) 100%);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          animation: slideInLeft 0.3s ease-out;
          z-index: 1001;
        }

        .history-sidebar.dark {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.95) 0%, 
            rgba(30, 41, 59, 0.95) 100%);
        }

        .history-header {
          padding: 24px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          background: linear-gradient(135deg, 
            rgba(248, 250, 252, 0.8) 0%, 
            rgba(241, 245, 249, 0.8) 100%);
        }

        .history-header.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.8) 0%, 
            rgba(51, 65, 85, 0.8) 100%);
          border-bottom: 1px solid rgba(71, 85, 105, 0.5);
        }

        .history-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .history-title {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .history-title.dark {
          background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .history-close {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .history-close:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .history-search {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid rgba(226, 232, 240, 0.5);
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          background: rgba(255, 255, 255, 0.8);
          transition: all 0.2s;
          margin-bottom: 12px;
        }

        .history-search:focus {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .history-search.dark {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(71, 85, 105, 0.5);
          color: #f1f5f9;
        }

        .history-filters {
          display: flex;
          gap: 8px;
        }

        .filter-button {
          flex: 1;
          padding: 8px 12px;
          border: 2px solid rgba(226, 232, 240, 0.5);
          background: transparent;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #64748b;
        }

        .filter-button.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border-color: transparent;
        }

        .filter-button:hover:not(.active) {
          background: rgba(59, 130, 246, 0.1);
        }

        .filter-button.dark {
          border-color: rgba(71, 85, 105, 0.5);
          color: #94a3b8;
        }

        .history-stats {
          margin-top: 16px;
          padding: 12px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          display: flex;
          justify-content: space-around;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #3b82f6;
        }

        .stat-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .stat-label.dark {
          color: #94a3b8;
        }

        .history-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px;
        }

        .history-content::-webkit-scrollbar {
          width: 8px;
        }

        .history-content::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
        }

        .history-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
          border-radius: 4px;
        }

        .history-message {
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
        }

        .history-message.user {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          margin-left: 20px;
        }

        .history-message.assistant {
          background: linear-gradient(135deg, 
            rgba(248, 250, 252, 0.9) 0%, 
            rgba(241, 245, 249, 0.9) 100%);
          color: #1e293b;
          border: 1px solid rgba(226, 232, 240, 0.5);
          margin-right: 20px;
        }

        .history-message.assistant.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.9) 0%, 
            rgba(51, 65, 85, 0.9) 100%);
          color: #f1f5f9;
          border: 1px solid rgba(71, 85, 105, 0.5);
        }

        .history-actions {
          padding: 16px 24px;
          border-top: 1px solid rgba(226, 232, 240, 0.5);
          display: flex;
          gap: 12px;
        }

        .history-actions.dark {
          border-top: 1px solid rgba(71, 85, 105, 0.5);
        }

        .history-action-button {
          flex: 1;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .history-action-button.export {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .history-action-button.export:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .history-action-button.clear {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .history-action-button.clear:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }
      `}</style>

      <div className="history-overlay" onClick={onClose} />
      <div className={`history-sidebar ${isDarkMode ? 'dark' : ''}`}>
        <div className={`history-header ${isDarkMode ? 'dark' : ''}`}>
          <div className="history-title-row">
            <h2 className={`history-title ${isDarkMode ? 'dark' : ''}`}>Chat History</h2>
            <button className="history-close" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <input
            type="text"
            className={`history-search ${isDarkMode ? 'dark' : ''}`}
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="history-filters">
            <button
              className={`filter-button ${isDarkMode ? 'dark' : ''} ${filterRole === 'all' ? 'active' : ''}`}
              onClick={() => setFilterRole('all')}
            >
              All
            </button>
            <button
              className={`filter-button ${isDarkMode ? 'dark' : ''} ${filterRole === 'user' ? 'active' : ''}`}
              onClick={() => setFilterRole('user')}
            >
              User
            </button>
            <button
              className={`filter-button ${isDarkMode ? 'dark' : ''} ${filterRole === 'assistant' ? 'active' : ''}`}
              onClick={() => setFilterRole('assistant')}
            >
              Assistant
            </button>
          </div>

          {stats && (
            <div className="history-stats">
              <div className="stat-item">
                <div className="stat-value">{stats.messageCount || 0}</div>
                <div className={`stat-label ${isDarkMode ? 'dark' : ''}`}>Messages</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{Math.round((stats.totalTokens || 0) / 1000)}K</div>
                <div className={`stat-label ${isDarkMode ? 'dark' : ''}`}>Tokens</div>
              </div>
            </div>
          )}
        </div>

        <div className="history-content">
          {filteredMessages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: isDarkMode ? '#94a3b8' : '#64748b',
              padding: '40px 20px',
              fontSize: '14px'
            }}>
              {searchQuery ? 'No messages match your search' : 'No conversation history yet'}
            </div>
          ) : (
            filteredMessages.map((msg, index) => (
              <div
                key={index}
                className={`history-message ${msg.role} ${isDarkMode ? 'dark' : ''}`}
              >
                {msg.content}
              </div>
            ))
          )}
        </div>

        <div className={`history-actions ${isDarkMode ? 'dark' : ''}`}>
          <button className="history-action-button export" onClick={handleExport}>
            Export
          </button>
          <button className="history-action-button clear" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>
    </>
  );
};

