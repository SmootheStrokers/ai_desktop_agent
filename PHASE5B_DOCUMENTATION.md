# Phase 5B: Advanced AI Features - Documentation

## Overview

Phase 5B adds advanced AI capabilities to the application, including:
- Function calling & tool use with multi-step reasoning
- Enhanced browser automation
- Context management (conversation & working memory)
- Enhanced LLM providers with tool support

## Architecture

### 1. Tool System

#### Tool Definition (`apps/main/tools/types.ts`)
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: { /* JSON Schema */ };
  handler: (params: any) => Promise<ToolResult>;
}
```

#### Tool Registry (`apps/main/tools/registry.ts`)
Central registry that manages all available tools. Provides:
- Tool registration
- Tool execution
- Tool discovery

### 2. Tool Execution Loop

#### Multi-Step Reasoning (`apps/main/tool-executor.ts`)
The tool executor enables LLMs to:
1. Receive a user message
2. Decide which tools to call
3. Execute tools and get results
4. Process results and decide next actions
5. Repeat until task is complete (up to max iterations)

**Example Usage:**
```typescript
import { executeWithTools } from './tool-executor';
import { getProvider } from './llm-providers-enhanced';

const provider = getProvider('claude');
const result = await executeWithTools(provider, 'Read test.txt and tell me what it says', {
  maxIterations: 10,
  systemPrompt: 'You are a helpful assistant',
  onProgress: (message, iteration) => {
    console.log(`[${iteration}] ${message}`);
  }
});

console.log(result.finalResponse);
console.log(`Used ${result.toolCalls.length} tool calls in ${result.iterations} iterations`);
```

### 3. Enhanced LLM Providers

#### Supported Providers (`apps/main/llm-providers-enhanced.ts`)

**Claude (Supports Tools)**
```typescript
import { claudeProvider } from './llm-providers-enhanced';

const response = await claudeProvider.chat(messages, tools);
```

**OpenAI (Supports Tools)**
```typescript
import { openaiProvider } from './llm-providers-enhanced';

const response = await openaiProvider.chat(messages, tools);
```

**Ollama (No Tool Support Yet)**
```typescript
import { ollamaProvider } from './llm-providers-enhanced';

const response = await ollamaProvider.chat(messages);
```

### 4. Available Tools

#### File Operations
- `file_read` - Read file contents (max 10KB)
- `file_write` - Write to a file (max 100KB)
- `file_append` - Append to a file
- `file_list` - List directory contents

#### Browser Automation
- `browser_navigate` - Navigate to a URL
- `browser_click` - Click an element
- `browser_screenshot` - Take a screenshot
- `browser_extract_text` - Extract all text from page
- `browser_fill_form` - Fill form fields
- `browser_extract_links` - Extract all links (NEW)
- `browser_wait_for_element` - Wait for element to appear (NEW)
- `browser_extract_forms` - Extract form structures (NEW)
- `browser_evaluate` - Execute JavaScript in browser (NEW)

#### System Tools
- `shell_execute` - Execute shell commands (with safety checks)
- `clipboard_read` - Read clipboard contents
- `clipboard_write` - Write to clipboard

### 5. Memory Management

#### Conversation Store (`apps/main/memory/conversation-store.ts`)

Manages conversation history with automatic pruning:

```typescript
import { getGlobalConversationStore } from './memory';

const store = getGlobalConversationStore();

// Add messages
store.add({ role: 'user', content: 'Hello!' });
store.add({ role: 'assistant', content: 'Hi there!' });

// Get context for LLM
const context = store.getContext('You are a helpful assistant');

// Get statistics
const stats = store.getStats();
console.log(`Total: ${stats.totalMessages}, Tokens: ${stats.estimatedTokens}`);

// Search conversation
const results = store.search('password');

// Export/Import
const exported = store.export();
store.import(exported);
```

**Features:**
- Token-based pruning (max 100K tokens by default)
- Automatic summarization of old messages
- Conversation search
- Export/Import functionality
- Statistics tracking

#### Working Memory (`apps/main/memory/working-memory.ts`)

Manages contextual information during a session:

```typescript
import { getGlobalWorkingMemory } from './memory';

