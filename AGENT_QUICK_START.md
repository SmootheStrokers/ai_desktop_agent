# Conversational AI Agent - Quick Start Guide

## 🚀 Start the App

```bash
npm run dev
```

## 💬 Try These Conversations

### 1. Simple Conversations
Just chat naturally:
```
"Hi there!"
"How are you doing?"
"What's up?"
"Thanks for your help!"
```

### 2. Simple Tasks (Single Tool)
```
"What files are in my Downloads folder?"
"Read the file test-file.txt"
"What time is it?"
"Create a file called notes.txt"
```

### 3. Multi-Step Tasks
```
"Find all .txt files in my documents and create a summary"
"Read all markdown files and make a table of contents"
"List all JavaScript files in this project"
```

### 4. Code Generation
```
"Write a Python script that lists all files in a directory"
"Create a JavaScript function that reverses a string"
"Make a script that backs up my important files"
```

### 5. Complex Projects
```
"Build me a simple calculator"
"Create a todo list app"
"Make a weather dashboard"
```

### 6. Research Tasks
```
"Research the best JavaScript frameworks"
"Find information about Claude AI"
"Compare Python vs JavaScript for beginners"
```

### 7. File Operations
```
"Organize my downloads by file type"
"Find all PDF files"
"Create a backup of my documents"
```

## 🎯 What to Watch For

### Real-Time Feedback
When you send a message, watch for:

1. **Status Updates** (top of message bubble)
   - "Analyzing your request..."
   - "Detected: Create calculator app"
   - "Plan created with 5 steps"
   - "Executing plan..."

2. **Progress Bar**
   - Shows percentage completion (0-100%)
   - "Step 2 of 5" indicator

3. **Plan Preview**
   - Shows first 3 steps of execution plan
   - "...and 2 more steps" if more exist

4. **Step Descriptions**
   - "Step 1/5: Create project directory"
   - "Step 2/5: Generate HTML file"
   - etc.

## 🎨 UI Elements

### While Processing
```
┌─────────────────────────────┐
│  🔄 Step 2/5: Writing files │
│  ▓▓▓▓▓░░░░░ 40%            │
│                             │
│  Execution Plan:            │
│  • Create directory         │
│  • Write HTML file          │
│  • Write CSS file           │
│  ...and 2 more steps        │
└─────────────────────────────┘
```

### After Completion
```
┌─────────────────────────────┐
│  Done! I've created your    │
│  calculator app. It's ready │
│  in the calculator/ folder. │
└─────────────────────────────┘
```

## 🧪 Test Scenarios

### Scenario 1: Simple File Read
```
You: "Read test-file.txt"
Agent: [Shows file contents]
```

### Scenario 2: Multi-Step
```
You: "Find all .md files and count them"
Agent: 
  - Status: "Analyzing your request..."
  - Status: "Detected: File search and analysis"
  - Status: "Plan created with 2 steps"
  - Progress: "Step 1/2: Find markdown files"
  - Progress: "Step 2/2: Count results"
  - Result: "Found 15 markdown files in your project"
```

### Scenario 3: Code Generation
```
You: "Write a Python script to list files"
Agent:
  - Status: "Creating execution plan..."
  - Progress: "Step 1/3: Generate Python code"
  - Progress: "Step 2/3: Save to file"
  - Progress: "Step 3/3: Test execution"
  - Result: "Done! Created list_files.py in temp folder. Here's the output: [files listed]"
```

### Scenario 4: Complex Project
```
You: "Build me a calculator"
Agent:
  - Status: "Detected: Build calculator app"
  - Plan Preview:
    • Create project structure
    • Generate HTML interface
    • Generate CSS styles
    ...and 5 more steps
  - Progress: Shows 0% → 12% → 25% → ... → 100%
  - Result: "Your calculator is ready! Find it in /calculator"
```

## 🔍 Debug Mode

Watch the console for detailed logs:
```
[AGENT] Intent detected: multi_step_tool_chain
[AGENT] Plan created with 3 steps
[AGENT] Executing step 1/3: file_list
[AGENT] Step 1 complete
[AGENT] Executing step 2/3: code_gen
[AGENT] Step 2 complete
[AGENT] All steps complete
```

## ⚡ Expected Performance

- **Simple conversation**: Instant
- **Single tool call**: 1-2 seconds
- **Intent analysis**: 2-3 seconds
- **Plan creation**: 3-5 seconds
- **Multi-step execution**: 5-30 seconds (depends on steps)
- **Code generation**: 5-10 seconds

## 🎓 Learning Tips

1. **Start Simple**: Begin with basic requests like "Hello" and "Read a file"
2. **Get Complex**: Gradually try more complex multi-step tasks
3. **Watch the UI**: Pay attention to status updates and progress
4. **Try Variations**: Same task, different wording
5. **Push Limits**: Try "Build me an app" to see full capabilities

## 🐛 Troubleshooting

### Agent Not Responding
- Check console for errors
- Verify API keys are set
- Try a simpler request first

### Progress Bar Stuck
- Some steps take longer (LLM calls)
- Wait for timeout (30 seconds per step)
- Check console for details

### Plan Not Showing
- Some simple tasks skip planning (single tool)
- Complex tasks show plans automatically
- Try a multi-step request

## 💡 Pro Tips

1. **Be Natural**: Talk like you would to a person
   - ✅ "Can you help me organize my files?"
   - ❌ "tool:file_list path:downloads"

2. **Be Specific**: More detail = better results
   - ✅ "Create a todo list with save/load functionality"
   - ❌ "Make an app"

3. **Follow Up**: Agent remembers context
   - "Build a calculator"
   - "Now add a dark theme"
   - "Make it responsive"

4. **Ask Questions**: It's a conversation!
   - "What can you help me with?"
   - "Can you build web apps?"
   - "How does this work?"

## 📊 Success Indicators

You'll know it's working when:
- ✅ Status updates appear while thinking
- ✅ Progress bar animates smoothly
- ✅ Plan preview shows your task steps
- ✅ Natural language responses
- ✅ Tasks complete successfully
- ✅ Artifacts are created (files, code)

## 🎉 Have Fun!

The agent can handle almost anything you throw at it. Be creative, try complex tasks, and watch it intelligently break them down into steps.

**Remember**: You're not just chatting – you're commanding a powerful AI that can actually DO things!

---

**Quick Start Summary**:
1. Run `npm run dev`
2. Say "Hello!"
3. Try "Read test-file.txt"
4. Then try "Build me a calculator"
5. Watch the magic happen! ✨

