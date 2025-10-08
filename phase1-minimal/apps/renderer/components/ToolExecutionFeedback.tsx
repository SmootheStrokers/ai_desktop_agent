import React from 'react';

interface ToolExecution {
  name: string;
  status: 'running' | 'success' | 'error';
  message?: string;
}

interface ToolExecutionFeedbackProps {
  executions: ToolExecution[];
  isDarkMode?: boolean;
}

export const ToolExecutionFeedback: React.FC<ToolExecutionFeedbackProps> = ({ 
  executions, 
  isDarkMode = false 
}) => {
  if (executions.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toolPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes toolSlideIn {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .tool-feedback-container {
          padding: 12px 16px;
          margin: 8px 0;
          border-radius: 12px;
          background: linear-gradient(135deg, 
            rgba(248, 250, 252, 0.8) 0%, 
            rgba(241, 245, 249, 0.8) 100%);
          border: 1px solid rgba(226, 232, 240, 0.5);
          animation: toolSlideIn 0.3s ease-out;
        }

        .tool-feedback-container.dark {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.8) 0%, 
            rgba(51, 65, 85, 0.8) 100%);
          border: 1px solid rgba(71, 85, 105, 0.5);
        }

        .tool-feedback-title {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tool-feedback-title.dark {
          color: #94a3b8;
        }

        .tool-execution-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          font-size: 13px;
        }

        .tool-status-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }

        .tool-status-icon.running {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          animation: toolPulse 1.5s ease-in-out infinite;
        }

        .tool-status-icon.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .tool-status-icon.error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .tool-name {
          font-weight: 600;
          color: #1e293b;
          flex-shrink: 0;
        }

        .tool-name.dark {
          color: #f1f5f9;
        }

        .tool-message {
          color: #64748b;
          font-size: 12px;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tool-message.dark {
          color: #94a3b8;
        }
      `}</style>

      <div className={`tool-feedback-container ${isDarkMode ? 'dark' : ''}`}>
        <div className={`tool-feedback-title ${isDarkMode ? 'dark' : ''}`}>
          Tool Execution
        </div>
        {executions.map((execution, index) => (
          <div key={index} className="tool-execution-item">
            <div className={`tool-status-icon ${execution.status}`}>
              {execution.status === 'running' && '●'}
              {execution.status === 'success' && '✓'}
              {execution.status === 'error' && '✕'}
            </div>
            <span className={`tool-name ${isDarkMode ? 'dark' : ''}`}>
              {execution.name}
            </span>
            {execution.message && (
              <span className={`tool-message ${isDarkMode ? 'dark' : ''}`}>
                {execution.message}
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

