import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool, ToolResult } from './types';

/**
 * Central registry for all available tools
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getAllDefinitions() {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  async execute(name: string, parameters: any): Promise<ToolResult> {
    const tool = this.get(name);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' not found`
      };
    }

    try {
      const result = await tool.handler(parameters);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Global instance
export const toolRegistry = new ToolRegistry();

