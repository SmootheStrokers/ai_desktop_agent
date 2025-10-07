/**
 * Enhanced LLM Providers with Tool Calling Support
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LLMProvider, LLMResponse, Message } from './tool-executor';

interface Config {
  claudeApiKey?: string;
  openaiApiKey?: string;
}

const configPath = join(__dirname, '../../config.json');

function loadConfig(): Config {
  try {
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return {};
}

function saveConfig(config: Config): void {
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

export function saveApiKey(provider: 'claude' | 'openai', key: string): string {
  const config = loadConfig();
  if (provider === 'claude') {
    config.claudeApiKey = key;
  } else {
    config.openaiApiKey = key;
  }
  saveConfig(config);
  return `${provider} API key saved`;
}

/**
 * Claude Provider with Tool Support
 */
export class ClaudeProvider implements LLMProvider {
  name = 'claude';
  supportsTools = true;

  async chat(messages: Message[], tools?: any[]): Promise<LLMResponse> {
    const config = loadConfig();
    if (!config.claudeApiKey) {
      throw new Error('Claude API key not set. Use: setkey claude YOUR_KEY');
    }

    // Convert messages to Claude format
    const claudeMessages = this.convertMessages(messages);
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';

    const requestBody: any = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: claudeMessages
    };

    if (systemMessage) {
      requestBody.system = systemMessage;
    }

    // Add tools if provided
    if (tools && tools.length > 0) {
      requestBody.tools = tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters
      }));
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // Parse response
    return this.parseClaudeResponse(data);
  }

  private convertMessages(messages: Message[]): any[] {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => {
        if (m.role === 'tool') {
          return {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: m.toolCallId,
                content: m.content
              }
            ]
          };
        }

        if (m.toolCalls && m.toolCalls.length > 0) {
          return {
            role: 'assistant',
            content: m.toolCalls.map(tc => ({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.parameters
            }))
          };
        }

        return {
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        };
      });
  }

  private parseClaudeResponse(data: any): LLMResponse {
    const content = data.content;

    // Check for tool use
    const toolUse = content.find((c: any) => c.type === 'tool_use');
    if (toolUse) {
      return {
        type: 'tool_calls',
        toolCalls: content
          .filter((c: any) => c.type === 'tool_use')
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            parameters: c.input
          }))
      };
    }

    // Text response
    const textContent = content.find((c: any) => c.type === 'text');
    return {
      type: 'text',
      content: textContent?.text || ''
    };
  }
}

/**
 * OpenAI Provider with Tool Support
 */
export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  supportsTools = true;

  async chat(messages: Message[], tools?: any[]): Promise<LLMResponse> {
    const config = loadConfig();
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key not set. Use: setkey openai YOUR_KEY');
    }

    const openaiMessages = this.convertMessages(messages);

    const requestBody: any = {
      model: 'gpt-4o',
      messages: openaiMessages
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      requestBody.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }));
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return this.parseOpenAIResponse(data);
  }

  private convertMessages(messages: Message[]): any[] {
    return messages.map(m => {
      if (m.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: m.toolCallId,
          content: m.content
        };
      }

      if (m.toolCalls && m.toolCalls.length > 0) {
        return {
          role: 'assistant',
          content: null,
          tool_calls: m.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.parameters)
            }
          }))
        };
      }

      return {
        role: m.role,
        content: m.content
      };
    });
  }

  private parseOpenAIResponse(data: any): LLMResponse {
    const message = data.choices[0].message;

    // Check for tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      return {
        type: 'tool_calls',
        toolCalls: message.tool_calls.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          parameters: JSON.parse(tc.function.arguments)
        }))
      };
    }

    // Text response
    return {
      type: 'text',
      content: message.content || ''
    };
  }
}

/**
 * Ollama Provider (no tool support yet)
 */
export class OllamaProvider implements LLMProvider {
  name = 'ollama';
  supportsTools = false;

  async chat(messages: Message[]): Promise<LLMResponse> {
    // Combine messages into a single prompt
    const prompt = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1',
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      type: 'text',
      content: data.response
    };
  }
}

// Provider instances
export const claudeProvider = new ClaudeProvider();
export const openaiProvider = new OpenAIProvider();
export const ollamaProvider = new OllamaProvider();

// Get provider by name
export function getProvider(name: string): LLMProvider {
  switch (name.toLowerCase()) {
    case 'claude':
      return claudeProvider;
    case 'openai':
      return openaiProvider;
    case 'ollama':
      return ollamaProvider;
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

// Keep backward compatibility
export async function callClaude(prompt: string): Promise<string> {
  const response = await claudeProvider.chat([
    { role: 'user', content: prompt }
  ]);
  return response.content || '';
}

export async function callOpenAI(prompt: string): Promise<string> {
  const response = await openaiProvider.chat([
    { role: 'user', content: prompt }
  ]);
  return response.content || '';
}

export async function callOllama(prompt: string): Promise<string> {
  const response = await ollamaProvider.chat([
    { role: 'user', content: prompt }
  ]);
  return response.content || '';
}

