import { app, BrowserWindow, screen, ipcMain } from 'electron';
import { join } from 'path';
import { readFileSync, existsSync, statSync, writeFileSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';
import { chromium, Browser, Page } from 'playwright';
import { callOllama, callClaude, callOpenAI, saveApiKey } from './llm-providers';
import { initializeTools, toolRegistry, setCurrentPage, setCurrentBrowser } from './tools';
import { executeWithTools, formatToolHistory } from './tool-executor';
import { registerMCPTools } from './tools';
import { getProvider } from './llm-providers-enhanced';
import { 
  getGlobalConversationStore, 
  getGlobalWorkingMemory,
  resetGlobalConversationStore,
  resetGlobalWorkingMemory
} from './memory';
import { PluginManager } from './plugins';

// Create plugin manager with shared tool registry
const pluginManager = new PluginManager(toolRegistry);

let bubbleWindow: BrowserWindow | null = null;
let panelWindow: BrowserWindow | null = null;
let browser: Browser | null = null;
let page: Page | null = null;

function createBubbleWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const bubbleSize = 80; // Increased size to accommodate the 72px bubble with some padding
  bubbleWindow = new BrowserWindow({
    width: bubbleSize, 
    height: bubbleSize, 
    x: width - bubbleSize - 20, // 20px margin from right edge
    y: height - bubbleSize - 20, // 20px margin from bottom edge
    frame: false, alwaysOnTop: true, skipTaskbar: true, resizable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false, 
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      webSecurity: false, // Disable web security for local development
      allowRunningInsecureContent: false
    }
  });
  
  const htmlPath = join(__dirname, '../renderer/bubble.html');
  bubbleWindow.loadFile(htmlPath).catch(err => {
    console.error('[Bubble] Failed to load:', err);
    console.log('[Bubble] Retrying in 1 second...');
    setTimeout(() => {
      bubbleWindow?.loadFile(htmlPath);
    }, 1000);
  });
  
  bubbleWindow.setMovable(true);
  bubbleWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'mouseDown') togglePanel();
  });
  bubbleWindow.webContents.on('ipc-message', (event, channel) => {
    if (channel === 'bubble-clicked') togglePanel();
  });
}

function createPanelWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  panelWindow = new BrowserWindow({
    width: 420, height: 600, x: width - 440, y: height - 620,
    frame: false, alwaysOnTop: true, skipTaskbar: true, resizable: false, show: false,
    webPreferences: {
      nodeIntegration: false, 
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      webSecurity: false, // Disable web security for local development
      allowRunningInsecureContent: false
    }
  });
  
  const htmlPath = join(__dirname, '../renderer/panel.html');
  panelWindow.loadFile(htmlPath).catch(err => {
    console.error('[Panel] Failed to load:', err);
    console.log('[Panel] Retrying in 1 second...');
    setTimeout(() => {
      panelWindow?.loadFile(htmlPath);
    }, 1000);
  });
  
  panelWindow.on('closed', () => { panelWindow = null; });
}

function togglePanel() {
  if (!panelWindow) createPanelWindow();
  if (panelWindow) {
    if (panelWindow.isVisible()) panelWindow.hide();
    else { panelWindow.show(); panelWindow.focus(); }
  }
}


// Echo tool implementation
function echoTool(text: string): string {
  return text;
}

