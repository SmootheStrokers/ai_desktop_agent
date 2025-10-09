import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PluginMarketplace } from './PluginMarketplace';
import { NotificationSystem, useNotifications } from './NotificationSystem';
import { ToolExecutionFeedback } from './ToolExecutionFeedback';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { SettingsPanel } from './SettingsPanel';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'thinking';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ToolExecution {
  name: string;
  status: 'running' | 'success' | 'error';
  message?: string;
}

const ChatPanelEnhanced: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showPluginMarketplace, setShowPluginMarketplace] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('claude');
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme_mode') || 'system';
    const savedProvider = localStorage.getItem('ai_provider') || 'claude';
    setSelectedProvider(savedProvider);

    const applyTheme = () => {
      if (savedTheme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);
      } else {
        setIsDarkMode(savedTheme === 'dark');
      }
    };

    applyTheme();

    if (savedTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLTextAreaElement>('.chat-input')?.focus();
      }
      // Ctrl/Cmd + H: Toggle history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(prev => !prev);
      }
      // Ctrl/Cmd + ,: Open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
      // Escape: Close modals
      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowHistory(false);
        setShowPluginMarketplace(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Setup streaming listeners
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api) return;

    let cleanupStream: (() => void) | undefined;
    let cleanupToolProgress: (() => void) | undefined;

    if (api.onStreamChunk) {
      cleanupStream = api.onStreamChunk((chunk: string) => {
        if (streamingMessageId) {
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: msg.content + chunk }
              : msg
          ));
        }
      });
    }

    if (api.onToolProgress) {
      cleanupToolProgress = api.onToolProgress((data: { message: string; iteration: number }) => {
        setToolExecutions(prev => {
          const existing = prev.find(e => e.name === data.message);
          if (existing) {
            return prev.map(e => e.name === data.message 
              ? { ...e, status: 'running' as const }
              : e
            );
          }
          return [...prev, { name: data.message, status: 'running' as const }];
        });
      });
    }

    return () => {
      cleanupStream?.();
      cleanupToolProgress?.();
    };
  }, [streamingMessageId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = useCallback((type: Message['type'], content: string, isStreaming = false) => {
    const message: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      content,
      timestamp: new Date(),
      isStreaming
    };
    setMessages(prev => [...prev, message]);
    return message.id;
  }, []);

  const handleSendMessage = async (useStreaming = true) => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsThinking(true);
    setToolExecutions([]);

    try {
      const enableNotifications = localStorage.getItem('enable_notifications') !== 'false';
      
      // Detect provider from prefix or use default
      let provider = selectedProvider;
      let actualMessage = userMessage;
      
      if (userMessage.startsWith('/claude ')) {
        provider = 'claude';
        actualMessage = userMessage.slice(8);
      } else if (userMessage.startsWith('/gpt ')) {
        provider = 'openai';
        actualMessage = userMessage.slice(5);
      }

      // Use streaming if supported
      if (useStreaming && (provider === 'claude' || provider === 'openai')) {
        const messageId = addMessage('assistant', '', true);
        setStreamingMessageId(messageId);
        setIsThinking(false);

        try {
          const result = await (window as any).electronAPI.sendMessageStream({
            provider,
            message: actualMessage
          });

          setStreamingMessageId(null);
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isStreaming: false } : msg
          ));

          if (result.success && enableNotifications) {
            addNotification('Response complete', 'success', 3000);
          }
        } catch (error) {
          setStreamingMessageId(null);
          addMessage('assistant', `Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          if (enableNotifications) {
            addNotification('Streaming failed', 'error');
          }
        }
      } else {
        // Fallback to non-streaming
        const result = await (window as any).electronAPI.sendMessage(userMessage);
        setIsThinking(false);
        
        if (result.type === 'error') {
          addMessage('assistant', `Error: ${result.result}`);
          if (enableNotifications) {
            addNotification('Error occurred', 'error');
          }
        } else {
          addMessage('assistant', result.result);
          if (enableNotifications) {
            addNotification('Response received', 'success', 3000);
          }
        }
      }

      setToolExecutions([]);
    } catch (error) {
      setIsThinking(false);
      setStreamingMessageId(null);
      addMessage('assistant', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const enableNotifications = localStorage.getItem('enable_notifications') !== 'false';
      if (enableNotifications) {
        addNotification('Error sending message', 'error');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    localStorage.setItem('theme_mode', theme);
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(mediaQuery.matches);
    } else {
      setIsDarkMode(theme === 'dark');
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
        
        .chat-panel {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(248, 250, 252, 0.95) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0;
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          overflow: hidden;
          overflow-x: hidden;
          animation: slideIn 0.3s ease-out;
          box-sizing: border-box;
        }
        
        .chat-panel.dark {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.95) 0%, 
            rgba(30, 41, 59, 0.95) 100%);
          border: 1px solid rgba(51, 65, 85, 0.3);
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
          overflow: hidden;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .chat-header.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.8) 0%, 
            rgba(51, 65, 85, 0.8) 100%);
          border-bottom: 1px solid rgba(71, 85, 105, 0.5);
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
        
        .chat-title h3.dark {
          background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
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
        
        .control-button.dark {
          color: #94a3b8;
        }
        
        .control-button.dark:hover {
          color: #60a5fa;
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
          overflow-x: hidden;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: linear-gradient(135deg, 
            rgba(248, 250, 252, 0.3) 0%, 
            rgba(241, 245, 249, 0.3) 100%);
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .chat-messages.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.3) 0%, 
            rgba(51, 65, 85, 0.3) 100%);
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
        
        .welcome-message.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.6) 0%, 
            rgba(51, 65, 85, 0.6) 100%);
          border: 1px solid rgba(71, 85, 105, 0.3);
          color: #cbd5e1;
        }
        
        .keyboard-hints {
          margin-top: 12px;
          font-size: 12px;
          color: #94a3b8;
        }
        
        .keyboard-hint {
          display: inline-block;
          margin: 4px 8px;
        }
        
        .kbd {
          display: inline-block;
          padding: 2px 6px;
          background: rgba(226, 232, 240, 0.5);
          border-radius: 4px;
          font-family: monospace;
          font-size: 11px;
          margin: 0 2px;
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
          word-wrap: break-word;
          overflow-wrap: break-word;
          position: relative;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          box-sizing: border-box;
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
        
        .message.assistant.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.9) 0%, 
            rgba(51, 65, 85, 0.9) 100%);
          color: #f1f5f9;
          border: 1px solid rgba(71, 85, 105, 0.3);
        }
        
        .message.streaming::after {
          content: '▌';
          animation: blink 1s step-start infinite;
        }
        
        @keyframes blink {
          50% { opacity: 0; }
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
        
        .typing-indicator.dark {
          background: linear-gradient(135deg, 
            rgba(51, 65, 85, 0.8) 0%, 
            rgba(71, 85, 105, 0.8) 100%);
          border: 1px solid rgba(100, 116, 139, 0.3);
          color: #94a3b8;
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
          overflow: hidden;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .chat-input-container.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.8) 0%, 
            rgba(51, 65, 85, 0.8) 100%);
          border-top: 1px solid rgba(71, 85, 105, 0.5);
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
        
        .chat-input.dark {
          border: 2px solid rgba(71, 85, 105, 0.5);
          background: rgba(30, 41, 59, 0.8);
          color: #f1f5f9;
        }
        
        .chat-input.dark:focus {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(30, 41, 59, 0.95);
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
              onClick={() => setShowHistory(true)}
              className={`control-button ${isDarkMode ? 'dark' : ''}`}
              title="Chat History (Ctrl+H)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
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
              title="Settings (Ctrl+,)"
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
              <p style={{ margin: '0 0 16px 0' }}>
                Start a conversation by typing a message below. I'm here to help!
              </p>
              <div className="keyboard-hints">
                <div className="keyboard-hint">
                  <span className="kbd">Ctrl</span> + <span className="kbd">K</span> Focus input
                </div>
                <div className="keyboard-hint">
                  <span className="kbd">Ctrl</span> + <span className="kbd">H</span> History
                </div>
                <div className="keyboard-hint">
                  <span className="kbd">Ctrl</span> + <span className="kbd">,</span> Settings
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message-container ${message.type === 'user' ? 'user' : ''}`}>
              <div className={`message ${message.type} ${isDarkMode && message.type === 'assistant' ? 'dark' : ''} ${message.isStreaming ? 'streaming' : ''}`}>
                {message.content || (message.isStreaming ? 'Thinking...' : '')}
              </div>
            </div>
          ))}

          {toolExecutions.length > 0 && (
            <ToolExecutionFeedback executions={toolExecutions} isDarkMode={isDarkMode} />
          )}

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
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isThinking || streamingMessageId !== null}
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
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          isDarkMode={isDarkMode}
          onThemeChange={handleThemeChange}
        />
      )}

      {showHistory && (
        <ChatHistorySidebar
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          isDarkMode={isDarkMode}
        />
      )}

      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </>
  );
};

export default ChatPanelEnhanced;

