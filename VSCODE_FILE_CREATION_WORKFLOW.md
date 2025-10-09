# VSCode File Creation Workflow

## Overview

This document explains how the AI Desktop Assistant creates files in Visual Studio Code when building projects. The system ensures that when VSCode opens, it immediately proceeds to create all necessary project files.

## Workflow Steps

### 1. **Project Directory Creation**
```
VisualProjectBuilder.createProjectDirectory()
├── Creates project directory on disk
├── Verifies write permissions
├── Opens File Explorer to show the folder
└── Emits progress event
```

### 2. **VSCode Launch**
```
VisualProjectBuilder.openProjectInVSCode()
├── Opens VSCode with empty project folder
├── Uses ApplicationLauncher.openVSCodeWithShortcut()
├── Waits 3 seconds for VSCode to fully initialize
└── Prepares for file creation
```

**Key Methods:**
- `ApplicationLauncher.openVSCodeWithShortcut()`: Opens VSCode via CLI or desktop shortcut
- Supports Windows (.lnk shortcuts), macOS, and Linux
- Waits for VSCode window to fully load

### 3. **File Creation Phase**
```
VisualProjectBuilder.createProjectFiles()
├── Categorizes files (important vs config)
├── Calls LiveCodeWriter.writeImportantFilesWithPause()
└── Creates files sequentially:
    ├── Important files (opened in editor, written slowly)
    └── Config files (not opened, written quickly)
```

**File Creation Process:**

#### For Each File:
```typescript
LiveCodeWriter.writeFileLive()
├── 1. Create directory structure (if needed)
├── 2. Create empty file on disk
├── 3. Open file in VSCode (if important)
│   └── Uses: code "<filepath>"
├── 4. Write content line-by-line
│   ├── Writes to disk with fs.writeFileSync()
│   ├── Emits progress events
│   └── Adjusts speed based on line complexity
└── 5. Verify file was created successfully
```

### 4. **Important vs Config Files**

#### Important Files (openInEditor: true)
- **Examples**: `index.js`, `app.ts`, `server.js`, `main.py`, `README.md`
- **Speed**: 80ms per line (slower for visibility)
- **Behavior**: 
  - File is opened in VSCode editor
  - Content written line-by-line for visual effect
  - Longer pause (2s) after completion

#### Config Files (openInEditor: false)
- **Examples**: `package.json`, `.gitignore`, `.env`, `tsconfig.json`
- **Speed**: 30ms per line (faster)
- **Behavior**: 
  - File created in background
  - Not opened in editor
  - Quick transition to next file

### 5. **File Opening Mechanism**

The system uses VSCode CLI to open files:

```typescript
ApplicationLauncher.openAndRevealFile(filePath, lineNumber?)
├── Verifies file exists on disk
├── Constructs VSCode command: code "<filepath>"
├── Executes command via child_process.exec()
├── Waits for VSCode to open the file
└── Returns after file is displayed
```

**Safety Features:**
- File existence verification before opening
- Error handling for missing files
- Timeout protection (2s max)
- Graceful degradation if VSCode CLI fails

## File Creation Sequence

### Example Project Build:

1. **VSCode Opens** (empty project folder)
   ```
   C:\Users\...\Desktop\AI-Projects\my-app\
   ```

2. **Files Created in Order:**
   ```
   [1] package.json         (config - not opened)
   [2] .gitignore           (config - not opened)
   [3] .env                 (config - not opened)
   [4] index.html           (important - OPENED)
   [5] style.css            (important - OPENED)
   [6] script.js            (important - OPENED)
   [7] README.md            (important - OPENED)
   ```

3. **Result**: VSCode displays all important files in tabs

## Code Components

### VisualProjectBuilder
**Location**: `apps/main/desktop-control/visual-builder.ts`

**Key Methods:**
- `buildProjectVisually()`: Main orchestrator
- `createProjectDirectory()`: Creates project folder
- `openProjectInVSCode()`: Launches VSCode
- `createProjectFiles()`: Creates all files

### LiveCodeWriter
**Location**: `apps/main/desktop-control/live-code-writer.ts`

**Key Methods:**
- `writeImportantFilesWithPause()`: Creates files with pauses
- `writeFileLive()`: Writes single file line-by-line
- `setSpeed()`: Adjusts writing speed

**Events:**
- `progress`: Emitted for each line written
- `status`: Emitted for phase changes

### ApplicationLauncher
**Location**: `apps/main/desktop-control/application-launcher.ts`

**Key Methods:**
- `openVSCodeWithShortcut()`: Opens VSCode
- `openAndRevealFile()`: Opens file in editor
- `createFileInVSCode()`: Creates single file
- `createMultipleFilesInVSCode()`: Batch file creation

## Progress Tracking

The system emits detailed progress events:

