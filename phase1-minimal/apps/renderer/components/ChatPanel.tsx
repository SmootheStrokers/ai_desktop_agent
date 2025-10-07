import React, { useState, useEffect, useRef } from 'react';
import { PluginMarketplace } from './PluginMarketplace';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div style={{width: '420px', height: '600px', display: 'flex', flexDirection: 'column', background: 'white', border: '1px solid #e1e5e9', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', overflow: 'hidden'}}>
      <div style={{padding: '16px', borderBottom: '1px solid #e1e5e9', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <h3 style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a1a'}}>AI Assistant</h3>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <button
            onClick={() => setShowPluginMarketplace(true)}
            style={{
              padding: '6px 12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Plugins
          </button>
          <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#10b981'}} />
        </div>
      </div>

      <div style={{flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
        {messages.length === 0 && (
          <div style={{textAlign: 'center', color: '#6b7280', fontSize: '14px', marginTop: '32px'}}>
            Start a conversation with the AI assistant
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} style={{display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'}}>
            <div style={{
              maxWidth: '80%', padding: '12px 16px', borderRadius: '18px',
              background: message.type === 'user' ? '#3b82f6' : message.type === 'thinking' ? '#f3f4f6' : '#f1f5f9',
              color: message.type === 'user' ? 'white' : '#1a1a1a', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {message.type === 'thinking' ? 'Thinking...' : message.content}
            </div>
          </div>
        ))}

        {isThinking && (
          <div style={{display: 'flex', justifyContent: 'flex-start'}}>
            <div style={{padding: '12px 16px', borderRadius: '18px', background: '#f3f4f6', color: '#6b7280', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{width: '4px', height: '4px', borderRadius: '50%', background: '#6b7280', animation: 'pulse 1.5s ease-in-out infinite'}} />
              <div style={{width: '4px', height: '4px', borderRadius: '50%', background: '#6b7280', animation: 'pulse 1.5s ease-in-out infinite 0.2s'}} />
              <div style={{width: '4px', height: '4px', borderRadius: '50%', background: '#6b7280', animation: 'pulse 1.5s ease-in-out infinite 0.4s'}} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={{padding: '16px', borderTop: '1px solid #e1e5e9', background: '#f8f9fa'}}>
        <div style={{display: 'flex', gap: '8px', alignItems: 'flex-end'}}>
          <textarea
            value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
            placeholder="Type a message..." rows={1}
            style={{flex: 1, padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '20px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', minHeight: '20px', maxHeight: '100px'}}
          />
          <button
            onClick={handleSendMessage} disabled={!input.trim() || isThinking}
            style={{padding: '12px 16px', background: input.trim() && !isThinking ? '#3b82f6' : '#d1d5db', color: 'white', border: 'none', borderRadius: '20px', cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '500', transition: 'background-color 0.2s'}}
          >
            Send
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
      
      {showPluginMarketplace && (
        <PluginMarketplace onClose={() => setShowPluginMarketplace(false)} />
      )}
    </div>
  );
};

export default ChatPanel;