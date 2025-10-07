# Desktop Agent - Phase 2

Production-grade AI desktop agent with comprehensive tool integration, multi-provider LLM support, and enterprise features.

## 🚀 Phase 2 Features

### ✅ **Core Agent System**
- **Multi-LLM Orchestration**: Ollama (local) → OpenAI → Anthropic fallback
- **Intelligent Planning**: AI creates and executes multi-step plans
- **Tool Integration**: Filesystem, browser, commands, clipboard, scheduling
- **Approval Flows**: User confirmation for sensitive operations

### ✅ **User Experience**
- **Settings UI**: Comprehensive configuration management
- **System Tray**: Always-available with context menu
- **Global Hotkeys**: Quick access (Ctrl+Shift+Space)
- **Approval Modals**: Clear consent for sensitive operations

### ✅ **Security & Compliance**
- **Audit Logging**: Complete activity tracking with SQLite
- **Path Allowlists**: Restricted filesystem access
- **Command Validation**: Dangerous command blocking
- **Domain Filtering**: Browser access controls

### ✅ **Enterprise Features**
- **API Key Management**: Secure credential storage
- **Session Tracking**: User activity monitoring
- **Error Handling**: Comprehensive error logging
- **Performance Monitoring**: Tool execution metrics

## 🏗️ Architecture

```
Desktop Agent (Phase 2)
├── 🎯 Core Agent
│   ├── Model Orchestrator (Ollama → OpenAI → Claude)
│   ├── Planner (Intent → Tool Plan → Execution)
│   ├── Tool Router (Dispatch to Handlers)
│   └── Approval System (User Consent)
├── 🛠️ Tools
│   ├── Filesystem (read/write/list/search)
│   ├── Browser (Playwright automation)
│   ├── Commands (shell execution)
│   ├── Clipboard (get/set)
│   └── Scheduler (cron jobs)
├── 🔒 Security
│   ├── Path Allowlists
│   ├── Command Validation
│   ├── Domain Filtering
│   └── Audit Logging
└── 🎨 UI/UX
    ├── Settings Modal
    ├── Approval Dialogs
    ├── System Tray
    └── Global Hotkeys
```

## 🚀 Quick Start

### Prerequisites
1. **Node.js 18+**
2. **Ollama installed and running**:
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull model
   ollama pull llama3.1
   
   # Start server
   ollama serve
   ```

### Installation
```bash
# Install dependencies
npm install