const memory = getGlobalWorkingMemory();

// Remember facts
memory.rememberFact('user_name', 'John');
memory.rememberFact('user_preference', 'dark_mode');

// Remember files being worked on
memory.rememberFile('/path/to/file.txt', 'content...');

// Remember URLs visited
memory.rememberURL('https://example.com', {
  title: 'Example Site',
  extractedText: 'Some text...'
});

// Track tasks
const task = memory.addTask('Complete the report');
memory.updateTask(task.id, { status: 'in_progress' });
memory.updateTask(task.id, { status: 'completed', result: 'Done!' });

// Get context for LLM
const context = memory.getContext(); // Brief summary
const detailedContext = memory.getDetailedContext(); // Full details
```

**Features:**
- Fact storage (key-value pairs)
- File tracking with metadata
- URL history with extracted content
- Task management
- Notes
- Context generation for LLMs
- Export/Import functionality

## IPC Handlers

### Tool Execution

```javascript
// Execute a single tool
const result = await ipcRenderer.invoke('execute-tool', 'file_read', { 
  path: 'test.txt' 
});

// Execute with multi-step reasoning
const result = await ipcRenderer.invoke('execute-with-tools', {
  provider: 'claude',
  message: 'Read test.txt and summarize it',
  maxIterations: 10,
  systemPrompt: 'You are a helpful assistant'
});

// List available tools
const tools = await ipcRenderer.invoke('list-tools');
```

### Conversation Management

```javascript
// Get conversation history
const history = await ipcRenderer.invoke('conversation:get-history');

// Get statistics
const stats = await ipcRenderer.invoke('conversation:get-stats');

// Search conversation
const results = await ipcRenderer.invoke('conversation:search', 'password');

// Clear conversation
await ipcRenderer.invoke('conversation:clear');

// Export conversation
const json = await ipcRenderer.invoke('conversation:export');
```

### Working Memory

```javascript
// Remember facts
await ipcRenderer.invoke('memory:remember-fact', 'user_name', 'John');
const name = await ipcRenderer.invoke('memory:get-fact', 'user_name');
const allFacts = await ipcRenderer.invoke('memory:get-all-facts');

// Remember files
await ipcRenderer.invoke('memory:remember-file', '/path/to/file.txt', 'content');
const files = await ipcRenderer.invoke('memory:get-files');

// Remember URLs
await ipcRenderer.invoke('memory:remember-url', 'https://example.com', {
  title: 'Example'
});
const urls = await ipcRenderer.invoke('memory:get-urls');

// Tasks
const task = await ipcRenderer.invoke('memory:add-task', 'Complete report');
await ipcRenderer.invoke('memory:update-task', task.id, { 
  status: 'completed' 
});
const tasks = await ipcRenderer.invoke('memory:get-tasks');

// Get context
const context = await ipcRenderer.invoke('memory:get-context');

// Get statistics
const stats = await ipcRenderer.invoke('memory:get-stats');

// Clear memory
await ipcRenderer.invoke('memory:clear');
```

## Usage Examples

### Example 1: Multi-Step Web Scraping

```typescript
const result = await executeWithTools(claudeProvider, 
  'Go to news.ycombinator.com and extract the top 5 story titles',
  {
    maxIterations: 10,
    onProgress: (msg, iter) => console.log(`[${iter}] ${msg}`)
  }
);

// The LLM will:
// 1. Call browser_navigate to go to the URL
// 2. Call browser_extract_links or browser_extract_text
// 3. Process the results and format the top 5 titles
// 4. Return the final response
```

### Example 2: File Analysis with Memory

```typescript
const memory = getGlobalWorkingMemory();

// Track the file we're analyzing
await memory.rememberFile('data.csv', undefined, { 
  size: 1024 * 50 
});

const result = await executeWithTools(claudeProvider,
  'Read data.csv and tell me the total number of entries',
  {
    systemPrompt: `You are a data analyst. ${memory.getContext()}`
  }
);

// Remember the result
memory.rememberFact('csv_entry_count', result.finalResponse);
```

### Example 3: Automated Task Workflow

```typescript
const memory = getGlobalWorkingMemory();

