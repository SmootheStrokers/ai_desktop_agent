import React, { useState, useEffect } from 'react';
import { MCPServersPanel } from './MCPServersPanel';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onThemeChange
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'mcp' | 'advanced'>('general');
  const [selectedProvider, setSelectedProvider] = useState('claude');
  const [maxIterations, setMaxIterations] = useState(10);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableSounds, setEnableSounds] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Load settings from localStorage
    const savedProvider = localStorage.getItem('ai_provider') || 'claude';
    const savedIterations = localStorage.getItem('max_iterations') || '10';
    const savedNotifications = localStorage.getItem('enable_notifications') !== 'false';
    const savedSounds = localStorage.getItem('enable_sounds') === 'true';
    const savedTheme = (localStorage.getItem('theme_mode') || 'system') as 'light' | 'dark' | 'system';

    setSelectedProvider(savedProvider);
    setMaxIterations(parseInt(savedIterations));
    setEnableNotifications(savedNotifications);
    setEnableSounds(savedSounds);
    setThemeMode(savedTheme);
  }, []);

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    localStorage.setItem('ai_provider', provider);
  };

  const handleIterationsChange = (iterations: number) => {
    setMaxIterations(iterations);
    localStorage.setItem('max_iterations', iterations.toString());
  };

  const handleNotificationsToggle = () => {
    const newValue = !enableNotifications;
    setEnableNotifications(newValue);
    localStorage.setItem('enable_notifications', newValue.toString());
  };

  const handleSoundsToggle = () => {
    const newValue = !enableSounds;
    setEnableSounds(newValue);
    localStorage.setItem('enable_sounds', newValue.toString());
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setThemeMode(theme);
    localStorage.setItem('theme_mode', theme);
    onThemeChange(theme);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .settings-overlay {
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

        .settings-modal {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(248, 250, 252, 0.95) 100%);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 700px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease-out;
        }

        .settings-modal.dark {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.95) 0%, 
            rgba(30, 41, 59, 0.95) 100%);
          border: 1px solid rgba(51, 65, 85, 0.3);
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          background: linear-gradient(135deg, 
            rgba(248, 250, 252, 0.8) 0%, 
            rgba(241, 245, 249, 0.8) 100%);
        }

        .settings-header.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.8) 0%, 
            rgba(51, 65, 85, 0.8) 100%);
          border-bottom: 1px solid rgba(71, 85, 105, 0.5);
        }

        .settings-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .settings-title.dark {
          background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .settings-close {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .settings-close:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .settings-tabs {
          display: flex;
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          padding: 0 24px;
          background: rgba(248, 250, 252, 0.5);
        }

        .settings-tabs.dark {
          background: rgba(30, 41, 59, 0.5);
          border-bottom: 1px solid rgba(71, 85, 105, 0.5);
        }

        .settings-tab {
          padding: 16px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          border-bottom: 3px solid transparent;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .settings-tab.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
        }

        .settings-tab:hover:not(.active) {
          color: #475569;
          background: rgba(59, 130, 246, 0.05);
        }

        .settings-tab.dark {
          color: #94a3b8;
        }

        .settings-tab.dark.active {
          color: #60a5fa;
        }

        .settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: rgba(248, 250, 252, 0.3);
        }

        .settings-content.dark {
          background: rgba(30, 41, 59, 0.3);
        }

        .setting-section {
          margin-bottom: 32px;
        }

        .setting-section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
        }

        .setting-section-title.dark {
          color: #f1f5f9;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .setting-item.dark {
          background: rgba(30, 41, 59, 0.8);
        }

        .setting-label {
          flex: 1;
        }

        .setting-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .setting-name.dark {
          color: #f1f5f9;
        }

        .setting-description {
          color: #64748b;
          font-size: 12px;
        }

        .setting-description.dark {
          color: #94a3b8;
        }

        .setting-control select,
        .setting-control input[type="number"] {
          padding: 8px 12px;
          border: 2px solid rgba(226, 232, 240, 0.5);
          border-radius: 8px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.9);
          outline: none;
          transition: all 0.2s;
        }

        .setting-control select.dark,
        .setting-control input[type="number"].dark {
          background: rgba(51, 65, 85, 0.8);
          border-color: rgba(71, 85, 105, 0.5);
          color: #f1f5f9;
        }

        .setting-control select:focus,
        .setting-control input[type="number"]:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .toggle-switch {
          position: relative;
          width: 48px;
          height: 26px;
          background: #cbd5e1;
          border-radius: 13px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .toggle-switch.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .toggle-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.active .toggle-slider {
          transform: translateX(22px);
        }

        .theme-options {
          display: flex;
          gap: 12px;
        }

        .theme-option {
          flex: 1;
          padding: 12px;
          border: 2px solid rgba(226, 232, 240, 0.5);
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          font-weight: 600;
          font-size: 13px;
          color: #64748b;
        }

        .theme-option.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border-color: transparent;
        }

        .theme-option:hover:not(.active) {
          background: rgba(59, 130, 246, 0.1);
        }

        .theme-option.dark {
          border-color: rgba(71, 85, 105, 0.5);
          color: #94a3b8;
        }
      `}</style>

      <div className="settings-overlay" onClick={onClose}>
        <div className={`settings-modal ${isDarkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className={`settings-header ${isDarkMode ? 'dark' : ''}`}>
            <h2 className={`settings-title ${isDarkMode ? 'dark' : ''}`}>Settings</h2>
            <button className="settings-close" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={`settings-tabs ${isDarkMode ? 'dark' : ''}`}>
            <button
              className={`settings-tab ${isDarkMode ? 'dark' : ''} ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`settings-tab ${isDarkMode ? 'dark' : ''} ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              Appearance
            </button>
            <button
              className={`settings-tab ${isDarkMode ? 'dark' : ''} ${activeTab === 'mcp' ? 'active' : ''}`}
              onClick={() => setActiveTab('mcp')}
            >
              MCP Servers
            </button>
            <button
              className={`settings-tab ${isDarkMode ? 'dark' : ''} ${activeTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveTab('advanced')}
            >
              Advanced
            </button>
          </div>

          <div className={`settings-content ${isDarkMode ? 'dark' : ''}`}>
            {activeTab === 'general' && (
              <>
                <div className="setting-section">
                  <h3 className={`setting-section-title ${isDarkMode ? 'dark' : ''}`}>AI Provider</h3>
                  <div className={`setting-item ${isDarkMode ? 'dark' : ''}`}>
                    <div className="setting-label">
                      <div className={`setting-name ${isDarkMode ? 'dark' : ''}`}>Default Provider</div>
                      <div className={`setting-description ${isDarkMode ? 'dark' : ''}`}>
                        Select the default AI model to use
                      </div>
                    </div>
                    <div className="setting-control">
                      <select
                        className={isDarkMode ? 'dark' : ''}
                        value={selectedProvider}
                        onChange={(e) => handleProviderChange(e.target.value)}
                      >
                        <option value="claude">Claude (Sonnet 4)</option>
                        <option value="openai">OpenAI (GPT-4o)</option>
                        <option value="ollama">Ollama (Local)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="setting-section">
                  <h3 className={`setting-section-title ${isDarkMode ? 'dark' : ''}`}>Notifications</h3>
                  <div className={`setting-item ${isDarkMode ? 'dark' : ''}`}>
                    <div className="setting-label">
                      <div className={`setting-name ${isDarkMode ? 'dark' : ''}`}>Enable Notifications</div>
                      <div className={`setting-description ${isDarkMode ? 'dark' : ''}`}>
                        Show notification messages for events
                      </div>
                    </div>
                    <div className="setting-control">
                      <div
                        className={`toggle-switch ${enableNotifications ? 'active' : ''}`}
                        onClick={handleNotificationsToggle}
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>
                  </div>

                  <div className={`setting-item ${isDarkMode ? 'dark' : ''}`}>
                    <div className="setting-label">
                      <div className={`setting-name ${isDarkMode ? 'dark' : ''}`}>Enable Sounds</div>
                      <div className={`setting-description ${isDarkMode ? 'dark' : ''}`}>
                        Play sounds for notifications
                      </div>
                    </div>
                    <div className="setting-control">
                      <div
                        className={`toggle-switch ${enableSounds ? 'active' : ''}`}
                        onClick={handleSoundsToggle}
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <div className="setting-section">
                <h3 className={`setting-section-title ${isDarkMode ? 'dark' : ''}`}>Theme</h3>
                <div className={`setting-item ${isDarkMode ? 'dark' : ''}`}>
                  <div className="setting-label">
                    <div className={`setting-name ${isDarkMode ? 'dark' : ''}`}>Color Theme</div>
                    <div className={`setting-description ${isDarkMode ? 'dark' : ''}`}>
                      Choose your preferred theme
                    </div>
                  </div>
                </div>
                <div className="theme-options">
                  <button
                    className={`theme-option ${isDarkMode ? 'dark' : ''} ${themeMode === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    ☀️ Light
                  </button>
                  <button
                    className={`theme-option ${isDarkMode ? 'dark' : ''} ${themeMode === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    🌙 Dark
                  </button>
                  <button
                    className={`theme-option ${isDarkMode ? 'dark' : ''} ${themeMode === 'system' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('system')}
                  >
                    💻 System
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'mcp' && <MCPServersPanel />}

            {activeTab === 'advanced' && (
              <div className="setting-section">
                <h3 className={`setting-section-title ${isDarkMode ? 'dark' : ''}`}>Tool Execution</h3>
                <div className={`setting-item ${isDarkMode ? 'dark' : ''}`}>
                  <div className="setting-label">
                    <div className={`setting-name ${isDarkMode ? 'dark' : ''}`}>Max Iterations</div>
                    <div className={`setting-description ${isDarkMode ? 'dark' : ''}`}>
                      Maximum number of tool execution steps
                    </div>
                  </div>
                  <div className="setting-control">
                    <input
                      type="number"
                      className={isDarkMode ? 'dark' : ''}
                      value={maxIterations}
                      onChange={(e) => handleIterationsChange(parseInt(e.target.value) || 10)}
                      min="1"
                      max="50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