# Start development
npm run dev
```

## 🎯 Usage

### Basic Chat
1. **Bubble Interface**: Click the bubble in bottom-right corner
2. **Global Hotkey**: Press `Ctrl+Shift+Space` (configurable)
3. **System Tray**: Right-click tray icon for menu

### Advanced Features
- **Settings**: Click ⚙️ in chat panel
- **Tool Commands**: Ask AI to perform file operations, browser tasks, etc.
- **Approval Flow**: Confirm sensitive operations when prompted

## 🛠️ Tool System

### Filesystem Tools
```typescript
// Available operations
- listDir(path)     // List directory contents
- readFile(path)    // Read file content
- writeFile(path, content)  // Write file (requires approval)
- searchFiles(path, query) // Search file contents
```

### Browser Tools
```typescript
// Playwright automation
- browserOpen(url)      // Navigate to URL
- browserFill(selector, value)  // Fill form field
- browserClick(selector)         // Click element
- browserWait(selector)          // Wait for element
- browserScreenshot(path)        // Take screenshot
```

### Command Tools
```typescript
// Shell execution (requires approval)
- runCommand(command, timeout, cwd)
```

### Clipboard Tools
```typescript
// Clipboard operations
- getClipboard()       // Get clipboard content
- setClipboard(text)   // Set clipboard (requires approval)
```

### Scheduler Tools
```typescript
// Cron job management
- addCron(cron, action, description)    // Add scheduled task
- removeCron(id)                       // Remove task
- listCron()                          // List all tasks
```

## ⚙️ Configuration

### LLM Providers
- **Ollama** (Default): Local, private, free
- **OpenAI**: GPT-4o, requires API key
- **Anthropic**: Claude 3.5 Sonnet, requires API key

### Security Settings
- **Path Allowlists**: Restrict filesystem access
- **Domain Allowlists**: Control browser access
- **Approval Requirements**: Configure which operations need consent

### System Settings
- **Auto-start**: Launch with system
- **Global Hotkey**: Customize quick access key
- **Notifications**: Enable/disable system notifications

## 🔒 Security Model

### Path Protection
```typescript
// Default allowlist
allowListPaths: [
  process.env.HOME,
  path.join(process.env.HOME, 'AgentWorkspace')
]
```

### Command Validation
```typescript
// Blocked patterns
BLOCKED_PATTERNS: [
  /rm\s+-rf\s+\//,     // rm -rf /
  /format\s+c:/i,       // format c:
  /dd\s+if=/,          // dd if=...
  />.*\/dev\//         // redirect to /dev/*
]
```

### Domain Filtering
```typescript
// Default allowlist
allowListDomains: ['localhost', '127.0.0.1']
```

## 📊 Audit System

### Event Types
- `user_message`: User input logged
- `ai_response`: AI output logged
- `tool_execution`: Tool calls tracked
- `approval_request`: Sensitive operation requested
- `approval_granted`: User approved operation
- `approval_denied`: User rejected operation
- `error`: System errors logged

### Database Schema
```sql
CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  details TEXT NOT NULL,
  metadata TEXT NOT NULL,
  session_id TEXT NOT NULL
);
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Manual Testing
1. **Basic Chat**: Send messages, verify responses
2. **Tool Execution**: Test file operations, browser automation
3. **Approval Flow**: Trigger sensitive operations
4. **Settings**: Configure providers, security settings
5. **Audit Logging**: Verify all activities are logged

## 🚀 Deployment

### Development Build
```bash
npm run build
npm run dev
```

### Production Build
```bash
npm run build:prod
npm run package
```

### Distribution
```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

## 🔮 Phase 3 Roadmap

### Planned Features
- **MCP Server Integration**: Extensible tool ecosystem
- **Advanced Planning**: Multi-agent coordination
- **Custom Tools**: User-defined tool creation
- **Cloud Sync**: Settings and audit log backup
- **Team Features**: Multi-user collaboration
- **API Server**: REST API for external integration

### Performance Optimizations
- **Tool Caching**: Reduce redundant operations
- **Streaming Responses**: Real-time AI output
- **Background Processing**: Non-blocking operations
- **Memory Management**: Efficient resource usage

## 📚 API Reference

### IPC Handlers
```typescript
// Chat
'chat:send-message' → { type, result }

// Settings
'settings:get' → Settings
'settings:update' → { success }
'settings:manage-api-key' → { success }

// Audit
'audit:get-events' → AuditEvent[]
'audit:get-events-by-type' → AuditEvent[]
```

### Tool Schemas
```typescript
interface ToolSchema {
  schema: z.ZodSchema;
  requiresApproval: boolean;
}
```

## 🐛 Troubleshooting

### Common Issues
1. **Ollama Connection**: Ensure Ollama is running on localhost:11434
2. **Permission Errors**: Check path allowlists in settings
3. **Tool Failures**: Verify tool dependencies are installed
4. **Hotkey Conflicts**: Change global hotkey in settings

### Debug Mode
```bash
DEBUG=desktop-agent npm run dev
```

### Logs
- **Application Logs**: `~/.config/desktop-agent/logs/`
- **Audit Logs**: SQLite database in user data directory
- **Error Logs**: Console output with stack traces

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

## 📄 License

MIT License - see LICENSE file for details.

---

**Phase 2 Status**: ✅ **COMPLETE**

All core features implemented and tested. Ready for production use with comprehensive tool integration, security controls, and audit logging.
