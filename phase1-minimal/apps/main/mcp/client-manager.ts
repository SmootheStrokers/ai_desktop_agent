import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Configuration for an MCP server connection
 */
export interface MCPServerConfig {
  /** Unique identifier (e.g., "localops") */
  name: string;
  /** Command to spawn server (e.g., ["python", "mcp/localops_server.py"]) */
  command: string[];
  /** Whether to auto-connect on startup */
  enabled: boolean;
  /** Human-readable description */
  description?: string;
}

/**
 * Status information for a connected MCP server
 */
export interface MCPServerStatus {
  name: string;
  connected: boolean;
  toolCount: number;
  error?: string;
  config?: MCPServerConfig;
}

/**
 * Represents a tool provided by an MCP server
 */
export interface MCPTool {
  serverName: string;
  toolName: string;
  /** Format: "serverName:toolName" */
  fullName: string;
  description: string;
  /** JSON schema from MCP server */
  inputSchema: any;
}

/**
 * Internal representation of a connected MCP client
 */
interface ConnectedClient {
  client: Client;
  transport: StdioClientTransport;
  tools: MCPTool[];
}

/**
 * Manages connections to external MCP servers and their tools
 * 
 * This class provides a centralized interface for:
 * - Connecting to and disconnecting from MCP servers
 * - Discovering tools provided by servers
 * - Executing tools on remote servers
 * - Querying server status and available tools
 */
export class MCPClientManager {
  private clients: Map<string, ConnectedClient> = new Map();
  private errors: Map<string, string> = new Map();
  private configs: Map<string, MCPServerConfig> = new Map();

  /**
   * Connect to an MCP server
   * 
   * @param config - Server configuration
   * @throws Does not throw - errors are logged and stored in error state
   */
  async connect(config: MCPServerConfig): Promise<void> {
    try {
      console.log(`[MCP] Connecting to ${config.name}...`);

      // Store the config for later reconnection
      this.configs.set(config.name, config);

      // Clear any previous error state
      this.errors.delete(config.name);

      // Create transport
      const transport = new StdioClientTransport({
        command: config.command[0],
        args: config.command.slice(1),
        stderr: 'pipe' // Capture stderr for debugging
      });

      // Create client
      const client = new Client({
        name: 'desktop-agent',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      // Connect to server
      await client.connect(transport);

      // Store client
      this.clients.set(config.name, {
        client,
        transport,
        tools: []
      });

      console.log(`[MCP] Successfully connected to ${config.name}`);

      // Discover tools
      await this.discoverTools(config.name);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[MCP] Failed to connect to ${config.name}:`, errorMessage);
      this.errors.set(config.name, errorMessage);
      
      // Clean up if partially connected
      if (this.clients.has(config.name)) {
        await this.disconnect(config.name);
      }
    }
  }

  /**
   * Disconnect from an MCP server
   * 
   * @param serverName - Name of the server to disconnect from
   */
  async disconnect(serverName: string): Promise<void> {
    try {
      const connection = this.clients.get(serverName);
      if (!connection) {
        console.log(`[MCP] Server ${serverName} is not connected`);
        return;
      }

      console.log(`[MCP] Disconnecting from ${serverName}...`);

      // Close the client connection
      await connection.client.close();

      // Remove from clients map
      this.clients.delete(serverName);
      this.errors.delete(serverName);

      console.log(`[MCP] Disconnected from ${serverName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[MCP] Error disconnecting from ${serverName}:`, errorMessage);
      
      // Force removal from map even if disconnect failed
      this.clients.delete(serverName);
    }
  }

  /**
   * Disconnect from all connected MCP servers
   */
  async disconnectAll(): Promise<void> {
    console.log(`[MCP] Disconnecting from all servers...`);
    
    const serverNames = Array.from(this.clients.keys());
    await Promise.all(serverNames.map(name => this.disconnect(name)));
    
    this.clients.clear();
    this.errors.clear();
    
    console.log(`[MCP] Disconnected from all servers`);
  }

  /**
   * Discover tools provided by an MCP server
   * 
   * @param serverName - Name of the server to discover tools from
   * @returns Array of discovered tools
   */
  async discoverTools(serverName: string): Promise<MCPTool[]> {
    try {
      const connection = this.clients.get(serverName);
      if (!connection) {
        console.error(`[MCP] Server ${serverName} is not connected`);
        return [];
      }

      console.log(`[MCP] Discovering tools from ${serverName}...`);

      // List tools from the MCP server
      const response = await connection.client.listTools();

      // Convert MCP tool format to our format
      const tools: MCPTool[] = response.tools.map(tool => ({
        serverName,
        toolName: tool.name,
        fullName: `${serverName}:${tool.name}`,
        description: tool.description || '',
        inputSchema: tool.inputSchema
      }));

      // Store tools
      connection.tools = tools;

      console.log(`[MCP] Discovered ${tools.length} tools from ${serverName}`);
      
      return tools;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[MCP] Failed to discover tools from ${serverName}:`, errorMessage);
      this.errors.set(serverName, errorMessage);
      return [];
    }
  }

  /**
   * Call a tool on an MCP server
   * 
   * @param serverName - Name of the server hosting the tool
   * @param toolName - Name of the tool to call
   * @param args - Arguments to pass to the tool
   * @returns Tool execution result
   * @throws Error if server not found or tool call fails
   */
  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    try {
      const connection = this.clients.get(serverName);
      if (!connection) {
        throw new Error(`Server ${serverName} is not connected`);
      }

      console.log(`[MCP] Calling tool ${serverName}:${toolName}`);

      // Call the tool on the MCP server
      const response = await connection.client.callTool({
        name: toolName,
        arguments: args
      });

      // Parse and return the result
      return response.content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[MCP] Failed to call tool ${serverName}:${toolName}:`, errorMessage);
      throw error;
    }
  }

  /**
   * Get list of connected server names
   * 
   * @returns Array of server names that are currently connected
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if a specific server is connected
   * 
   * @param serverName - Name of the server to check
   * @returns True if server is connected, false otherwise
   */
  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }

  /**
   * Get status information for all servers
   * 
   * @returns Array of server status objects
   */
  getStatus(): MCPServerStatus[] {
    const statuses: MCPServerStatus[] = [];

    // Add status for all configured servers
    for (const [name, config] of this.configs.entries()) {
      const connection = this.clients.get(name);
      statuses.push({
        name,
        connected: !!connection,
        toolCount: connection ? connection.tools.length : 0,
        error: this.errors.get(name),
        config
      });
    }

    return statuses;
  }

  /**
   * Get tools from connected servers
   * 
   * @param serverName - Optional server name to filter tools. If not provided, returns all tools.
   * @returns Array of available tools
   */
  getTools(serverName?: string): MCPTool[] {
    if (serverName) {
      const connection = this.clients.get(serverName);
      return connection ? [...connection.tools] : [];
    }

    // Return all tools from all servers
    const allTools: MCPTool[] = [];
    for (const connection of this.clients.values()) {
      allTools.push(...connection.tools);
    }
    return allTools;
  }
}

/**
 * Singleton instance of MCPClientManager
 */
export const mcpClientManager = new MCPClientManager();

