/**
 * Tool Execution Loop
 * Handles multi-step tool execution with LLM providers
 */

import { toolRegistry } from './tools/registry';
import { ToolCallResult } from './tools/types';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    parameters: any;
  }>;
  toolCallId?: string;
  toolName?: string;
}

export interface LLMResponse {
  type: 'text' | 'tool_calls';
  content?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    parameters: any;
  }>;
}

export interface LLMProvider {
  name: string;
  supportsTools: boolean;
  chat(messages: Message[], tools?: any[]): Promise<LLMResponse>;
}

export interface ToolExecutionOptions {
  maxIterations?: number;
  onProgress?: (message: string, iteration: number) => void;
  systemPrompt?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  finalResponse: string;
  iterations: number;
  toolCalls: Array<{
    iteration: number;
    toolName: string;
    parameters: any;
    result: ToolCallResult;
  }>;
  error?: string;
}

/**
 * Execute a user message with tool support, allowing multi-step reasoning
 */
export async function executeWithTools(
  provider: LLMProvider,
  userMessage: string,
  options: ToolExecutionOptions = {}
): Promise<ToolExecutionResult> {
  const {
    maxIterations = 10,
    onProgress,
    systemPrompt = 'You are a helpful AI assistant with access to various tools. Use them to help the user accomplish their goals.'
  } = options;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  const toolCallHistory: ToolExecutionResult['toolCalls'] = [];
  let iteration = 0;

  try {
    while (iteration < maxIterations) {
      iteration++;
      
      if (onProgress) {
        onProgress(`Iteration ${iteration}: Processing...`, iteration);
      }

      // Get available tools
      const availableTools = provider.supportsTools 
        ? toolRegistry.getAllDefinitions() 
        : undefined;

      // Call the LLM
      const response = await provider.chat(messages, availableTools);

      // Handle text response (final answer)
      if (response.type === 'text' && response.content) {
        return {
          success: true,
          finalResponse: response.content,
          iterations: iteration,
          toolCalls: toolCallHistory
        };
      }

      // Handle tool calls
      if (response.type === 'tool_calls' && response.toolCalls) {
        // Add assistant's tool call message
        messages.push({
          role: 'assistant',
          content: '',
          toolCalls: response.toolCalls
        });

        // Execute each tool call
        for (const toolCall of response.toolCalls) {
          if (onProgress) {
            onProgress(
              `Executing tool: ${toolCall.name}`,
              iteration
            );
          }

          // Execute the tool
          const result = await toolRegistry.execute(
            toolCall.name,
            toolCall.parameters
          );

          // Store in history
          toolCallHistory.push({
            iteration,
            toolName: toolCall.name,
            parameters: toolCall.parameters,
            result: {
              ...result,
              toolCallId: toolCall.id,
              toolName: toolCall.name
            }
          });

          // Add tool result to messages
          messages.push({
            role: 'tool',
            content: JSON.stringify(result),
            toolCallId: toolCall.id,
            toolName: toolCall.name
          });

          if (onProgress) {
            onProgress(
              `Tool ${toolCall.name} ${result.success ? 'succeeded' : 'failed'}`,
              iteration
            );
          }
        }

        // Continue loop to let LLM process tool results
        continue;
      }

      // If we get here, something unexpected happened
      return {
        success: false,
        finalResponse: 'Unexpected response format from LLM',
        iterations: iteration,
        toolCalls: toolCallHistory,
        error: 'Unexpected response format'
      };
    }

    // Max iterations reached
    return {
      success: false,
      finalResponse: 'Maximum iterations reached without completing the task',
      iterations: iteration,
      toolCalls: toolCallHistory,
      error: 'Maximum iterations reached'
    };

  } catch (error) {
    return {
      success: false,
      finalResponse: error instanceof Error ? error.message : 'Unknown error',
      iterations: iteration,
      toolCalls: toolCallHistory,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Simple wrapper for executing a single tool call
 */
export async function executeSingleTool(
  toolName: string,
  parameters: any
): Promise<ToolCallResult> {
  const result = await toolRegistry.execute(toolName, parameters);
  return {
    ...result,
    toolCallId: `single_${Date.now()}`,
    toolName
  };
}

/**
 * Format tool execution history for display
 */
export function formatToolHistory(
  toolCalls: ToolExecutionResult['toolCalls']
): string {
  if (toolCalls.length === 0) {
    return 'No tools were used.';
  }

  return toolCalls
    .map(
      (call) =>
        `[Iteration ${call.iteration}] ${call.toolName}\n` +
        `  Parameters: ${JSON.stringify(call.parameters, null, 2)}\n` +
        `  Result: ${call.result.success ? '✓' : '✗'} ${
          call.result.message || call.result.error || ''
        }`
    )
    .join('\n\n');
}