// Create tasks
const task1 = memory.addTask('Read configuration file');
const task2 = memory.addTask('Process data');
const task3 = memory.addTask('Generate report');

// Execute first task
memory.updateTask(task1.id, { status: 'in_progress' });
const result1 = await executeWithTools(claudeProvider, 
  'Read config.json and remember the settings'
);
memory.updateTask(task1.id, { 
  status: 'completed', 
  result: result1.finalResponse 
});

// Continue with remaining tasks...
```

## Configuration

### Setting API Keys

```javascript
// Set Claude API key
await ipcRenderer.invoke('chat:send-message', 'setkey claude sk-ant-...');

// Set OpenAI API key
await ipcRenderer.invoke('chat:send-message', 'setkey openai sk-...');
```

API keys are stored in `config.json` in the application directory.

### Memory Limits

**Conversation Store:**
- Default max tokens: 100,000
- Auto-pruning when exceeded
- Keeps recent 70% of messages
- Summarizes older messages

**Working Memory:**
- No size limits (in-memory storage)
- Cleared when application restarts
- Can be manually cleared via IPC

## Security Considerations

1. **File Operations:** Path traversal protection (no `..` in paths)
2. **Shell Commands:** Blocked dangerous commands (rm, del, format, shutdown)
3. **File Size Limits:** Max 10KB read, 100KB write
4. **Command Timeout:** 30 second timeout for shell commands
5. **API Keys:** Stored in config.json (consider encryption for production)

## Testing

### Manual Testing

1. **Test Tool Execution:**
   ```javascript
   const result = await ipcRenderer.invoke('execute-tool', 'file_read', {
     path: './test.txt'
   });
   console.log(result);
   ```

2. **Test Multi-Step Reasoning:**
   ```javascript
   const result = await ipcRenderer.invoke('execute-with-tools', {
     provider: 'claude',
     message: 'Create a file called hello.txt with the text "Hello World"',
     maxIterations: 5
   });
   console.log(result.finalResponse);
   ```

3. **Test Memory:**
   ```javascript
   await ipcRenderer.invoke('memory:remember-fact', 'test', 'value');
   const value = await ipcRenderer.invoke('memory:get-fact', 'test');
   console.log(value); // 'value'
   ```

## Troubleshooting

### Tools Not Working
- Check that `initializeTools()` is called in `app.whenReady()`
- Verify the tool is registered in `apps/main/tools/index.ts`
- Check console for initialization messages

### LLM Not Calling Tools
- Ensure you're using Claude or OpenAI (Ollama doesn't support tools yet)
- Verify API key is set correctly
- Check that tools array is passed to the LLM

### Memory Not Persisting
- Working memory is session-based (clears on restart)
- Use export/import functions for persistence
- Consider adding database storage for production

## Future Enhancements

1. **Tool Support for Ollama** (when available)
2. **Persistent Storage** for working memory
3. **Tool Usage Analytics** 
4. **Custom Tool Creation** via config
5. **Tool Chaining** optimization
6. **Vision Capability** for browser screenshots
7. **Streaming Responses** for better UX
8. **Tool Access Control** and permissions
9. **Multi-Agent Collaboration**
10. **Advanced Context Summarization** with embeddings

## File Structure

```
phase1-minimal/
├── apps/main/
│   ├── index.ts                      # Main process with IPC handlers
│   ├── tool-executor.ts              # NEW: Tool execution loop
│   ├── llm-providers.ts              # Legacy providers
│   ├── llm-providers-enhanced.ts     # NEW: Enhanced providers
│   ├── tools/
│   │   ├── types.ts                  # Tool type definitions
│   │   ├── registry.ts               # Tool registry
│   │   ├── index.ts                  # Tool initialization
│   │   ├── file-tools.ts             # File operation tools
│   │   ├── browser-tools.ts          # ENHANCED: Browser tools
│   │   └── system-tools.ts           # System operation tools
│   └── memory/
│       ├── index.ts                  # NEW: Memory module exports
│       ├── conversation-store.ts     # NEW: Conversation management
│       └── working-memory.ts         # NEW: Working memory
```

## Support

For issues or questions, check the main README.md or create an issue in the repository.

