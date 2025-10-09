# Phase 6: Plugin System

## Overview

The Plugin System extends the application's functionality by allowing developers to create and install custom plugins that can provide new tools, UI components, and event handlers. This system is designed to be secure, extensible, and easy to use.

## Architecture

### Core Components

1. **Plugin Interface** (`apps/main/plugins/types.ts`)
   - Defines the structure and lifecycle of plugins
   - Includes tool registration, UI components, and event handlers

2. **Plugin Manager** (`apps/main/plugins/manager.ts`)
   - Handles loading, unloading, and discovering plugins
   - Manages plugin lifecycle and error handling
   - Integrates with the tool registry

3. **Plugin Marketplace UI** (`apps/renderer/components/PluginMarketplace.tsx`)
   - User interface for browsing and managing plugins
   - Search, filter, and plugin management functionality

## Plugin Interface

```typescript
export interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string;
  
  // Lifecycle hooks
  onLoad?(): Promise<void>;
  onUnload?(): Promise<void>;
  
  // Tool registration
  tools?: Tool[];
  
  // UI components (for future use)
  ui?: {
    settings?: React.ComponentType;
    panel?: React.ComponentType;
  };
  
  // Event handlers
  onMessage?(message: string): Promise<string | null>;
  onToolCall?(tool: string, params: any): Promise<any>;
}
```

## Plugin Structure

Each plugin should be organized in its own directory with the following structure:

```
plugins/
  plugin-name/
    package.json          # Plugin manifest
    index.ts              # Main plugin file
    README.md             # Documentation (optional)
```

### Plugin Manifest (package.json)

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Plugin Author",
  "main": "index.js",
  "dependencies": {
    "node-fetch": "^3.3.0"
  },
  "permissions": [
    "network",
    "api"
  ]
}
```

## Example Plugins

### Weather Plugin

Located at: `plugins/weather/`

Provides tools for:
- Getting current weather information
- Getting weather forecasts
- Mock data implementation (easily replaceable with real API)

**Tools:**
- `get_weather` - Get current weather for a location
- `get_weather_forecast` - Get 3-day weather forecast

### GitHub Plugin

Located at: `plugins/github/`

Provides tools for:
- Searching GitHub repositories
- Creating issues
- Listing pull requests
- Mock implementation (easily replaceable with real GitHub API)

**Tools:**
- `search_repos` - Search GitHub repositories
- `create_issue` - Create a GitHub issue
- `list_prs` - List pull requests for a repository

## Plugin Manager API

### Methods

- `initialize()` - Initialize the plugin manager and discover plugins
- `loadPlugin(pluginPath)` - Load a plugin from a file path
- `unloadPlugin(name)` - Unload a plugin by name
- `discoverPlugins()` - Discover all plugins in the plugin directory
- `getPlugins()` - Get all loaded plugins
- `getPlugin(name)` - Get a specific plugin by name
- `isPluginLoaded(name)` - Check if a plugin is loaded
- `getErrors()` - Get plugin loading errors

### IPC Handlers

The plugin manager exposes the following IPC handlers for renderer communication:

- `plugins:list` - List all discovered plugins
- `plugins:load` - Load a plugin
- `plugins:unload` - Unload a plugin
- `plugins:get-loaded` - Get all loaded plugins
- `plugins:get-errors` - Get plugin errors

## Plugin Marketplace UI

The Plugin Marketplace provides a user-friendly interface for managing plugins:

### Features

- **Browse Plugins**: View all available plugins with descriptions
- **Search & Filter**: Find plugins by name or description
- **Install/Uninstall**: Manage plugin installation
- **Enable/Disable**: Toggle plugin functionality
- **Error Display**: View plugin loading errors

### Usage

1. Click the "Plugins" button in the chat panel header
2. Browse available plugins
3. Use search and filter options to find specific plugins
4. Click "Install" to install a plugin
5. Use the toggle button to enable/disable plugins
6. Click "Uninstall" to remove plugins

## Security Considerations

### Permissions System

Plugins can declare permissions in their manifest:

- `network` - Access to network requests
- `api` - Access to external APIs
- `filesystem` - Access to file system operations
- `system` - Access to system-level operations

### Sandboxing

- Plugins run in the main process but with limited permissions
- Tool execution is validated through the tool registry
- Error handling prevents plugin crashes from affecting the main application

## Development Guide

### Creating a New Plugin

1. Create a new directory in the `plugins/` folder
2. Add a `package.json` manifest file
3. Create the main plugin file (`index.ts`)
4. Implement the Plugin interface
5. Define tools, event handlers, and lifecycle methods
6. Test the plugin by loading it through the Plugin Manager

### Example Plugin Template

```typescript
import { Plugin } from '../../apps/main/plugins/types';

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  author: 'Your Name',

  async onLoad() {
    console.log('My plugin loaded');
  },

  async onUnload() {
    console.log('My plugin unloaded');
  },

  tools: [
    {
      name: 'my_tool',
      description: 'My custom tool',
      parameters: {
        type: 'object',
        properties: {
          param1: { type: 'string', description: 'First parameter' }
        },
        required: ['param1']
      },
      handler: async ({ param1 }) => {
        return {
          success: true,
          data: { result: `Processed: ${param1}` },
          message: 'Tool executed successfully'
        };
      }
    }
  ]
};

export default myPlugin;
```

## Integration with Existing Systems

### Tool Registry Integration

- Plugin tools are automatically registered with the global tool registry
- Tools can be used by LLM providers through the existing tool execution system
- Tool validation and error handling are handled by the registry

### Memory System Integration

- Plugins can access and modify working memory through the existing memory API
- Plugin-specific data can be stored in memory for persistence
- Conversation history is available for plugins that need context

### UI Integration

- Plugin marketplace is integrated into the chat panel
- Future UI components from plugins can be rendered in dedicated panels
- Plugin settings can be exposed through the marketplace interface

## Future Enhancements

### Planned Features

1. **Plugin Store**: Online marketplace for sharing plugins
2. **Plugin Dependencies**: Automatic dependency management
3. **Plugin Updates**: Automatic update system
4. **Plugin Settings UI**: Dynamic settings panels for plugins
5. **Plugin Analytics**: Usage tracking and performance monitoring
6. **Plugin Sandboxing**: Enhanced security with plugin isolation
7. **Plugin Hot Reloading**: Development-time plugin reloading

### Extension Points

- **Custom UI Components**: Plugins can provide React components
- **Custom LLM Providers**: Plugins can add new AI model integrations
- **Custom Memory Backends**: Plugins can provide alternative storage solutions
- **Custom Tool Types**: Plugins can define new categories of tools

## Troubleshooting

### Common Issues

1. **Plugin Not Loading**: Check the plugin manifest and ensure all required fields are present
2. **Tool Not Working**: Verify tool definition matches the expected schema
3. **Permission Errors**: Ensure plugin has the required permissions in its manifest
4. **Import Errors**: Check that all dependencies are properly installed

### Debug Mode

Enable debug logging by setting the environment variable:
```
DEBUG=plugins:*
```

### Error Logging

Plugin errors are automatically logged and can be viewed through:
- The plugin marketplace error display
- The main process console output
- The `plugins:get-errors` IPC handler

## Conclusion

The Plugin System provides a robust foundation for extending the application's functionality. It balances flexibility with security, allowing developers to create powerful extensions while maintaining system stability. The system is designed to grow with the application, supporting increasingly sophisticated plugin capabilities as the platform evolves.
