import { toolRegistry } from './registry';
import {
  fileReadTool,
  fileWriteTool,
  fileAppendTool,
  fileListTool
} from './file-tools';
import {
  browserLaunchTool,
  browserNavigateTool,
  browserClickTool,
  browserScreenshotTool,
  browserExtractTextTool,
  browserFillFormTool,
  browserExtractLinksTool,
  browserWaitForElementTool,
  browserExtractFormsTool,
  browserEvaluateTool
} from './browser-tools';
import {
  shellExecuteTool,
  clipboardReadTool,
  clipboardWriteTool
} from './system-tools';
import { mcpClientManager } from '../mcp';

/**
 * Initialize and register all built-in tools
 */
export function initializeTools() {
  // File operations
  toolRegistry.register(fileReadTool);
  toolRegistry.register(fileWriteTool);
  toolRegistry.register(fileAppendTool);
  toolRegistry.register(fileListTool);

  // Browser automation
  toolRegistry.register(browserLaunchTool);
  toolRegistry.register(browserNavigateTool);
  toolRegistry.register(browserClickTool);
  toolRegistry.register(browserScreenshotTool);
  toolRegistry.register(browserExtractTextTool);
  toolRegistry.register(browserFillFormTool);
  toolRegistry.register(browserExtractLinksTool);
  toolRegistry.register(browserWaitForElementTool);
  toolRegistry.register(browserExtractFormsTool);
  toolRegistry.register(browserEvaluateTool);

  // System tools
  toolRegistry.register(shellExecuteTool);
  toolRegistry.register(clipboardReadTool);
  toolRegistry.register(clipboardWriteTool);

  console.log(`✓ Initialized ${toolRegistry.getAll().length} built-in tools`);
}

/**
 * Register MCP tools from connected servers with the tool registry
 * This makes MCP tools available to the AI agent
 */
export async function registerMCPTools(): Promise<void> {
  try {
    const mcpTools = mcpClientManager.getTools();
    
    for (const mcpTool of mcpTools) {
      // Create a wrapper tool that delegates to MCP
      toolRegistry.register({
        name: mcpTool.fullName, // e.g., "localops:read_file"
        description: mcpTool.description,
        parameters: mcpTool.inputSchema,
        handler: async (params: any) => {
          try {
            const result = await mcpClientManager.callTool(
              mcpTool.serverName,
              mcpTool.toolName,
              params
            );
            
            return {
              success: true,
              data: result,
              message: `Successfully executed ${mcpTool.fullName}`
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        }
      });
    }
    
    console.log(`✓ Registered ${mcpTools.length} MCP tools`);
  } catch (error) {
    console.error('[MCP] Error registering MCP tools:', error);
  }
}

/**
 * Refresh MCP tools registration (call after connecting/disconnecting servers)
 */
export async function refreshMCPTools(): Promise<void> {
  // Remove all MCP tools from registry (tools with ':' in name)
  const allTools = toolRegistry.getAll();
  const mcpTools = allTools.filter(tool => tool.name.includes(':'));
  
  // Note: The current ToolRegistry doesn't have an unregister method
  // For now, we'll just re-register which will overwrite existing tools
  // In a future version, we should add an unregister method to ToolRegistry
  
  // Re-register current MCP tools
  await registerMCPTools();
}

export { toolRegistry } from './registry';
export { setCurrentPage, setCurrentBrowser } from './browser-tools';
export * from './types';

