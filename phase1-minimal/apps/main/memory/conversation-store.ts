/**
 * Conversation Memory Management
 * Handles conversation history with token-based pruning
 */

import { Message } from '../tool-executor';

export interface ConversationMetadata {
  id: string;
  startTime: number;
  lastActivity: number;
  messageCount: number;
  provider?: string;
}

/**
 * Estimates token count for a message (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Manages conversation history with intelligent pruning
 */
export class ConversationStore {
  private messages: Message[] = [];
  private metadata: ConversationMetadata;
  private maxTokens: number;
  private summaryCache: Map<string, string> = new Map();

  constructor(
    conversationId: string,
    options: {
      maxTokens?: number;
    } = {}
  ) {
    this.maxTokens = options.maxTokens || 100000;
    this.metadata = {
      id: conversationId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0
    };
  }

  /**
   * Add a message to the conversation
   */
  add(message: Message): void {
    this.messages.push(message);
    this.metadata.messageCount++;
    this.metadata.lastActivity = Date.now();
    
    // Prune if needed
    this.pruneIfNeeded();
  }

  /**
   * Add multiple messages at once
   */
  addBatch(messages: Message[]): void {
    this.messages.push(...messages);
    this.metadata.messageCount += messages.length;
    this.metadata.lastActivity = Date.now();
    
    this.pruneIfNeeded();
  }

  /**
   * Get conversation context including system prompt
   */
  getContext(systemPrompt?: string): Message[] {
    const context: Message[] = [];
    
    if (systemPrompt) {
      context.push({ role: 'system', content: systemPrompt });
    }
    
    context.push(...this.messages);
    
    return context;
  }

  /**
   * Get recent messages without system prompt
   */
  getRecentMessages(count: number): Message[] {
    return this.messages.slice(-count);
  }

  /**
   * Get all messages
   */
  getAllMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = [];
    this.summaryCache.clear();
    this.metadata.messageCount = 0;
  }

  /**
   * Get conversation metadata
   */
  getMetadata(): ConversationMetadata {
    return { ...this.metadata };
  }

  /**
   * Calculate total token count
   */
  getTotalTokens(): number {
    return this.messages.reduce((total, msg) => {
      return total + estimateTokens(msg.content);
    }, 0);
  }

  /**
   * Prune old messages if token count exceeds limit
   */
  private pruneIfNeeded(): void {
    const currentTokens = this.getTotalTokens();
    
    if (currentTokens <= this.maxTokens) {
      return;
    }

    // Keep system messages and recent messages
    const systemMessages = this.messages.filter(m => m.role === 'system');
    const otherMessages = this.messages.filter(m => m.role !== 'system');
    
    // Keep the most recent 70% of messages
    const keepCount = Math.floor(otherMessages.length * 0.7);
    const toKeep = otherMessages.slice(-keepCount);
    const toSummarize = otherMessages.slice(0, -keepCount);
    
    // Create summary of older messages
    if (toSummarize.length > 0) {
      const summary = this.createSummary(toSummarize);
      this.messages = [
        ...systemMessages,
        { role: 'system', content: `[Previous conversation summary: ${summary}]` },
        ...toKeep
      ];
    } else {
      this.messages = [...systemMessages, ...toKeep];
    }
  }

  /**
   * Create a summary of messages (simplified version)
   */
  private createSummary(messages: Message[]): string {
    // Group by conversation turns
    const turns: string[] = [];
    let currentTurn = '';
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        if (currentTurn) {
          turns.push(currentTurn);
        }
        currentTurn = `User: ${msg.content.substring(0, 100)}`;
      } else if (msg.role === 'assistant') {
        currentTurn += ` -> Assistant: ${msg.content.substring(0, 100)}`;
      }
    });
    
    if (currentTurn) {
      turns.push(currentTurn);
    }
    
    return turns.slice(0, 5).join('; ');
  }

  /**
   * Export conversation to JSON
   */
  export(): string {
    return JSON.stringify({
      metadata: this.metadata,
      messages: this.messages
    }, null, 2);
  }

  /**
   * Import conversation from JSON
   */
  import(data: string): void {
    const parsed = JSON.parse(data);
    this.metadata = parsed.metadata;
    this.messages = parsed.messages;
  }

  /**
   * Search messages by content
   */
  search(query: string): Message[] {
    const lowerQuery = query.toLowerCase();
    return this.messages.filter(msg => 
      msg.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get statistics about the conversation
   */
  getStats(): {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    toolMessages: number;
    estimatedTokens: number;
    duration: number;
  } {
    const userMessages = this.messages.filter(m => m.role === 'user').length;
    const assistantMessages = this.messages.filter(m => m.role === 'assistant').length;
    const toolMessages = this.messages.filter(m => m.role === 'tool').length;
    
    return {
      totalMessages: this.messages.length,
      userMessages,
      assistantMessages,
      toolMessages,
      estimatedTokens: this.getTotalTokens(),
      duration: Date.now() - this.metadata.startTime
    };
  }
}

/**
 * Global conversation store instance
 */
let globalStore: ConversationStore | null = null;

export function getGlobalConversationStore(): ConversationStore {
  if (!globalStore) {
    globalStore = new ConversationStore('global', {
      maxTokens: 100000
    });
  }
  return globalStore;
}

export function resetGlobalConversationStore(): void {
  globalStore = new ConversationStore('global', {
    maxTokens: 100000
  });
}

