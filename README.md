# Desktop Agent - Phase 1

Minimal viable AI desktop agent with Electron + Ollama integration.

## Features

- **Bubble Window**: 64px circle in bottom-right corner, always on top
- **Panel Window**: 420x600px chat interface, toggles on bubble click
- **Ollama Integration**: Connects to localhost:11434 with llama3.1 model
- **Echo Tool**: Simple tool for testing (`echo hello world`)
- **Streaming Responses**: Real-time token streaming from Ollama

## Prerequisites

1. **Ollama installed and running**:
   ```bash
   # Install Ollama (if not already installed)
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull the llama3.1 model
   ollama pull llama3.1
   
   # Start Ollama server
   ollama serve
   ```

2. **Node.js 18+**

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

1. The bubble appears in the bottom-right corner
2. Click the bubble to open the chat panel
3. Type messages to chat with the AI
4. Try the echo tool: `echo hello world`
5. Ask questions and get responses from llama3.1

## Project Structure

```
apps/
├── main/           # Electron main process
├── preload/        # Preload scripts for security
└── renderer/       # React UI components
    ├── bubble.html # Bubble window
    ├── panel.html  # Chat panel window
    └── components/ # React components
```

## Build

```bash
# Build all components
npm run build

# Development with watch mode
npm run dev
```

## Success Criteria ✅

- [x] `npm install` works
- [x] `npm run dev` starts the app
- [x] Bubble appears bottom-right
- [x] Click bubble opens panel
- [x] Type "hello" and Ollama responds
- [x] Echo tool works: `echo hello world`
- [x] No TypeScript errors
- [x] No runtime errors in console
- [x] Under 1000 lines of code

## What's NOT Included (Phase 2+)

- OpenAI/Claude fallback
- Settings UI
- File/browser/command tools
- MCP servers
- Approval flows
- System tray
- Global hotkeys
- Audit logs
- Multiple LLM providers