```typescript
CodeWritingProgress {
  phase: 'creating' | 'writing' | 'complete'
  file: string              // Current file path
  linesWritten: number      // Lines written so far
  totalLines: number        // Total lines in file
  currentLine: string       // Current line content (preview)
  percentComplete: number   // 0-100
}
```

## Error Handling

### File Creation Errors
- **Directory creation fails**: Throws error with details
- **File write fails**: Logs error and throws
- **VSCode open fails**: Logs warning but continues

### Recovery Strategies
1. **OneDrive Detection**: Automatically uses local directory
2. **Permission Issues**: Verifies write access before starting
3. **VSCode Not Found**: Falls back to PATH resolution
4. **File Already Exists**: Overwrites with new content

## Configuration

### Writing Speed Settings
```typescript
// In LiveCodeWriter
writingSpeed: number = 50  // Default: 50ms per line

// Automatically adjusted:
- Empty lines: 10ms
- Short lines (<20 chars): 30ms
- Normal lines: 50ms
- Long lines (>100 chars): 80ms
```

### Timing Intervals
```typescript
// VSCode initialization
await this.wait(3000)  // Wait for VSCode to load

// File creation pauses
- Important files: 2000ms after completion
- Config files: minimal delay

// File opening
await this.wait(1500)  // Wait for editor to open file
```

## Debugging

### Console Output

The system provides extensive logging:

```
[VisualBuilder] Opening VSCode with project folder: C:\...\my-app
[VisualBuilder] VSCode opened, waiting for initialization...
[VisualBuilder] VSCode ready, proceeding to create files...
[VisualBuilder] Creating 7 files in VSCode...
[LiveCodeWriter] Writing 7 files to project...
[LiveCodeWriter] Writing important file [1]: index.html
[LiveCodeWriter] Starting to write: index.html
[LiveCodeWriter] Created empty file: index.html
[LiveCodeWriter] Opening file in VSCode: index.html
[ApplicationLauncher] Opening file in VSCode: C:\...\index.html
[ApplicationLauncher] ✓ File opened in VSCode: C:\...\index.html
[LiveCodeWriter] File has 42 lines
[LiveCodeWriter] ✓ File written successfully: index.html (1248 bytes)
[LiveCodeWriter] ✓ Important file written and opened: index.html
```

### Common Issues

#### VSCode Doesn't Open Files
**Cause**: VSCode CLI (`code`) not in PATH

**Solution**:
1. Check: `where code` (Windows) or `which code` (macOS/Linux)
2. Install: VSCode -> Command Palette -> "Shell Command: Install 'code' command in PATH"
3. Restart terminal/application

#### Files Not Visible Immediately
**Cause**: VSCode file watcher delay

**Solution**: System includes automatic delays to allow VSCode to refresh

#### OneDrive Sync Issues
**Cause**: Files in OneDrive folders cause sync delays

**Solution**: System automatically detects and avoids OneDrive paths

## Testing

To test the file creation workflow:

```javascript
// 1. Request a simple project
"Build me a simple HTML calculator"

// 2. Watch the console output
// 3. Verify:
//    - VSCode opens
//    - Files appear in explorer
//    - Important files open in tabs
//    - All files have content
```

## Architecture

```
User Request
    ↓
DynamicProjectGenerator
    ↓ (generates ProjectScaffold)
DynamicProjectBuilder
    ↓ (converts to scaffold)
VisualProjectBuilder
    ↓
    ├─→ ApplicationLauncher (opens VSCode)
    ↓
    └─→ LiveCodeWriter (creates files)
        ↓
        └─→ ApplicationLauncher (opens files in editor)
```

## Best Practices

### For Developers

1. **Always verify file exists** before trying to open in VSCode
2. **Use appropriate delays** between operations
3. **Emit progress events** for user feedback
4. **Log extensively** for debugging
5. **Handle errors gracefully** without breaking the flow

### For Users

1. **Keep VSCode updated** for best CLI compatibility
2. **Don't close VSCode** while files are being created
3. **Wait for "Complete"** message before interacting
4. **Check console** if files don't appear

## Future Enhancements

Potential improvements:

- [ ] Support for VSCode workspace files
- [ ] Automatic VSCode extension installation
- [ ] File syntax highlighting preview
- [ ] Multi-cursor editing simulation
- [ ] Git integration (auto-commit after creation)
- [ ] Remote development support
- [ ] Custom file templates
- [ ] Live preview in browser during creation

## Summary

The system ensures that **when VSCode opens, it immediately proceeds to create all project files** through a carefully orchestrated workflow:

1. ✅ VSCode opens with empty folder
2. ✅ Files are created sequentially
3. ✅ Important files open in editor tabs
4. ✅ Content written line-by-line
5. ✅ Progress tracked and displayed
6. ✅ Errors handled gracefully
7. ✅ User can watch the process

This creates an engaging, transparent, and reliable project creation experience.

