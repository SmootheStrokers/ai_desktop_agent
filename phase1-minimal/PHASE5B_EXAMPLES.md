# Phase 5B: Usage Examples

## Quick Start Examples

### Example 1: Simple Tool Execution

```typescript
// In main process or via IPC
import { toolRegistry } from './tools';

// Execute a file read
const result = await toolRegistry.execute('file_read', {
  path: './test.txt'
});

console.log(result);
// {
//   success: true,
//   data: { content: "...", size: 123 },
//   message: "Successfully read 123 bytes from ./test.txt"
// }
```

### Example 2: Multi-Step AI Task

```typescript
import { executeWithTools } from './tool-executor';
import { getProvider } from './llm-providers-enhanced';

// Get Claude provider (supports tools)
const provider = getProvider('claude');

// Execute a complex task that requires multiple steps
const result = await executeWithTools(
  provider,
  'Read the file package.json, find the version number, and create a new file called VERSION.txt with that version number',
  {
    maxIterations: 10,
    onProgress: (message, iteration) => {
      console.log(`Step ${iteration}: ${message}`);
    }
  }
);

console.log('Final Response:', result.finalResponse);
console.log('Tool Calls Made:', result.toolCalls.length);
console.log('Iterations:', result.iterations);
```

Expected output:
```
Step 1: Processing...
Step 2: Executing tool: file_read
Step 2: Tool file_read succeeded
Step 3: Processing...
Step 3: Executing tool: file_write
Step 3: Tool file_write succeeded
Step 4: Processing...
Final Response: I've successfully read the package.json file, found version "1.0.0", and created VERSION.txt with that version number.
Tool Calls Made: 2
Iterations: 4
```

### Example 3: Web Scraping with Browser Tools

```typescript
import { executeWithTools } from './tool-executor';
import { claudeProvider } from './llm-providers-enhanced';

const result = await executeWithTools(
  claudeProvider,
  'Go to example.com, extract all the links, and save them to a file called links.txt',
  {
    maxIterations: 15,
    systemPrompt: 'You are a web scraping assistant. Extract information accurately.'
  }
);

console.log(result.finalResponse);
```

The AI will:
1. Use `browser_navigate` to go to example.com
2. Use `browser_extract_links` to get all links
3. Use `file_write` to save links to links.txt
4. Return a summary

### Example 4: Using Working Memory

```typescript
import { getGlobalWorkingMemory } from './memory';
import { executeWithTools } from './tool-executor';
import { claudeProvider } from './llm-providers-enhanced';

const memory = getGlobalWorkingMemory();

// Remember user preferences
memory.rememberFact('output_format', 'markdown');
memory.rememberFact('max_results', 10);

// Execute task with context
const result = await executeWithTools(
  claudeProvider,
  'Search the current directory for .ts files',
  {
    systemPrompt: `You are a helpful assistant. ${memory.getContext()}`
  }
);

// The AI will know about the user's preferences from context
```

### Example 5: Conversation History

```typescript
import { getGlobalConversationStore } from './memory';
import { executeWithTools } from './tool-executor';
import { claudeProvider } from './llm-providers-enhanced';

const conversationStore = getGlobalConversationStore();

// First interaction
let result = await executeWithTools(
  claudeProvider,
  'What files are in the current directory?'
);

conversationStore.add({ role: 'user', content: 'What files are in the current directory?' });
conversationStore.add({ role: 'assistant', content: result.finalResponse });

// Follow-up interaction (with context)
const context = conversationStore.getContext('You are a helpful file management assistant');

// Now the AI has context from previous conversation
result = await executeWithTools(
  claudeProvider,
  'Read the first one you mentioned'
);

// Get stats
const stats = conversationStore.getStats();
console.log(`Messages: ${stats.totalMessages}, Tokens: ${stats.estimatedTokens}`);
```

### Example 6: Task Management

```typescript
import { getGlobalWorkingMemory } from './memory';

const memory = getGlobalWorkingMemory();

// Create a task list
const task1 = memory.addTask('Read configuration file');
const task2 = memory.addTask('Process data files');
const task3 = memory.addTask('Generate report');

console.log('Tasks created:', memory.getAllTasks());

// Execute and update tasks
memory.updateTask(task1.id, { status: 'in_progress' });

// ... execute the task ...

memory.updateTask(task1.id, { 
  status: 'completed',
  result: 'Configuration loaded successfully'
});

// Get pending tasks
const pendingTasks = memory.getTasksByStatus('pending');
console.log('Remaining tasks:', pendingTasks.length);
```

### Example 7: Advanced Browser Automation

```typescript
import { executeWithTools } from './tool-executor';
import { claudeProvider } from './llm-providers-enhanced';

const result = await executeWithTools(
  claudeProvider,
  `
  Go to github.com,
  wait for the search box to appear,
  fill it with "electron",
  click the search button,
  wait for results,
  extract the first 5 repository names,
  and save them to github-results.txt
  `,
  {
    maxIterations: 20,
    onProgress: (msg, iter) => console.log(`[${iter}] ${msg}`)
  }
);
```

The AI will orchestrate multiple browser tools:
- `browser_navigate`
- `browser_wait_for_element`
- `browser_fill_form`
- `browser_click`
- `browser_extract_text` or `browser_extract_links`
- `file_write`

### Example 8: IPC from Renderer Process

```typescript
// In your renderer process (React/Vue component)

async function executeAITask() {
  const result = await window.electron.invoke('execute-with-tools', {
    provider: 'claude',
    message: 'Create a new file called todo.txt with 3 sample todo items',
    maxIterations: 10
  });

  if (result.success) {
    console.log('Task completed:', result.finalResponse);
    console.log('Tools used:', result.toolCalls.length);
  } else {
    console.error('Task failed:', result.error);
  }
}

async function checkMemory() {
  const stats = await window.electron.invoke('memory:get-stats');
  console.log('Memory stats:', stats);
  
  const context = await window.electron.invoke('memory:get-context');
  console.log('Current context:', context);
}

async function getConversationHistory() {
  const history = await window.electron.invoke('conversation:get-history');
  console.log('Conversation history:', history);
  
  const stats = await window.electron.invoke('conversation:get-stats');
  console.log('Conversation stats:', stats);
}
```

### Example 9: Error Handling

```typescript
import { executeWithTools } from './tool-executor';
import { claudeProvider } from './llm-providers-enhanced';

try {
  const result = await executeWithTools(
    claudeProvider,
    'Delete all my important files',  // This will fail due to safety checks
    {
      maxIterations: 5
    }
  );

  if (!result.success) {
    console.error('Task failed:', result.error);
    console.log('Failed after', result.iterations, 'iterations');
    console.log('Tool calls attempted:', result.toolCalls);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Example 10: Custom Progress Tracking

```typescript
import { executeWithTools } from './tool-executor';
import { claudeProvider } from './llm-providers-enhanced';

// Track progress in UI
const progressLog: string[] = [];

const result = await executeWithTools(
  claudeProvider,
  'Read all .txt files in the current directory and create a summary',
  {
    maxIterations: 20,
    onProgress: (message, iteration) => {
      const logEntry = `[${new Date().toISOString()}] Iteration ${iteration}: ${message}`;
      progressLog.push(logEntry);
      
      // Send to renderer for UI update
      if (panelWindow) {
        panelWindow.webContents.send('task-progress', {
          iteration,
          message,
          totalIterations: 20
        });
      }
    }
  }
);

console.log('Progress log:', progressLog);
```

## Advanced Patterns

### Pattern 1: Stateful Conversation

```typescript
import { getGlobalConversationStore, getGlobalWorkingMemory } from './memory';
import { executeWithTools } from './tool-executor';
import { claudeProvider } from './llm-providers-enhanced';

class AIAssistant {
  private conversationStore = getGlobalConversationStore();
  private workingMemory = getGlobalWorkingMemory();

  async chat(message: string) {
    // Build context from both stores
    const memoryContext = this.workingMemory.getContext();
    const conversationContext = this.conversationStore.getContext(
      `You are a helpful assistant. ${memoryContext}`
    );

    // Execute with full context
    const result = await executeWithTools(
      claudeProvider,
      message,
      {
        systemPrompt: conversationContext[0].content
      }
    );

    // Update stores
    this.conversationStore.add({ role: 'user', content: message });
    this.conversationStore.add({ role: 'assistant', content: result.finalResponse });

    return result;
  }

  async remember(key: string, value: any) {
    this.workingMemory.rememberFact(key, value);
  }

  async forget(key: string) {
    this.workingMemory.forgetFact(key);
  }

  getStats() {
    return {
      conversation: this.conversationStore.getStats(),
      memory: this.workingMemory.getStats()
    };
  }

  reset() {
    this.conversationStore.clear();
    this.workingMemory.clear();
  }
}

// Usage
const assistant = new AIAssistant();

await assistant.remember('project_name', 'MyApp');
await assistant.chat('Create a README for my project');
await assistant.chat('Now add installation instructions');  // Has context!

console.log(assistant.getStats());
```

### Pattern 2: Multi-Agent Workflow

```typescript
import { executeWithTools } from './tool-executor';
import { claudeProvider, openaiProvider } from './llm-providers-enhanced';

async function multiAgentTask(task: string) {
  // Agent 1: Planner (uses Claude)
  const plan = await executeWithTools(
    claudeProvider,
    `Create a step-by-step plan for: ${task}`,
    { maxIterations: 3 }
  );

  // Agent 2: Executor (uses GPT-4)
  const execution = await executeWithTools(
    openaiProvider,
    `Execute this plan: ${plan.finalResponse}`,
    { maxIterations: 20 }
  );

  // Agent 3: Reviewer (uses Claude)
  const review = await executeWithTools(
    claudeProvider,
    `Review this execution and provide feedback: ${execution.finalResponse}`,
    { maxIterations: 3 }
  );

  return {
    plan: plan.finalResponse,
    execution: execution.finalResponse,
    review: review.finalResponse
  };
}

// Usage
const result = await multiAgentTask('Build a simple TODO app');
console.log('Plan:', result.plan);
console.log('Execution:', result.execution);
console.log('Review:', result.review);
```

## Testing the Implementation

```bash
# In phase1-minimal directory

# Install dependencies (if not already done)
npm install

# Build the application
npm run build

# Run the application
npm start

# In the UI, try these commands:
# 1. Set API key: setkey claude sk-ant-...
# 2. Simple tool: echo Hello World
# 3. File operation: write test.txt Hello from Phase 5B
# 4. AI with tools: /claude Read test.txt and tell me what it says
```

## Tips for Best Results

1. **Be Specific**: Clear instructions lead to better tool selection
2. **Set Limits**: Use appropriate `maxIterations` based on task complexity
3. **Monitor Progress**: Use `onProgress` callback for long-running tasks
4. **Use Context**: Leverage working memory for better continuity
5. **Handle Errors**: Always check `result.success` and handle failures
6. **Test Incrementally**: Start with simple tasks, then combine them
7. **Review Tool Calls**: Check `result.toolCalls` to understand AI decisions

## Next Steps

- Explore creating custom tools
- Implement persistent storage for memory
- Add vision capabilities for screenshot analysis
- Build a UI for managing conversation history
- Create preset workflows for common tasks

