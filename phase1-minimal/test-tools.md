# Tool System Testing Plan

## Manual Tests

### 1. File Operations

#### Test file_write
**Tool:** `file_write`  
**Parameters:** `{ path: "test.txt", content: "Hello, World!" }`  
**Expected:** File created with content  

#### Test file_read
**Tool:** `file_read`  
**Parameters:** `{ path: "test.txt" }`  
**Expected:** Returns "Hello, World!"  

#### Test file_append
**Tool:** `file_append`  
**Parameters:** `{ path: "test.txt", content: "\nNew line" }`  
**Expected:** Content appended  

#### Test file_list
**Tool:** `file_list`  
**Parameters:** `{ path: "." }`  
**Expected:** Lists current directory files  

---

### 2. Browser Operations

#### Test browser_navigate
**Tool:** `browser_navigate`  
**Parameters:** `{ url: "https://example.com" }`  
**Expected:** Browser opens and loads page  

#### Test browser_extract_text
**Tool:** `browser_extract_text`  
**Parameters:** `{}`  
**Expected:** Returns page text content  

#### Test browser_screenshot
**Tool:** `browser_screenshot`  
**Parameters:** `{ path: "page.png" }`  
**Expected:** Screenshot saved  

#### Test browser_click
**Tool:** `browser_click`  
**Parameters:** `{ selector: "More information..." }`  
**Expected:** Clicks the link  

#### Test browser_fill_form
**Tool:** `browser_fill_form`  
**Parameters:** `{ selector: "input[name='email']", value: "test@example.com" }`  
**Expected:** Form field filled  

---

### 3. System Operations

#### Test clipboard_write
**Tool:** `clipboard_write`  
**Parameters:** `{ text: "Test clipboard" }`  
**Expected:** Text copied to clipboard  

#### Test clipboard_read
**Tool:** `clipboard_read`  
**Parameters:** `{}`  
**Expected:** Returns "Test clipboard"  

#### Test shell_execute
**Tool:** `shell_execute`  
**Parameters:** `{ command: "echo Hello" }`  
**Expected:** Returns stdout: "Hello"  

---

## Integration Tests

### 1. Tool Chaining
Execute multiple tools in sequence to verify they work together:
1. `file_write` → Create a file
2. `file_read` → Read it back
3. `file_append` → Add content
4. `file_read` → Verify append worked

### 2. Error Handling
Test invalid inputs to ensure proper error messages:
- **Invalid path:** `file_read` with non-existent file
- **Path traversal:** `file_read` with `"../../../etc/passwd"`
- **Oversized content:** `file_write` with content > 100KB
- **Blocked command:** `shell_execute` with `"rm -rf /"`

### 3. Security Tests
Verify that dangerous operations are blocked:
- Path traversal attempts in file operations
- Dangerous shell commands (rm -rf, format, shutdown)
- File size limits enforced

### 4. Performance Tests
Measure tool execution times:
- File operations should complete in < 100ms
- Browser operations should complete in < 3s
- Shell commands should respect 30s timeout

---

## Testing from Renderer

### Using IPC from Renderer Process

```typescript
// List all available tools
const tools = await window.electron.invoke('list-tools');
console.log('Available tools:', tools);

// Execute a tool
const result = await window.electron.invoke('execute-tool', 'file_write', {
  path: 'test.txt',
  content: 'Hello from tool system!'
});
console.log('Result:', result);
```

### Example Test Sequence

```typescript
// 1. Write a file
const writeResult = await window.electron.invoke('execute-tool', 'file_write', {
  path: 'test-tool.txt',
  content: 'Testing the new tool system!'
});
console.log('Write:', writeResult);

// 2. Read it back
const readResult = await window.electron.invoke('execute-tool', 'file_read', {
  path: 'test-tool.txt'
});
console.log('Read:', readResult);

// 3. Test clipboard
const clipWriteResult = await window.electron.invoke('execute-tool', 'clipboard_write', {
  text: 'Copied via tool system'
});
console.log('Clipboard write:', clipWriteResult);

const clipReadResult = await window.electron.invoke('execute-tool', 'clipboard_read', {});
console.log('Clipboard read:', clipReadResult);
```

---

## Quick Test Commands

Run these from the app's developer console to test the tool system:

```javascript
// Quick file test
(async () => {
  const write = await window.electron.invoke('execute-tool', 'file_write', {
    path: 'test.txt',
    content: 'Hello, World!'
  });
  console.log('Write:', write);
  
  const read = await window.electron.invoke('execute-tool', 'file_read', {
    path: 'test.txt'
  });
  console.log('Read:', read);
})();

// List all tools
(async () => {
  const tools = await window.electron.invoke('list-tools');
  console.table(tools.map(t => ({ name: t.name, description: t.description })));
})();

// Test shell command
(async () => {
  const result = await window.electron.invoke('execute-tool', 'shell_execute', {
    command: 'echo Hello from shell!'
  });
  console.log('Shell:', result);
})();
```

---

## Expected Tool Registry Output

When the app starts, you should see in the console:

```
✓ Initialized 12 tools
```

The 12 tools are:
1. file_read
2. file_write
3. file_append
4. file_list
5. browser_navigate
6. browser_click
7. browser_screenshot
8. browser_extract_text
9. browser_fill_form
10. shell_execute
11. clipboard_read
12. clipboard_write

---

## Next Steps

1. ✅ Create all tool files in `apps/main/tools/`
2. ✅ Update main process to initialize tools
3. ⏳ Test each tool individually using the test commands above
4. ⏳ Integrate with LLM providers (Phase 5B part 2)
5. ⏳ Add tool calling UI to show which tools are being used
6. ⏳ Update preload script to expose new IPC channels (if needed)

---

## Troubleshooting

### Tools not initializing
- Check console for "✓ Initialized 12 tools" message
- Verify all tool files are in `apps/main/tools/` directory
- Check for TypeScript compilation errors

### Tool execution fails
- Verify parameters match the tool's parameter schema
- Check that required parameters are provided
- Look for error messages in the returned result

### Browser tools not working
- Ensure a browser is launched first (use existing `browse` command)
- Check that `setCurrentPage()` is called after browser launch
- Verify Playwright is installed: `npm list playwright`

