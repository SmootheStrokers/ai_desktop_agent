export interface ElectronAPI {
  // Bubble API
  bubbleClicked: () => void;

  // Chat API
  sendMessage: (message: string) => Promise<any>;
  onMessage: (callback: (message: string) => void) => void;
  onThinking: (callback: () => void) => void;
  onResponseStart: (callback: () => void) => void;
  onResponseChunk: (callback: (chunk: string) => void) => void;
  onResponseEnd: (callback: () => void) => void;

  // Plugin API
  listPlugins: () => Promise<{ success: boolean; data?: any; error?: string }>;
  loadPlugin: (pluginPath: string) => Promise<{ success: boolean; error?: string }>;
  unloadPlugin: (pluginName: string) => Promise<{ success: boolean; error?: string }>;
  getLoadedPlugins: () => Promise<{ success: boolean; data?: any; error?: string }>;
  getPluginErrors: () => Promise<{ success: boolean; data?: any; error?: string }>;

  // Tool API
  executeTool: (toolName: string, parameters: any) => Promise<any>;
  listTools: () => Promise<any>;
  executeWithTools: (request: any) => Promise<any>;

  // Memory API
  rememberFact: (key: string, value: any) => Promise<{ success: boolean }>;
  getFact: (key: string) => Promise<any>;
  getAllFacts: () => Promise<any>;
  rememberFile: (path: string, content?: string) => Promise<{ success: boolean }>;
  getFiles: () => Promise<any>;
  rememberURL: (url: string, metadata?: any) => Promise<{ success: boolean }>;
  getURLs: () => Promise<any>;
  getContext: () => Promise<any>;
  getMemoryStats: () => Promise<any>;
  clearMemory: () => Promise<{ success: boolean }>;
  addTask: (description: string) => Promise<any>;
  updateTask: (id: string, updates: any) => Promise<{ success: boolean }>;
  getTasks: () => Promise<any>;

  // Conversation API
  getConversationHistory: () => Promise<any>;
  getConversationStats: () => Promise<any>;
  clearConversation: () => Promise<{ success: boolean }>;
  searchConversation: (query: string) => Promise<any>;
  exportConversation: () => Promise<any>;

  // MCP API
  mcp: {
    getServers: () => Promise<{ success: boolean; data?: any; error?: string }>;
    connect: (config: any) => Promise<{ success: boolean; error?: string }>;
    disconnect: (serverName: string) => Promise<{ success: boolean; error?: string }>;
    getTools: (serverName?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    callTool: (serverName: string, toolName: string, args: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    getConnected: () => Promise<{ success: boolean; data?: string[]; error?: string }>;
    isConnected: (serverName: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};

