import { app, BrowserWindow, screen, ipcMain } from 'electron';
import { join } from 'path';
import { readFileSync, existsSync, statSync, writeFileSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';
import { chromium, Browser, Page } from 'playwright';
import { callOllama, callClaude, callOpenAI, saveApiKey } from './llm-providers';
import { initializeTools, toolRegistry, setCurrentPage } from './tools';
import { executeWithTools, formatToolHistory } from './tool-executor';
import { getProvider } from './llm-providers-enhanced';
import { 
  getGlobalConversationStore, 
  getGlobalWorkingMemory,
  resetGlobalConversationStore,
  resetGlobalWorkingMemory
} from './memory';
import { pluginManager } from './plugins';

let bubbleWindow: BrowserWindow | null = null;
let panelWindow: BrowserWindow | null = null;
let browser: Browser | null = null;
let page: Page | null = null;

function createBubbleWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  bubbleWindow = new BrowserWindow({
    width: 64, height: 64, x: width - 80, y: height - 80,
    frame: false, alwaysOnTop: true, skipTaskbar: true, resizable: false,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    }
  });
  bubbleWindow.loadFile(join(__dirname, '../renderer/bubble.html'));
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
      nodeIntegration: false, contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    }
  });
  panelWindow.loadFile(join(__dirname, '../renderer/panel.html'));
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
    // Update the browser tools with the current page
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
      provider = 'ollama';
      userMessage = message;
    }

    try {
      const llmProvider = getProvider(provider);
      const result = await executeWithTools(llmProvider, userMessage, {
        maxIterations: 5,
        systemPrompt: 'You are a helpful AI assistant with access to various tools. Use them when appropriate to help the user. When asked about weather, use the get_weather tool. When asked about GitHub, use the GitHub tools.'
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
    
    // Build system prompt with context
    const contextInfo = workingMemory.getContext();
    const systemPrompt = request.systemPrompt || 
      `You are a helpful AI assistant with access to various tools. ${contextInfo ? '\n\n' + contextInfo : ''}`;
    
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