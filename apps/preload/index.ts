import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Bubble API
  bubbleClicked: () => ipcRenderer.send('bubble-clicked'),
  
  // Chat API
  sendMessage: (message: string) => ipcRenderer.invoke('chat:send-message', message),
  sendMessageStream: (request: { provider: string; message: string }) => 
    ipcRenderer.invoke('chat:send-message-stream', request),
  onStreamChunk: (callback: (chunk: string) => void) => {
    ipcRenderer.on('chat:stream-chunk', (event, chunk) => callback(chunk));
    return () => ipcRenderer.removeAllListeners('chat:stream-chunk');
  },
  onToolProgress: (callback: (data: { message: string; iteration: number }) => void) => {
    ipcRenderer.on('tool-progress', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('tool-progress');
  },
  onMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('chat:message', (event, message) => callback(message));
  },
  onThinking: (callback: () => void) => {
    ipcRenderer.on('chat:thinking', callback);
  },
  onResponseStart: (callback: () => void) => {
    ipcRenderer.on('chat:response-start', callback);
  },
  onResponseChunk: (callback: (chunk: string) => void) => {
    ipcRenderer.on('chat:response-chunk', (event, chunk) => callback(chunk));
  },
  onResponseEnd: (callback: () => void) => {
    ipcRenderer.on('chat:response-end', callback);
  },

  // Plugin API
  listPlugins: () => ipcRenderer.invoke('plugins:list'),
  loadPlugin: (pluginPath: string) => ipcRenderer.invoke('plugins:load', pluginPath),
  unloadPlugin: (pluginName: string) => ipcRenderer.invoke('plugins:unload', pluginName),
  getLoadedPlugins: () => ipcRenderer.invoke('plugins:get-loaded'),
  getPluginErrors: () => ipcRenderer.invoke('plugins:get-errors'),

  // Tool API
  executeTool: (toolName: string, parameters: any) => ipcRenderer.invoke('execute-tool', toolName, parameters),
  listTools: () => ipcRenderer.invoke('list-tools'),
  executeWithTools: (request: any) => ipcRenderer.invoke('execute-with-tools', request),

  // Memory API
  rememberFact: (key: string, value: any) => ipcRenderer.invoke('memory:remember-fact', key, value),
  getFact: (key: string) => ipcRenderer.invoke('memory:get-fact', key),
  getAllFacts: () => ipcRenderer.invoke('memory:get-all-facts'),
  rememberFile: (path: string, content?: string) => ipcRenderer.invoke('memory:remember-file', path, content),
  getFiles: () => ipcRenderer.invoke('memory:get-files'),
  rememberURL: (url: string, metadata?: any) => ipcRenderer.invoke('memory:remember-url', url, metadata),
  getURLs: () => ipcRenderer.invoke('memory:get-urls'),
  getContext: () => ipcRenderer.invoke('memory:get-context'),
  getMemoryStats: () => ipcRenderer.invoke('memory:get-stats'),
  clearMemory: () => ipcRenderer.invoke('memory:clear'),
  addTask: (description: string) => ipcRenderer.invoke('memory:add-task', description),
  updateTask: (id: string, updates: any) => ipcRenderer.invoke('memory:update-task', id, updates),
  getTasks: () => ipcRenderer.invoke('memory:get-tasks'),

  // Conversation API
  getConversationHistory: () => ipcRenderer.invoke('conversation:get-history'),
  getConversationStats: () => ipcRenderer.invoke('conversation:get-stats'),
  clearConversation: () => ipcRenderer.invoke('conversation:clear'),
  searchConversation: (query: string) => ipcRenderer.invoke('conversation:search', query),
  exportConversation: () => ipcRenderer.invoke('conversation:export'),

  // MCP API
  mcp: {
    /**
     * Get list of all configured MCP servers with their status
     */
    getServers: () => ipcRenderer.invoke('mcp:get-servers'),

    /**
     * Connect to an MCP server
     */
    connect: (config: any) => ipcRenderer.invoke('mcp:connect', config),

    /**
     * Disconnect from an MCP server
     */
    disconnect: (serverName: string) => ipcRenderer.invoke('mcp:disconnect', serverName),

    /**
     * Get tools from a specific server or all servers
     */
    getTools: (serverName?: string) => ipcRenderer.invoke('mcp:get-tools', serverName),

    /**
     * Call a tool on an MCP server
     */
    callTool: (serverName: string, toolName: string, args: any) => 
      ipcRenderer.invoke('mcp:call-tool', serverName, toolName, args),

    /**
     * Get list of connected server names
     */
    getConnected: () => ipcRenderer.invoke('mcp:get-connected'),

    /**
     * Check if a specific server is connected
     */
    isConnected: (serverName: string) => ipcRenderer.invoke('mcp:is-connected', serverName),
  }
});
