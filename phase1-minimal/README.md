# Phase 1 - Minimal AI Desktop Agent

A lightweight, multi-LLM desktop AI assistant built with Electron, React, and TypeScript. This project provides a floating bubble interface that can interact with multiple AI providers including Ollama, Claude, and OpenAI.

## 🚀 Features

### Core Functionality
- **Floating Bubble Interface**: Always-on-top draggable bubble for quick access
- **Chat Panel**: Modern chat interface with real-time messaging
- **Multi-LLM Support**: Switch between Ollama (local), Claude, and OpenAI
- **File Operations**: Read, write, and append files with security checks
- **Browser Automation**: Browse websites, click elements, take screenshots
- **Shell Commands**: Execute system commands with security restrictions
- **API Key Management**: Secure storage and management of API keys

### Supported LLM Providers
- **Ollama** (Default): Local AI using llama3.1 model
- **Claude**: Anthropic's Claude Sonnet 4 via API
- **OpenAI**: GPT-4o via OpenAI API

## 📁 Project Structure

```
phase1-minimal/
├── apps/
│   ├── main/                    # Electron main process
│   │   ├── index.ts            # Main application logic (269 lines)
│   │   └── llm-providers.ts     # Multi-LLM integration (98 lines)
│   ├── preload/                 # Electron preload scripts
│   │   └── index.ts            # IPC bridge (25 lines)
│   └── renderer/                # React frontend
│       ├── components/
│       │   ├── Bubble.tsx      # Floating bubble component (48 lines)
│       │   └── ChatPanel.tsx   # Chat interface (124 lines)
│       ├── bubble.html         # Bubble window HTML
│       ├── bubble.tsx          # Bubble entry point (8 lines)
│       ├── panel.html          # Panel window HTML
│       └── panel.tsx           # Panel entry point (8 lines)
├── dist/                        # Built application
├── scripts/
│   └── postinstall.js          # Post-installation setup
├── package.json                 # Dependencies and scripts
├── tsconfig.*.json             # TypeScript configurations
├── vite.config.ts              # Vite build configuration
└── README.md                   # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- Ollama (for local AI)
- Claude API key (optional)
- OpenAI API key (optional)

### Installation
```bash
cd phase1-minimal
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 🎯 Usage

### Starting the Application
1. Run `npm run dev` for development
2. A floating bubble will appear in the bottom-right corner
3. Click the bubble to open the chat panel

### Basic Commands

#### Chat with AI
- **Default (Ollama)**: `hello` - Uses local Ollama
- **Claude**: `/claude hello` - Uses Claude API
- **OpenAI**: `/gpt hello` - Uses OpenAI API

#### API Key Management
```
setkey claude YOUR_CLAUDE_API_KEY
setkey openai YOUR_OPENAI_API_KEY
```

#### File Operations
```
read path/to/file.txt          # Read file (10KB limit)
write path/to/file.txt content # Write file (100KB limit)
append path/to/file.txt content # Append to file
```

#### Browser Automation
```
browse https://example.com     # Open website
click "Button Text"            # Click element
screenshot                     # Take screenshot
close browser                  # Close browser
```

#### System Commands
```
shell dir                      # Execute command
echo "Hello World"             # Echo text
```

## 🔧 Technical Details

### Architecture
- **Main Process**: Electron main process handles IPC, file operations, browser automation
- **Renderer Process**: React-based UI with modern chat interface
- **Preload Script**: Secure IPC bridge between main and renderer
- **Multi-LLM**: Modular LLM provider system with unified interface

### Security Features
- **File Size Limits**: 10KB read, 100KB write/append
- **Path Validation**: Prevents directory traversal attacks
- **Command Filtering**: Blocks dangerous shell commands
- **API Key Security**: Keys stored locally, not committed to git

### Performance
- **Total Codebase**: 580 lines (under 650 limit)
- **Build Time**: ~500ms
- **Memory Usage**: Optimized for minimal footprint
- **Bundle Size**: ~150KB total

## 🔑 API Key Setup

### Claude API
1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Use command: `setkey claude YOUR_KEY`

### OpenAI API
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Use command: `setkey openai YOUR_KEY`

### Ollama (Local)
1. Install [Ollama](https://ollama.ai/)
2. Run: `ollama pull llama3.1`
3. No API key needed - works out of the box

## 📊 Development Phases

### Phase 1: Minimal Setup ✅
- Basic Electron app with floating bubble
- Simple chat interface
- IPC communication

### Phase 2: Core Tools ✅
- File operations (read, write, append)
- Browser automation with Playwright
- Shell command execution
- Security measures

### Phase 3: AI Integration ✅
- Ollama integration for local AI
- Streaming responses
- Error handling

### Phase 4: Enhanced UI ✅
- Modern chat interface
- Message history
- Real-time typing indicators
- Responsive design

### Phase 5A: Multi-LLM Support ✅
- Claude API integration
- OpenAI API integration
- API key management
- Provider switching

## 🚀 Future Enhancements

- **Phase 5B**: Advanced AI features (function calling, tool use)
- **Phase 6**: Plugin system for custom tools
- **Phase 7**: Multi-window support
- **Phase 8**: Cloud sync and settings

## 🐛 Troubleshooting

### Common Issues
1. **Ollama not responding**: Ensure Ollama is running and llama3.1 model is installed
2. **API key errors**: Check key format and permissions
3. **Build failures**: Run `npm install` and check Node.js version
4. **Browser automation issues**: Ensure Playwright dependencies are installed

### Debug Mode
```bash
npm run dev
# Check console for error messages
```

## 📝 License

This project is part of a development series for building AI desktop agents. All code is provided for educational and development purposes.

## 🤝 Contributing

This is a learning project. Feel free to fork and experiment with the codebase!

---

**Total Lines of Code**: 580  
**Build Status**: ✅ Working  
**Last Updated**: Phase 5A Complete