function readFileTool(filePath: string): string {
  try {
    if (!existsSync(filePath)) return `Error: File not found: ${filePath}`;
    const stats = statSync(filePath);
    if (stats.size > 10 * 1024) return `Error: File too large (${Math.round(stats.size / 1024)}KB). Maximum size is 10KB.`;
    const content = readFileSync(filePath, 'utf-8');
    return `File content (${filePath}):\n\n${content}`;
  } catch (error) {
    return `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function launchBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    page = await context.newPage();
    // Update the browser tools with the current page and browser
    setCurrentBrowser(browser);
    setCurrentPage(page);
  }
}

async function browseTool(url: string): Promise<string> {
  try {
    await launchBrowser();
    await page!.goto(url, { waitUntil: 'domcontentloaded' });
    return `Opened: ${url}`;
  } catch (error) {
    return `Error opening URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function clickTool(text: string): Promise<string> {
  try {
    if (!page) return 'Error: No browser open. Use "browse [url]" first.';
    await page.click(`text=${text}`);
    return `Clicked element containing: ${text}`;
  } catch (error) {
    return `Error clicking: ${error instanceof Error ? error.message : 'Element not found'}`;
  }
}

async function screenshotTool(): Promise<string> {
  try {
    if (!page) return 'Error: No browser open. Use "browse [url]" first.';
    const path = 'C:\\Users\\willi\\Desktop\\screenshot.png';
    await page.screenshot({ path });
    return `Screenshot saved to: ${path}`;
  } catch (error) {
    return `Error taking screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function closeBrowserTool(): Promise<string> {
  try {
    if (browser) {
      await browser.close();
      browser = null; page = null;
      setCurrentBrowser(null);
      setCurrentPage(null);
      return 'Browser closed';
    }
    return 'No browser open';
  } catch (error) {
    return `Error closing browser: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function writeFileTool(filePath: string, content: string): string {
  try {
    const contentSize = Buffer.byteLength(content, 'utf8');
    if (contentSize > 100 * 1024) return `Error: Content too large (${Math.round(contentSize / 1024)}KB). Maximum size is 100KB.`;
    if (filePath.includes('..') || filePath.includes('//')) return 'Error: Invalid file path';
    writeFileSync(filePath, content, 'utf-8');
    return `File written successfully: ${filePath} (${Math.round(contentSize / 1024)}KB)`;
  } catch (error) {
    return `Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function appendFileTool(filePath: string, content: string): string {
  try {
    let currentSize = 0;
    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      currentSize = stats.size;
    }
    const contentSize = Buffer.byteLength(content, 'utf8');
    const totalSize = currentSize + contentSize;
    if (totalSize > 100 * 1024) return `Error: File would be too large (${Math.round(totalSize / 1024)}KB). Maximum size is 100KB.`;
    if (filePath.includes('..') || filePath.includes('//')) return 'Error: Invalid file path';
    appendFileSync(filePath, content, 'utf-8');
    return `Content appended to: ${filePath} (${Math.round(contentSize / 1024)}KB added)`;
  } catch (error) {
    return `Error appending to file: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function shellTool(command: string): string {
  try {
    const dangerousCommands = ['rm', 'del', 'format', 'shutdown', 'restart', 'reboot'];
    const lowerCommand = command.toLowerCase();
    for (const dangerous of dangerousCommands) {
      if (lowerCommand.includes(dangerous)) return `Error: Command blocked for security: ${command}`;
    }
    const result = execSync(command, { encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 });
    const output = result.toString();
    if (output.length > 10000) return output.substring(0, 10000) + '\n... (output truncated)';
    return output;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) return 'Error: Command timed out after 30 seconds';
      if (error.message.includes('maxBuffer')) return 'Error: Command output too large (max 10KB)';
      return `Error: ${error.message}`;
    }
    return 'Error: Unknown error executing command';
  }
}

// Handle chat messages
ipcMain.handle('chat:send-message', async (event, message: string) => {
  try {
    // Check for API key management
    if (message.startsWith('setkey ')) {
      const parts = message.slice(7).split(' ');
      if (parts.length < 2) {
        return { type: 'error', result: 'Usage: setkey [claude|openai] [key]' };
      }
      const provider = parts[0].toLowerCase();
      const key = parts.slice(1).join(' ');
      if (provider !== 'claude' && provider !== 'openai') {
        return { type: 'error', result: 'Provider must be "claude" or "openai"' };
      }
      const result = saveApiKey(provider as 'claude' | 'openai', key);
      return { type: 'system', result };
    }

    // Check if it's an echo command
    if (message.startsWith('echo ')) {
      const text = message.slice(5);
      return { type: 'echo', result: echoTool(text) };
    }

    // Check if it's a read command
    if (message.startsWith('read ')) {
      const filePath = message.slice(5).trim();
      const result = readFileTool(filePath);
      return { type: 'read', result };
    }

    // Check if it's a write command
    if (message.startsWith('write ')) {
      const parts = message.slice(6).trim().split(' ');
      if (parts.length < 2) {
        return { type: 'error', result: 'Error: Usage: write [path] [content]' };
      }
      const filePath = parts[0];
      const content = parts.slice(1).join(' ');
      const result = writeFileTool(filePath, content);
      return { type: 'write', result };
    }

    // Check if it's an append command
    if (message.startsWith('append ')) {
      const parts = message.slice(7).trim().split(' ');
      if (parts.length < 2) {
        return { type: 'error', result: 'Error: Usage: append [path] [content]' };
      }
      const filePath = parts[0];
      const content = parts.slice(1).join(' ');
      const result = appendFileTool(filePath, content);
      return { type: 'append', result };
    }

    // Check if it's a browse command
    if (message.startsWith('browse ')) {
      const url = message.slice(7).trim();
      const result = await browseTool(url);
      return { type: 'browser', result };
    }

    // Check if it's a click command
    if (message.startsWith('click ')) {
      const text = message.slice(6).trim();
      const result = await clickTool(text);
      return { type: 'browser', result };
    }

    // Check if it's a screenshot command
    if (message.toLowerCase() === 'screenshot') {
      const result = await screenshotTool();
      return { type: 'browser', result };
    }

    // Check if it's a close browser command
    if (message.toLowerCase() === 'close browser' || message.toLowerCase() === 'close') {
      const result = await closeBrowserTool();
      return { type: 'browser', result };
    }

    // Check if it's a shell command
    if (message.startsWith('shell ')) {
      const command = message.slice(6).trim();
      const result = shellTool(command);
      return { type: 'shell', result };
    }

    // Use tool-enabled LLM execution
    let provider;
    let userMessage = message;
    
    if (message.startsWith('/claude ')) {
      provider = 'claude';
      userMessage = message.slice(8);
    } else if (message.startsWith('/gpt ')) {
      provider = 'openai';
      userMessage = message.slice(5);
    } else {
      // Default to Claude (which supports tools)
      provider = 'claude';
      userMessage = message;
    }

    try {
      const llmProvider = getProvider(provider);
      
      // Get all available tools
      const availableTools = toolRegistry.getAll();
      console.log(`[DEBUG] Available tools count: ${availableTools.length}`);
      console.log(`[DEBUG] Available tools:`, availableTools.map(t => t.name));
      const toolList = availableTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
      
      const systemPrompt = `You are a helpful AI assistant with access to various tools. You MUST use these tools to perform actions - you cannot do things directly.

Available Tools:
${toolList}

IMPORTANT INSTRUCTIONS:
- When the user asks to open a website or browser (e.g., "open google.com"), use the browser_launch tool first, then browser_navigate
- browser_navigate has a default timeout of 120 seconds (2 minutes) and uses 'load' as waitUntil condition
- For slow-loading sites, you can increase the timeout parameter or use 'domcontentloaded' for faster loading
- When asked about weather, use the get_weather tool
- When asked about GitHub, use the GitHub tools (search_repos, create_issue, list_prs)
- For file operations, use file_read, file_write, file_append, or file_list tools
- For system commands, use shell_execute tool
- When asked about system information, use the localops MCP tools
- When asked "what tools do you have", list the specific tools above, not generic capabilities

YOU MUST USE TOOLS - Do not say you cannot do something if there is a tool available for it!`;
      
      const result = await executeWithTools(llmProvider, userMessage, {
        maxIterations: 5,
        systemPrompt
      });

      if (result.success) {
        return { type: 'llm', result: result.finalResponse };
      } else {
        return { type: 'error', result: result.error || 'Tool execution failed' };
      }
    } catch (error) {
      // Fallback to simple LLM call if tool execution fails
      let llmResponse = '';
      if (provider === 'claude') {
        llmResponse = await callClaude(userMessage);
      } else if (provider === 'openai') {
        llmResponse = await callOpenAI(userMessage);
      } else {
        llmResponse = await callOllama(userMessage);
      }
      return { type: 'llm', result: llmResponse };
    }
  } catch (error) {
    return { type: 'error', result: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// New IPC handler for tool execution
ipcMain.handle('execute-tool', async (event, toolName: string, parameters: any) => {
  try {
    const result = await toolRegistry.execute(toolName, parameters);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Tool execution failed'
    };
  }
});

// New IPC handler to list available tools
ipcMain.handle('list-tools', async () => {
  return toolRegistry.getAllDefinitions();
});

// Advanced IPC handler for tool execution with multi-step reasoning
ipcMain.handle('execute-with-tools', async (event, request: {
  provider: string;
  message: string;
  maxIterations?: number;
  systemPrompt?: string;
}) => {
  try {
    const provider = getProvider(request.provider);
    const conversationStore = getGlobalConversationStore();
    const workingMemory = getGlobalWorkingMemory();
    
    // Get all available tools
    const availableTools = toolRegistry.getAll();
    const toolList = availableTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
    
    // Build system prompt with context
    const contextInfo = workingMemory.getContext();
    const systemPrompt = request.systemPrompt || 
      `You are a helpful AI assistant with access to various tools. You MUST use these tools to perform actions - you cannot do things directly.${contextInfo ? '\n\n' + contextInfo : ''}

Available Tools:
${toolList}

IMPORTANT INSTRUCTIONS:
- When the user asks to open a website or browser (e.g., "open google.com"), use the browser_launch tool first, then browser_navigate
- browser_navigate has a default timeout of 120 seconds (2 minutes) and uses 'load' as waitUntil condition
- For slow-loading sites, you can increase the timeout parameter or use 'domcontentloaded' for faster loading
- When asked about weather, use the get_weather tool
- When asked about GitHub, use the GitHub tools (search_repos, create_issue, list_prs)
- For file operations, use file_read, file_write, file_append, or file_list tools
- For system commands, use shell_execute tool
- When asked about system information, use the localops MCP tools
- When asked "what tools do you have", list the specific tools above, not generic capabilities

YOU MUST USE TOOLS - Do not say you cannot do something if there is a tool available for it!`;
    
    // Execute with tools
    const result = await executeWithTools(provider, request.message, {
      maxIterations: request.maxIterations || 10,
      systemPrompt,
      onProgress: (message, iteration) => {
        // Send progress updates to renderer
        if (panelWindow && !panelWindow.isDestroyed()) {
          panelWindow.webContents.send('tool-progress', { message, iteration });
        }
      }
    });
    
    // Update conversation store
    conversationStore.add({ role: 'user', content: request.message });
    conversationStore.add({ role: 'assistant', content: result.finalResponse });
    
    return result;
  } catch (error) {
    return {
      success: false,
      finalResponse: error instanceof Error ? error.message : 'Unknown error',
      iterations: 0,
      toolCalls: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Streaming chat handler
ipcMain.handle('chat:send-message-stream', async (event, request: {
  provider: string;
  message: string;
}) => {
  try {
    const llmProvider = getProvider(request.provider) as any;
    const conversationStore = getGlobalConversationStore();
    
    // Check if provider supports streaming
    if (typeof llmProvider.chatStream !== 'function') {
      throw new Error(`Provider ${request.provider} does not support streaming`);
    }

    // Build messages
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: request.message }
    ];

    // Stream response
    await llmProvider.chatStream(messages, (chunk: string) => {
      if (panelWindow && !panelWindow.isDestroyed()) {
        panelWindow.webContents.send('chat:stream-chunk', chunk);
      }
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Conversation memory handlers
ipcMain.handle('conversation:get-history', async () => {
  const store = getGlobalConversationStore();
  return store.getAllMessages();
});

ipcMain.handle('conversation:get-stats', async () => {
  const store = getGlobalConversationStore();
  return store.getStats();
});

ipcMain.handle('conversation:clear', async () => {
  resetGlobalConversationStore();
  return { success: true };
});

ipcMain.handle('conversation:search', async (event, query: string) => {
  const store = getGlobalConversationStore();
  return store.search(query);
});

ipcMain.handle('conversation:export', async () => {
  const store = getGlobalConversationStore();
  return store.export();
});

// Plugin management handlers
ipcMain.handle('plugins:list', async () => {
  try {
    const plugins = await pluginManager.discoverPlugins();
    return { success: true, data: plugins };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to list plugins' };
  }
});

ipcMain.handle('plugins:load', async (event, pluginPath: string) => {
  try {
    const success = await pluginManager.loadPlugin(pluginPath);
    return { success, error: success ? null : 'Failed to load plugin' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to load plugin' };
  }
});

ipcMain.handle('plugins:unload', async (event, pluginName: string) => {
  try {
    const success = await pluginManager.unloadPlugin(pluginName);
    return { success, error: success ? null : 'Failed to unload plugin' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to unload plugin' };
  }
});

ipcMain.handle('plugins:get-loaded', async () => {
  try {
    const plugins = pluginManager.getPlugins();
    return { success: true, data: plugins };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get loaded plugins' };
  }
});

ipcMain.handle('plugins:get-errors', async () => {
  try {
    const errors = pluginManager.getErrors();
    return { success: true, data: errors };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get plugin errors' };
  }
});

// Working memory handlers
ipcMain.handle('memory:remember-fact', async (event, key: string, value: any) => {
  const memory = getGlobalWorkingMemory();
  memory.rememberFact(key, value);
  return { success: true };
});

ipcMain.handle('memory:get-fact', async (event, key: string) => {
  const memory = getGlobalWorkingMemory();
  return memory.getFact(key);
});

ipcMain.handle('memory:get-all-facts', async () => {
  const memory = getGlobalWorkingMemory();
  return memory.getAllFacts();
});

ipcMain.handle('memory:remember-file', async (event, path: string, content?: string) => {
  const memory = getGlobalWorkingMemory();
  memory.rememberFile(path, content);
  return { success: true };
});

ipcMain.handle('memory:get-files', async () => {
  const memory = getGlobalWorkingMemory();
  return memory.getAllFiles();
});

ipcMain.handle('memory:remember-url', async (event, url: string, metadata?: any) => {
  const memory = getGlobalWorkingMemory();
  memory.rememberURL(url, metadata);
  return { success: true };
});

ipcMain.handle('memory:get-urls', async () => {
  const memory = getGlobalWorkingMemory();
  return memory.getAllURLs();
});

ipcMain.handle('memory:get-context', async () => {
  const memory = getGlobalWorkingMemory();
  return memory.getDetailedContext();
});

ipcMain.handle('memory:get-stats', async () => {
  const memory = getGlobalWorkingMemory();
  return memory.getStats();
});

ipcMain.handle('memory:clear', async () => {
  resetGlobalWorkingMemory();
  return { success: true };
});

ipcMain.handle('memory:add-task', async (event, description: string) => {
  const memory = getGlobalWorkingMemory();
  return memory.addTask(description);
});

ipcMain.handle('memory:update-task', async (event, id: string, updates: any) => {
  const memory = getGlobalWorkingMemory();
  memory.updateTask(id, updates);
  return { success: true };
});

ipcMain.handle('memory:get-tasks', async () => {
  const memory = getGlobalWorkingMemory();
  return memory.getAllTasks();
});

// ============================================================================
// MCP IPC Handlers
// ============================================================================

import { mcpClientManager, MCPServerConfig } from './mcp';

/**
 * Get list of all configured MCP servers with their status
 */
ipcMain.handle('mcp:get-servers', async () => {
  try {
    const status = mcpClientManager.getStatus();
    return { success: true, data: status };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MCP] Error getting servers:', errorMessage);
    return { success: false, error: errorMessage };
  }
});

/**
 * Connect to an MCP server
 */
ipcMain.handle('mcp:connect', async (_, config: MCPServerConfig) => {
  try {
    await mcpClientManager.connect(config);
    // Re-register MCP tools after connecting
    await registerMCPTools();
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MCP] Error connecting to server:', errorMessage);
    return { success: false, error: errorMessage };
  }
});

/**
 * Disconnect from an MCP server
 */
ipcMain.handle('mcp:disconnect', async (_, serverName: string) => {
  try {
    await mcpClientManager.disconnect(serverName);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MCP] Error disconnecting from server:', errorMessage);
    return { success: false, error: errorMessage };
  }
});

/**
 * Get tools from a specific server or all servers
 */
ipcMain.handle('mcp:get-tools', async (_, serverName?: string) => {
  try {
    const tools = mcpClientManager.getTools(serverName);
    return { success: true, data: tools };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MCP] Error getting tools:', errorMessage);
    return { success: false, error: errorMessage };
  }
});

/**
 * Call a tool on an MCP server
 */
ipcMain.handle('mcp:call-tool', async (_, serverName: string, toolName: string, args: any) => {
  try {
    const result = await mcpClientManager.callTool(serverName, toolName, args);
    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MCP] Error calling tool:', errorMessage);
    return { success: false, error: errorMessage };
  }
});

/**
 * Get list of connected server names
 */
ipcMain.handle('mcp:get-connected', async () => {
  try {
    const connected = mcpClientManager.getConnectedServers();
    return { success: true, data: connected };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MCP] Error getting connected servers:', errorMessage);
    return { success: false, error: errorMessage };
  }
});

/**
 * Check if a specific server is connected
 */
ipcMain.handle('mcp:is-connected', async (_, serverName: string) => {
  try {
    const isConnected = mcpClientManager.isConnected(serverName);
    return { success: true, data: isConnected };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MCP] Error checking connection:', errorMessage);
    return { success: false, error: errorMessage };
  }
});

// Configure cache directory to avoid access denied errors
app.setPath('userData', join(app.getPath('appData'), 'phase1-minimal-agent'));
app.setPath('cache', join(app.getPath('userData'), 'cache'));
app.setPath('temp', join(app.getPath('userData'), 'temp'));

app.whenReady().then(async () => {
  // Initialize the tool system
  initializeTools();
  
  // Initialize the plugin system
  await pluginManager.initialize();
  
  console.log('✓ Phase 6: Plugin System initialized');
  console.log('  - Tool execution loop ready');
  console.log('  - Enhanced LLM providers ready');
  console.log('  - Conversation memory ready');
  console.log('  - Working memory ready');
  console.log('  - Plugin manager ready');
  
  // Auto-connect to MCP servers
  console.log('[MCP] Auto-connecting to enabled servers...');
  
  // Define default MCP servers
  const defaultServers: MCPServerConfig[] = [
    {
      name: 'localops',
      command: ['python', join(__dirname, '../../mcp/localops_server.py')],
      enabled: true,
      description: 'Local filesystem and system operations'
    },
    {
      name: 'websearch',
      command: ['python', join(__dirname, '../../mcp/websearch_server.py')],
      enabled: false, // Disabled by default
      description: 'Web search and URL fetching'
    }
  ];

  for (const config of defaultServers) {
    if (config.enabled) {
      try {
        await mcpClientManager.connect(config);
        console.log(`[MCP] Auto-connected to ${config.name}`);
      } catch (error) {
        console.error(`[MCP] Failed to auto-connect to ${config.name}:`, error);
      }
    }
  }

  // Register MCP tools with the tool registry
  await registerMCPTools();
  
  createBubbleWindow();
  createPanelWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createBubbleWindow();
    createPanelWindow();
  }
});