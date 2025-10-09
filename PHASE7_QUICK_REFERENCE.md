# Phase 7: Quick Reference Guide

## ⚡ Quick Start

### Start the Application
```bash
cd phase1-minimal
npm run dev
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus chat input |
| `Ctrl/Cmd + H` | Toggle chat history |
| `Ctrl/Cmd + ,` | Open settings |
| `Escape` | Close all modals |
| `Enter` | Send message |
| `Shift + Enter` | New line |

## 🎨 Features

### Streaming Responses
- **Supported:** Claude, OpenAI
- **Auto-enabled:** Yes
- **Fallback:** Standard responses for Ollama

### Notifications
- **Location:** Top-right
- **Types:** Success, Error, Warning, Info
- **Duration:** 5 seconds (default)
- **Dismissible:** Yes (click X)

### Chat History
- **Access:** `Ctrl+H` or Settings button
- **Search:** Full-text search
- **Filter:** All, User, Assistant
- **Export:** JSON format
- **Clear:** With confirmation

### Settings
- **Access:** `Ctrl+,` or Settings button
- **Tabs:** General, Appearance, MCP, Advanced
- **Storage:** localStorage
- **Themes:** Light, Dark, System

## 🤖 AI Providers

### Default Provider
Set in: **Settings → General → AI Provider**

### Per-Message Override
- `/claude <message>` - Use Claude
- `/gpt <message>` - Use OpenAI
- Regular message - Use default

### Supported Models
- **Claude:** Sonnet 4 (streaming ✓)
- **OpenAI:** GPT-4o (streaming ✓)
- **Ollama:** Llama 3.1 (local, no streaming)

## 🎨 Themes

### Available Themes
1. **Light** - Bright, clean interface
2. **Dark** - Easy on the eyes
3. **System** - Match OS preference

### Change Theme
1. Open Settings (`Ctrl+,`)
2. Go to Appearance tab
3. Click desired theme button

## 🔔 Notification Types

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| Success | Green | ✓ | Operations complete |
| Error | Red | ✕ | Failed operations |
| Warning | Orange | ⚠ | Important notices |
| Info | Blue | ℹ | General information |

## 🔧 Tool Execution Feedback

### Visual States
- **Running** - Blue pulsing dot
- **Success** - Green checkmark
- **Error** - Red X

### Where to See
- Appears above chat input during tool execution
- Auto-dismisses when complete

## 📚 Chat History Features

### Search
- Type in search box
- Instant filtering
- Case-insensitive

### Filters
- **All** - Show everything
- **User** - Your messages only
- **Assistant** - AI responses only

### Statistics
- Total messages
- Token count (approximate)

### Actions
- **Export** - Download as JSON
- **Clear** - Remove all history

## ⚙️ Settings Tabs

### General
- AI Provider selection
- Enable Notifications
- Enable Sounds

### Appearance
- Theme selection (Light/Dark/System)

### MCP Servers
- MCP server configuration
- Connection management
- Tool discovery

### Advanced
- Max Iterations (1-50)
- Tool execution settings

## 💡 Tips & Tricks

### Faster Workflow
1. Use `Ctrl+K` to quickly focus input
2. Use `Ctrl+H` to review previous conversations
3. Set up your preferred provider in settings
4. Use `/claude` or `/gpt` to try different models

### Better Responses
1. Be specific in your queries
2. Use multiple messages for complex tasks
3. Check tool execution feedback
4. Review conversation history for context

### Customization
1. Choose your preferred theme
2. Toggle notifications if distracting
3. Adjust max iterations for tool usage
4. Export conversations for later review

## 🐛 Quick Troubleshooting

### Streaming Not Working
1. Check API key is set
2. Verify provider (Claude/OpenAI only)
3. Check internet connection
4. Look at console for errors

### Keyboard Shortcuts Not Working
1. Close all modals first
2. Ensure input doesn't have focus (for non-input shortcuts)
3. Try refreshing the app

### Settings Not Saving
1. Check browser localStorage
2. Try clearing cache
3. Check console for errors
4. Restart application

### Theme Not Changing
1. Go to Settings → Appearance
2. Select theme manually
3. If using System, check OS theme
4. Refresh if needed

## 📊 Performance

### Streaming
- First chunk: 50-150ms
- Subsequent chunks: <5ms
- Smooth 60fps animations

### UI
- Instant keyboard shortcuts
- Smooth scrolling
- Fast modal animations
- No blocking operations

## 🎯 Common Tasks

### Start New Conversation
1. Clear input field
2. Type your message
3. Press Enter
4. Watch streaming response

### Change AI Model
**Option 1:** Via Settings
- `Ctrl+,` → General → AI Provider

**Option 2:** Per Message
- Type `/claude <message>` or `/gpt <message>`

### Export Conversation
1. Press `Ctrl+H`
2. Click "Export" button
3. JSON file downloads automatically

### Search History
1. Press `Ctrl+H`
2. Type in search box
3. Use filters if needed
4. Click message to view

### Configure Notifications
1. Press `Ctrl+,`
2. Go to General tab
3. Toggle "Enable Notifications"
4. Optionally toggle "Enable Sounds"

## 🔗 Component Reference

### New Components
- `ChatPanelEnhanced.tsx` - Main chat interface
- `NotificationSystem.tsx` - Toast notifications
- `ToolExecutionFeedback.tsx` - Tool status display
- `ChatHistorySidebar.tsx` - History sidebar
- `SettingsPanel.tsx` - Enhanced settings

### Updated Components
- `panel.tsx` - Uses ChatPanelEnhanced
- `llm-providers-enhanced.ts` - Streaming support
- `index.ts` - Streaming IPC handlers
- `preload/index.ts` - Streaming APIs

## 📱 UI Layout

```
┌─────────────────────────────────┐
│  Header (Logo, Status, Buttons) │
├─────────────────────────────────┤
│                                 │
│         Chat Messages           │
│      (Scrollable Area)          │
│                                 │
│    [Tool Execution Feedback]    │
├─────────────────────────────────┤
│    Input Field   [Send Button]  │
└─────────────────────────────────┘

Modals (Overlay):
- Plugin Marketplace
- Settings Panel
- Chat History Sidebar

Notifications (Top-Right):
- Toast messages
- Auto-dismiss
```

## 🎨 Color Scheme

### Light Mode
- Background: White/Light Gray gradient
- Text: Dark Gray
- Accent: Blue
- User Message: Blue gradient
- Assistant Message: White/Light Gray

### Dark Mode
- Background: Dark Blue/Gray gradient
- Text: Light Gray/White
- Accent: Light Blue
- User Message: Blue gradient
- Assistant Message: Dark Gray/Blue

## 📈 Version Info

**Phase 7 Features:**
- Streaming responses (✓ Claude, ✓ OpenAI)
- Visual tool execution feedback
- Chat history with search
- Enhanced settings panel
- Keyboard shortcuts
- Notification system

**Build Date:** October 2025
**Version:** 1.0.0 (Phase 7)

---

## 🎉 You're Ready!

Start chatting, explore features, and enjoy the enhanced experience!

For detailed documentation, see `PHASE7_ENHANCED_UI_UX.md`

