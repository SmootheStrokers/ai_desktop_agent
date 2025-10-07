# Phase 1 - Minimal AI Desktop Agent

A desktop AI assistant built with Electron, featuring MCP (Model Context Protocol) integration, plugin system, and comprehensive tool support.

## Features

- **Multi-LLM Support**: Claude, OpenAI, and Ollama
- **MCP Integration**: Connect to external MCP servers for extended functionality
- **Plugin System**: Load and manage custom plugins
- **Browser Automation**: Web scraping and automation with Playwright
- **File Operations**: Read, write, and manage files
- **System Tools**: Shell execution and clipboard access
- **Memory Management**: Conversation history and working memory
- **Modern UI**: React-based interface with dark mode support

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

Edit `config.json` to add your API keys:
```json
{
  "claudeApiKey": "your-claude-api-key-here",
  "openaiApiKey": "your-openai-api-key-here"
}
```

### MCP Servers

The application comes with two MCP servers:

1. **Local Operations** (`mcp/localops_server.py`): File system and system operations
2. **Web Search** (`mcp/websearch_server.py`): Web search and URL fetching (mock implementation)

To enable a server, modify the configuration in `apps/main/index.ts`.

## Usage

### Chat Interface

- Type messages to interact with the AI assistant
- Use `/claude <message>` to force Claude provider
- Use `/gpt <message>` to force OpenAI provider
- Default provider is Ollama (if running locally)

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