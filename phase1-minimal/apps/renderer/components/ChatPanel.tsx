import React, { useState, useEffect, useRef } from 'react';
import { PluginMarketplace } from './PluginMarketplace';
import { MCPServersPanel } from './MCPServersPanel';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'thinking';
  content: string;
  timestamp: Date;
}

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showPluginMarketplace, setShowPluginMarketplace] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'mcp'>('general');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: Message['type'], content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsThinking(true);

    try {
      // Use IPC to communicate with main process
      const result = await (window as any).electronAPI.sendMessage(userMessage);
      
      setIsThinking(false);
      
      if (result.type === 'echo') {
        addMessage('assistant', result.result);
      } else if (result.type === 'read') {
        addMessage('assistant', result.result);
      } else if (result.type === 'browser') {
        addMessage('assistant', result.result);
      } else if (result.type === 'system') {
        addMessage('assistant', result.result);
      } else if (result.type === 'llm') {
        addMessage('assistant', result.result);
      } else if (result.type === 'ollama') {
        addMessage('assistant', result.result);
      } else if (result.type === 'error') {
        addMessage('assistant', `Error: ${result.result}`);
      }
    } catch (error) {
      setIsThinking(false);
      addMessage('assistant', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        
        .chat-panel {
          width: 420px;
          height: 600px;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(248, 250, 252, 0.95) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
        }
        
        .chat-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, 
            rgba(248, 250, 252, 0.8) 0%, 
            rgba(241, 245, 249, 0.8) 100%);
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(10px);
        }
        
        .chat-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chat-title h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: white;
          animation: pulse 2s infinite;
        }
        
        .chat-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .control-button {
          padding: 8px;
          background: transparent;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #64748b;
        }
        
        .control-button:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          transform: scale(1.05);
        }
        
        .plugin-button {
          padding: 8px 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .plugin-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: linear-gradient(135deg, 
            rgba(248, 250, 252, 0.3) 0%, 
            rgba(241, 245, 249, 0.3) 100%);
        }
        
        .chat-messages::-webkit-scrollbar {
          width: 8px;
        }
        
        .chat-messages::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 4px;
        }
        
        .chat-messages::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #9333ea 100%);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .welcome-message {
          text-align: center;
          color: #64748b;
          font-size: 15px;
          margin-top: 40px;
          padding: 24px;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.6) 0%, 
            rgba(248, 250, 252, 0.6) 100%);
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.3);
          backdrop-filter: blur(10px);
        }
        
        .message-container {
          display: flex;
          justify-content: flex-start;
          animation: slideIn 0.3s ease-out;
        }
        
        .message-container.user {
          justify-content: flex-end;
        }
        
        .message {
          max-width: 85%;
          padding: 16px 20px;
          border-radius: 20px;
          font-size: 15px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          position: relative;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .message.user {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border-bottom-right-radius: 6px;
        }
        
        .message.assistant {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.9) 0%, 
            rgba(248, 250, 252, 0.9) 100%);
          color: #1e293b;
          border: 1px solid rgba(226, 232, 240, 0.3);
          border-bottom-left-radius: 6px;
          backdrop-filter: blur(10px);
        }
        
        .message.thinking {
          background: linear-gradient(135deg, 
            rgba(241, 245, 249, 0.8) 0%, 
            rgba(226, 232, 240, 0.8) 100%);
          color: #64748b;
          border: 1px solid rgba(203, 213, 225, 0.3);
          border-bottom-left-radius: 6px;
        }
        
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 16px 20px;
          background: linear-gradient(135deg, 
            rgba(241, 245, 249, 0.8) 0%, 
            rgba(226, 232, 240, 0.8) 100%);
          border: 1px solid rgba(203, 213, 225, 0.3);
          border-radius: 20px;
          border-bottom-left-radius: 6px;
          color: #64748b;
          font-size: 15px;
          backdrop-filter: blur(10px);
        }
        
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #64748b;
          animation: typing 1.4s ease-in-out infinite;
        }
        
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        .chat-input-container {
          padding: 20px 24px;
          background: linear-gradient(135deg, 
            rgba(248, 250, 252, 0.8) 0%, 
            rgba(241, 245, 249, 0.8) 100%);
          border-top: 1px solid rgba(226, 232, 240, 0.5);
          backdrop-filter: blur(10px);
        }
        
        .chat-input-wrapper {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }
        
        .chat-input {
          flex: 1;
          padding: 14px 20px;
          border: 2px solid rgba(226, 232, 240, 0.5);
          border-radius: 24px;
          font-size: 15px;
          font-family: inherit;
          resize: none;
          outline: none;
          min-height: 24px;
          max-height: 120px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
          line-height: 1.5;
        }
        
        .chat-input:focus {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.95);
        }
        
        .chat-input::placeholder {
          color: #94a3b8;
        }
        
        .send-button {
          padding: 14px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 24px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 80px;
        }
        
        .send-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        
        .send-button:disabled {
          background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }
        
        .modal-content {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(248, 250, 252, 0.95) 100%);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease-out;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          background: linear-gradient(135deg, 
            rgba(248, 250, 252, 0.8) 0%, 
            rgba(241, 245, 249, 0.8) 100%);
        }
        
        .modal-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .modal-close {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .modal-close:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        
        .modal-tabs {
          display: flex;
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          padding: 0 24px;
          background: rgba(248, 250, 252, 0.5);
        }
        
        .modal-tab {
          padding: 16px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 600;
          font-size: 15px;
          border-bottom: 3px solid transparent;
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .modal-tab.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
        }
        
        .modal-tab:hover:not(.active) {
          color: #475569;
          background: rgba(59, 130, 246, 0.05);
        }
        
        .modal-body {
          flex: 1;
          overflow-y: auto;
          background: rgba(248, 250, 252, 0.3);
        }
        
        .modal-body::-webkit-scrollbar {
          width: 8px;
        }
        
        .modal-body::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 4px;
        }
        
        .modal-body::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .modal-body::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #9333ea 100%);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        /* Dark mode styles */
        .chat-panel.dark {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.95) 0%, 
            rgba(30, 41, 59, 0.95) 100%);
          border: 1px solid rgba(51, 65, 85, 0.3);
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
        }
        
        .chat-header.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.8) 0%, 
            rgba(51, 65, 85, 0.8) 100%);
          border-bottom: 1px solid rgba(71, 85, 105, 0.5);
        }
        
        .chat-title h3.dark {
          background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .chat-messages.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.3) 0%, 
            rgba(51, 65, 85, 0.3) 100%);
        }
        
        .welcome-message.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.6) 0%, 
            rgba(51, 65, 85, 0.6) 100%);
          border: 1px solid rgba(71, 85, 105, 0.3);
          color: #cbd5e1;
        }
        
        .message.assistant.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.9) 0%, 
            rgba(51, 65, 85, 0.9) 100%);
          color: #f1f5f9;
          border: 1px solid rgba(71, 85, 105, 0.3);
        }
        
        .message.thinking.dark {
          background: linear-gradient(135deg, 
            rgba(51, 65, 85, 0.8) 0%, 
            rgba(71, 85, 105, 0.8) 100%);
          color: #94a3b8;
          border: 1px solid rgba(100, 116, 139, 0.3);
        }
        
        .typing-indicator.dark {
          background: linear-gradient(135deg, 
            rgba(51, 65, 85, 0.8) 0%, 
            rgba(71, 85, 105, 0.8) 100%);
          border: 1px solid rgba(100, 116, 139, 0.3);
          color: #94a3b8;
        }
        
        .chat-input-container.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.8) 0%, 
            rgba(51, 65, 85, 0.8) 100%);
          border-top: 1px solid rgba(71, 85, 105, 0.5);
        }
        
        .chat-input.dark {
          border: 2px solid rgba(71, 85, 105, 0.5);
          background: rgba(30, 41, 59, 0.8);
          color: #f1f5f9;
        }
        
        .chat-input.dark:focus {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(30, 41, 59, 0.95);
        }
        
        .chat-input.dark::placeholder {
          color: #64748b;
        }
        
        .modal-content.dark {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.95) 0%, 
            rgba(30, 41, 59, 0.95) 100%);
          border: 1px solid rgba(51, 65, 85, 0.3);
        }
        
        .modal-header.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.8) 0%, 
            rgba(51, 65, 85, 0.8) 100%);
          border-bottom: 1px solid rgba(71, 85, 105, 0.5);
        }
        
        .modal-title.dark {
          background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .modal-tabs.dark {
          background: rgba(30, 41, 59, 0.5);
          border-bottom: 1px solid rgba(71, 85, 105, 0.5);
        }
        
        .modal-tab.dark {
          color: #94a3b8;
        }
        
        .modal-tab.dark.active {
          color: #60a5fa;
        }
        
        .modal-tab.dark:hover:not(.active) {
          color: #cbd5e1;
          background: rgba(59, 130, 246, 0.1);
        }
        
        .modal-body.dark {
          background: rgba(30, 41, 59, 0.3);
        }
        
        .control-button.dark {
          color: #94a3b8;
        }
        
        .control-button.dark:hover {
          color: #60a5fa;
        }
        
        /* Dark mode scrollbars */
        .chat-messages.dark::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.3);
        }
        
        .chat-messages.dark::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chat-messages.dark::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #9333ea 100%);
        }
        
        .modal-body.dark::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.3);
        }
        
        .modal-body.dark::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .modal-body.dark::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #9333ea 100%);
        }
      `}</style>
      
      <div className={`chat-panel ${isDarkMode ? 'dark' : ''}`}>
        <div className={`chat-header ${isDarkMode ? 'dark' : ''}`}>
          <div className="chat-title">
            <img 
              src="./favicon100x100.png" 
              alt="AI Assistant" 
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
            />
            <h3 className={isDarkMode ? 'dark' : ''}>AI Assistant</h3>
          </div>
          <div className="chat-controls">
            <div className="status-indicator">
              <div className="status-dot" />
              <span>Online</span>
            </div>
          <button
            onClick={() => setShowPluginMarketplace(true)}
              className="plugin-button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Plugins
          </button>
          <button
            onClick={() => setShowSettings(true)}
              className={`control-button ${isDarkMode ? 'dark' : ''}`}
            title="Settings"
          >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

        <div className={`chat-messages ${isDarkMode ? 'dark' : ''}`}>
        {messages.length === 0 && (
            <div className={`welcome-message ${isDarkMode ? 'dark' : ''}`}>
              <h4 style={{ margin: '0 0 8px 0', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: '18px' }}>
                Welcome to AI Assistant
              </h4>
              <p style={{ margin: 0 }}>
                Start a conversation by typing a message below. I'm here to help!
              </p>
          </div>
        )}

        {messages.map((message) => (
            <div key={message.id} className={`message-container ${message.type === 'user' ? 'user' : ''}`}>
              <div className={`message ${message.type} ${isDarkMode ? 'dark' : ''}`}>
                {message.content}
            </div>
          </div>
        ))}

        {isThinking && (
            <div className="message-container">
              <div className={`typing-indicator ${isDarkMode ? 'dark' : ''}`}>
                <span>Thinking</span>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

        <div className={`chat-input-container ${isDarkMode ? 'dark' : ''}`}>
          <div className="chat-input-wrapper">
          <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className={`chat-input ${isDarkMode ? 'dark' : ''}`}
          />
          <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isThinking}
              className="send-button"
          >
            Send
          </button>
        </div>
      </div>
      </div>
      
      {showPluginMarketplace && (
        <PluginMarketplace onClose={() => setShowPluginMarketplace(false)} />
      )}

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className={`modal-content ${isDarkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={`modal-header ${isDarkMode ? 'dark' : ''}`}>
              <h2 className={`modal-title ${isDarkMode ? 'dark' : ''}`}>Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="modal-close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={`modal-tabs ${isDarkMode ? 'dark' : ''}`}>
              <button
                onClick={() => setSettingsTab('general')}
                className={`modal-tab ${isDarkMode ? 'dark' : ''} ${settingsTab === 'general' ? 'active' : ''}`}
              >
                General
              </button>
              <button
                onClick={() => setSettingsTab('mcp')}
                className={`modal-tab ${isDarkMode ? 'dark' : ''} ${settingsTab === 'mcp' ? 'active' : ''}`}
              >
                MCP Servers
              </button>
            </div>

            <div className={`modal-body ${isDarkMode ? 'dark' : ''}`}>
              {settingsTab === 'general' && (
                <div style={{ padding: '24px' }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                    marginTop: 0, 
                    marginBottom: '16px' 
                  }}>
                    General Settings
                  </h3>
                  <p style={{ 
                    fontSize: '15px', 
                    color: isDarkMode ? '#94a3b8' : '#64748b', 
                    lineHeight: '1.6' 
                  }}>
                    General application settings will be available here.
                  </p>
                </div>
              )}

              {settingsTab === 'mcp' && (
                <MCPServersPanel />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPanel;