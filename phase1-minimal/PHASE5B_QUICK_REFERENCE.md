# Phase 5B: Quick Reference Card

## 🚀 Getting Started (3 steps)

```bash
# 1. Build
npm run build

# 2. Start
npm start

# 3. Set API key (in UI)
setkey claude sk-ant-api-key-here
```

## 📦 Core Imports

```typescript
// Tool execution
import { executeWithTools, formatToolHistory } from './tool-executor';

// Providers
import { getProvider, claudeProvider, openaiProvider } from './llm-providers-enhanced';

// Memory
import { getGlobalConversationStore, getGlobalWorkingMemory } from './memory';

// Tools
import { toolRegistry } from './tools';
```

## 🔧 Common Patterns

### Execute Single Tool
```typescript
const result = await toolRegistry.execute('file_read', { 
  path: './test.txt' 
});
```

### Execute with AI (Multi-Step)
```typescript
const result = await executeWithTools(
  getProvider('claude'),
  'Read test.txt and summarize it',
  { maxIterations: 10 }
);
```

### Remember Facts
```typescript
const memory = getGlobalWorkingMemory();
memory.rememberFact('user_name', 'John');
const name = memory.getFact('user_name');
```

### Track Conversation
```typescript
const store = getGlobalConversationStore();
store.add({ role: 'user', content: 'Hello' });
const history = store.getAllMessages();
```

## 🛠️ Available Tools (12 Total)

### File Operations (4)
- `file_read` - Read file (max 10KB)
- `file_write` - Write file (max 100KB)
- `file_append` - Append to file
- `file_list` - List directory

### Browser (9)
- `browser_navigate` - Go to URL
- `browser_click` - Click element
- `browser_screenshot` - Take screenshot
- `browser_extract_text` - Get page text
- `browser_fill_form` - Fill form field
- `browser_extract_links` - Get all links
- `browser_wait_for_element` - Wait for element
- `browser_extract_forms` - Get form structures
- `browser_evaluate` - Run JavaScript

### System (3)
- `shell_execute` - Run shell command
- `clipboard_read` - Read clipboard
- `clipboard_write` - Write clipboard

## 📡 IPC Handlers

### From Renderer Process

```javascript
// Execute with AI
await window.electron.invoke('execute-with-tools', {
  provider: 'claude',
  message: 'Your task',
  maxIterations: 10
});

// Execute single tool
await window.electron.invoke('execute-tool', 'file_read', {
  path: './test.txt'
});

// List tools
await window.electron.invoke('list-tools');

// Memory
await window.electron.invoke('memory:remember-fact', 'key', 'value');
await window.electron.invoke('memory:get-all-facts');
await window.electron.invoke('memory:get-context');

// Conversation
await window.electron.invoke('conversation:get-history');
await window.electron.invoke('conversation:get-stats');
await window.electron.invoke('conversation:clear');
```

## 🎯 Example Workflows

### Workflow 1: File Analysis
```typescript
const result = await executeWithTools(
  claudeProvider,
  'Read package.json and tell me the dependencies'
);
```

### Workflow 2: Web Scraping
```typescript
const result = await executeWithTools(
  claudeProvider,
  'Go to example.com and extract all links'
);
```

### Workflow 3: Data Processing
```typescript
const result = await executeWithTools(
  claudeProvider,
  'Read data.csv, count entries, save count to result.txt'
);
```

### Workflow 4: Task Management
```typescript
const memory = getGlobalWorkingMemory();
const task = memory.addTask('Process data');
memory.updateTask(task.id, { status: 'completed' });
```

## ⚙️ Configuration Options

### Tool Executor Options
```typescript
{
  maxIterations: 10,           // Max AI reasoning steps
  systemPrompt: 'You are...',  // Custom system prompt
  onProgress: (msg, iter) => { // Progress callback
    console.log(`[${iter}] ${msg}`);
  }
}
```

### Memory Options
```typescript
// Conversation store
new ConversationStore('id', {
  maxTokens: 100000  // Auto-prune threshold
});

// Working memory (no config needed)
const memory = new WorkingMemory();
```

## 🔒 Security Limits

| Feature | Limit |
|---------|-------|
| File read | 10KB max |
| File write | 100KB max |
| Shell timeout | 30 seconds |
| Shell buffer | 1MB |
| Conversation | 100K tokens |
| Path traversal | Blocked |
| Dangerous commands | Blocked |

## 📊 Memory API

### Working Memory
```typescript
const m = getGlobalWorkingMemory();

// Facts
m.rememberFact(key, value);
m.getFact(key);
m.getAllFacts();
m.forgetFact(key);

// Files
m.rememberFile(path, content);
m.getFile(path);
m.getAllFiles();

// URLs
m.rememberURL(url, metadata);
m.getURL(url);
m.getAllURLs();

// Tasks
m.addTask(description);
m.updateTask(id, { status: 'completed' });
m.getAllTasks();
m.getTasksByStatus('pending');

// Context
m.getContext();         // Brief
m.getDetailedContext(); // Full

// Management
m.getStats();
m.clear();
m.export();
m.import(json);
```

### Conversation Store
```typescript
const s = getGlobalConversationStore();

// Messages
s.add(message);
s.addBatch(messages);
s.getAllMessages();
s.getRecentMessages(5);

// Context
s.getContext('System prompt');

// Search
s.search('query');

// Stats
s.getStats();
s.getTotalTokens();
s.getMetadata();

// Management
s.clear();
s.export();
s.import(json);
```

## 🎨 Provider Selection

```typescript
// Claude (Best for tool use)
const provider = getProvider('claude');

// OpenAI (Good for tool use)
const provider = getProvider('openai');

// Ollama (No tool support yet)
const provider = getProvider('ollama');
```

## 🐛 Error Handling

```typescript
const result = await executeWithTools(...);

if (result.success) {
  console.log('✓', result.finalResponse);
} else {
  console.error('✗', result.error);
  console.log('Iterations:', result.iterations);
  console.log('Tools called:', result.toolCalls);
}
```

## 📈 Monitoring

### Track Progress
```typescript
await executeWithTools(provider, message, {
  onProgress: (msg, iter) => {
    console.log(`Step ${iter}: ${msg}`);
  }
});
```

### Get Statistics
```typescript
// Memory stats
const memStats = await window.electron.invoke('memory:get-stats');
// { facts: 5, files: 2, urls: 3, tasks: 1, notes: 0 }

// Conversation stats
const convStats = await window.electron.invoke('conversation:get-stats');
// { totalMessages: 10, userMessages: 5, assistantMessages: 5, ... }
```

## 🎯 Best Practices

1. **Be Specific** - Clear instructions = better results
2. **Set Limits** - Use appropriate `maxIterations`
3. **Use Context** - Leverage memory for continuity
4. **Handle Errors** - Always check `result.success`
5. **Monitor Progress** - Use `onProgress` for long tasks
6. **Clean Up** - Clear memory when starting new sessions

## 📝 Common Tasks

| Task | Command |
|------|---------|
| Read file | `executeWithTools(p, 'Read file.txt')` |
| Write file | `executeWithTools(p, 'Write "hello" to file.txt')` |
| Web scrape | `executeWithTools(p, 'Go to URL and extract links')` |
| Run command | `executeWithTools(p, 'Run "npm --version"')` |
| Remember fact | `memory.rememberFact('key', 'value')` |
| Track task | `memory.addTask('Complete report')` |
| Get history | `store.getAllMessages()` |
| Search conv | `store.search('password')` |

## 🔗 File Locations

```
phase1-minimal/
├── apps/main/
│   ├── tool-executor.ts          # Multi-step execution
│   ├── llm-providers-enhanced.ts # Enhanced providers
│   ├── tools/
│   │   ├── types.ts              # Tool definitions
│   │   ├── registry.ts           # Tool registry
│   │   ├── file-tools.ts         # File ops
│   │   ├── browser-tools.ts      # Browser ops
│   │   └── system-tools.ts       # System ops
│   └── memory/
│       ├── conversation-store.ts # Conversation
│       └── working-memory.ts     # Working memory
│
├── PHASE5B_DOCUMENTATION.md      # Full docs
├── PHASE5B_EXAMPLES.md           # Code examples
├── PHASE5B_SUMMARY.md            # Overview
└── PHASE5B_QUICK_REFERENCE.md    # This file
```

## 💡 Tips

- Start simple, then combine tools
- Use Claude or OpenAI for tool support
- Monitor tool calls for debugging
- Clear memory between sessions
- Export conversations for later
- Test incrementally

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Tools not working | Check `initializeTools()` called |
| LLM not using tools | Use Claude/OpenAI, verify API key |
| Memory not persisting | It's session-based, use export/import |
| Browser not opening | Check Playwright installation |
| File too large | Split into chunks, increase limits |
| Command blocked | Review security checks |

---

**Quick Links:**
- Full docs: `PHASE5B_DOCUMENTATION.md`
- Examples: `PHASE5B_EXAMPLES.md`
- Overview: `PHASE5B_SUMMARY.md`

