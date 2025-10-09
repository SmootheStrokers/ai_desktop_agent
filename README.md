# Phase 1 - Minimal AI Desktop Agent

A desktop AI assistant built with Electron, featuring MCP (Model Context Protocol) integration, plugin system, and comprehensive tool support with an enhanced user experience.

## Features

### 🚀 NEW: Build Literally Anything!
- **Dynamic Project Generator**: Ask the AI to build ANY application in natural language
- **AI-Powered Code Generation**: Generates complete, working code for your ideas
- **Visual Desktop Integration**: Automatically opens VSCode, browser, and file explorer
- **Multi-Technology Support**: HTML/CSS/JS, React, Node.js, Python, Electron, and more
- **Production-Ready Apps**: Beautiful UI, complete functionality, full documentation

**Examples:** "Build me a todo app", "Create a weather dashboard", "Make a typing speed game", "Build a REST API"

👉 **See `BUILD_ANYTHING_QUICK_START.md` for quick examples and `DYNAMIC_PROJECT_BUILDER_GUIDE.md` for the complete guide!**

### Core Features
- **Multi-LLM Support**: Claude, OpenAI, and Ollama
- **MCP Integration**: Connect to external MCP servers for extended functionality
- **Plugin System**: Load and manage custom plugins
- **Browser Automation**: Web scraping and automation with Playwright
- **File Operations**: Read, write, and manage files
- **System Tools**: Shell execution and clipboard access
- **Memory Management**: Conversation history and working memory

### ✨ Phase 7: Enhanced UI & UX
- **Streaming Responses**: Real-time character-by-character AI responses
- **Visual Tool Feedback**: Beautiful animated tool execution status
- **Chat History Sidebar**: Searchable conversation history with filters
- **Enhanced Settings**: Multi-tab settings with theme control
- **Keyboard Shortcuts**: Power-user navigation (Ctrl+K, Ctrl+H, Ctrl+,)
- **Notification System**: Elegant toast notifications
- **Modern UI**: React-based interface with full dark mode support

## Setup

### Prerequisites

- Node.js 18+
- Python 3.8+ (for MCP servers)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project:
```bash
cd phase1-minimal
```

2. Install dependencies:
```bash
npm install
```

3. Set up API keys:
```bash
cp config.example.json config.json
# Edit config.json and add your API keys
```

4. Build the application:
```bash
npm run build
```

5. Run the application:
```bash
npm run dev
```

## Configuration

### API Keys

**Recommended Method (Secure):** Use `.env.local` file:

1. Create `.env.local` in the project root:
```env
CLAUDE_API_KEY=your-claude-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

2. **Automatic Project Integration**: When you build projects through chat, the AI automatically copies your API keys from `.env.local` into the generated project's `.env` file!

**Alternative Method:** Edit `config.json`:
```json
{
  "claudeApiKey": "your-claude-api-key-here",
  "openaiApiKey": "your-openai-api-key-here"
}
```

📖 **See `ENV_LOCAL_SETUP.md` for detailed setup instructions and security best practices.**

### MCP Servers

The application comes with two MCP servers:

1. **Local Operations** (`mcp/localops_server.py`): File system and system operations
2. **Web Search** (`mcp/websearch_server.py`): Web search and URL fetching (mock implementation)

To enable a server, modify the configuration in `apps/main/index.ts`.

## Usage

### Building Applications

Simply ask the AI to build anything you want:

```
"Build me a todo list app"
"Create a weather dashboard"
"Make a typing speed game"
"Build a REST API for managing tasks"
```

The AI will:
1. 🧠 Understand your requirements
2. 💻 Generate complete, working code
3. 🎨 Create a beautiful UI
4. 🚀 Set up everything on your desktop (VSCode + Browser)

**All projects are saved to:** `C:\Users\YourName\AI-Projects\[project-name]\`

### Chat Interface

- Type messages to interact with the AI assistant
- Watch responses stream in real-time (Claude & OpenAI)
- Use `/claude <message>` to force Claude provider
- Use `/gpt <message>` to force OpenAI provider
- Default provider can be set in Settings

### Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus chat input
- `Ctrl/Cmd + H` - Toggle chat history sidebar
- `Ctrl/Cmd + ,` - Open settings
- `Escape` - Close all modals
- `Enter` - Send message
- `Shift + Enter` - New line in message

### Tools

The assistant has access to various tools:

- **File Operations**: `read`, `write`, `append`, `list`
- **Browser Automation**: `browse`, `click`, `screenshot`, `close browser`
- **System Commands**: `shell <command>`
- **MCP Tools**: Automatically available from connected servers

### Plugin System

- Click the "Plugins" button to open the plugin marketplace
- Install, enable, or disable plugins
- Plugins can provide additional tools and functionality

### Settings & Customization

- Access settings with `Ctrl+,` or the settings button
- **General**: Choose AI provider, configure notifications
- **Appearance**: Select theme (Light/Dark/System)
- **MCP Servers**: Manage MCP connections
- **Advanced**: Configure tool execution parameters

### Chat History

- Access history with `Ctrl+H` or the history button
- Search through all conversations
- Filter by role (user/assistant/all)
- Export conversations to JSON
- View statistics (messages, tokens)

## Development

### Project Structure

```
phase1-minimal/
├── apps/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload scripts
│   └── renderer/       # React UI components
├── mcp/               # MCP server implementations
├── plugins/           # Plugin implementations
└── public/            # Static assets
```

### Building

```bash
# Development build with watch
npm run build:watch

# Production build
npm run build

# Run in development
npm run dev
```

### Adding New Tools

1. Create a tool definition in `apps/main/tools/`
2. Register it in `apps/main/tools/index.ts`
3. The tool will be automatically available to the AI

### Creating Plugins

1. Create a plugin directory in `plugins/`
2. Add a `package.json` with plugin metadata
3. Implement the plugin interface from `apps/main/plugins/types.ts`
4. The plugin will be automatically discovered and loaded

## Phase 7 Documentation

For detailed information about the enhanced UI features:
- **Complete Guide**: See `PHASE7_ENHANCED_UI_UX.md`
- **Quick Reference**: See `PHASE7_QUICK_REFERENCE.md`
- **Summary**: See `PHASE7_SUMMARY.md`

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your API keys are correctly set in `config.json`
2. **MCP Server Connection**: Check that Python is installed and MCP servers are accessible
3. **Build Errors**: Run `npm install` to ensure all dependencies are installed
4. **Browser Automation**: Ensure Playwright is properly installed

### Logs

Check the console output for detailed error messages and debugging information.

## License

MIT License - see LICENSE file for details.