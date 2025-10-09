/**
 * Tool Definition System
 * Provides a unified interface for defining tools that can be used by any LLM provider
 */

export type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface ParameterSchema {
  type: ParameterType;
  description: string;
  enum?: string[];
  items?: ParameterSchema;
  properties?: Record<string, ParameterSchema>;
  required?: string[];
  default?: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required: string[];
  };
}

export interface Tool extends ToolDefinition {
  handler: (params: any) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface ToolCall {
  id: string;
  tool: string;
  parameters: any;
}

export interface ToolCallResult extends ToolResult {
  toolCallId: string;
  toolName: string;
}

