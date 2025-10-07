# SUPERPROMPT v2 — Local Desktop AI Agent (Cursor-Optimized)

You are my principal architect and implementation partner. Build a **production-grade local desktop AI agent** that runs entirely on-device by default, with an always-on mini chat bubble pinned bottom-right.

The agent must: **plan → approve → execute → reflect**, with full control over files, browser, commands, and external tools via MCP protocol.

**Goal**: `npm install && npm run dev` → see bubble → start commanding your computer in natural language.

---

## 🎯 Core Vision

A **local-first AI assistant** that:
- Lives in your system tray with a clean chat bubble UI
- Runs **Llama via Ollama by default** (private, fast, free)
- Falls back to **OpenAI → Claude** for complex tasks automatically
- Executes multi-step plans with **tool calls** (filesystem, browser, shell)
- Connects to **MCP servers** for extensibility
- Requires **explicit approval** for sensitive operations
- Logs everything to an **audit trail**

---

## 🏗️ Technical Stack

### Desktop Framework
- **Electron 32+** (main + preload + renderer)
- **React 18** + **TypeScript 5.3+**
- **Vite 5** (fast HMR, optimized builds)
- **Tailwind CSS 4** (styling)

### State & Data
- **Zustand** (UI state, settings)
- **TanStack Query** (async state, caching)
- **better-sqlite3** (settings, memory, audit log)
- **Zod** (runtime validation)

### AI & Tools
- **Ollama** (local LLMs via http://localhost:11434)
- **OpenAI SDK** (fallback)
- **Anthropic SDK** (final fallback)
- **@modelcontextprotocol/sdk** (MCP client)
- **Playwright** (browser automation)

### Security & Infra
- **Keytar** (OS credential storage)
- **electron-updater** (auto-updates)
- **pino** (structured logging)
- **electron-builder** (packaging)

---

## 📋 Priority Levels

### P0 (MVP — Ship First)
✅ Chat bubble UI with global hotkey  
✅ Ollama integration (default model)  
✅ Basic planner (intent → tool plan → execute)  
✅ File tools (read/write with allow-list)  
✅ Command runner (with confirmation)  
✅ Settings persistence (SQLite)  
✅ Windows installer  

### P1 (Core Features)
✅ OpenAI + Claude fallback logic  
✅ Browser automation (Playwright)  
✅ MCP client + 2 example servers  
✅ Approval flow for sensitive ops  
✅ Audit log (JSONL)  
✅ System tray menu  

### P2 (Polish)
✅ Plan visualization UI  
✅ Token/cost budget meter  
✅ Clipboard tools  
✅ Scheduler (cron jobs)  
✅ E2E tests  
✅ Auto-update  

### P3 (Stretch — Post-Launch)
- Voice input/output (Whisper + Piper)
- Self-bootstrapping tools (generate MCP servers)
- Policy engine (declarative rules)
- Multi-agent orchestration

---

## 🔐 Security Model (Non-Negotiable)

### Electron Sandboxing
```typescript
// apps/main/windows.ts
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### IPC Bridge (Typed & Validated)
```typescript
// apps/preload/bridge.ts
import { contextBridge, ipcRenderer } from 'electron';
import { z } from 'zod';

const InvokeSchema = z.object({
  channel: z.string(),
  payload: z.unknown()
});

contextBridge.exposeInMainWorld('agent', {
  invoke: (channel: string, payload: unknown) =>
    ipcRenderer.invoke(channel, payload),
  on: (channel: string, cb: (data: unknown) => void) =>
    ipcRenderer.on(channel, (_, data) => cb(data)),
  off: (channel: string) => ipcRenderer.removeAllListeners(channel)
});
```

### Allow-List Enforcement
```typescript
// packages/common/security.ts
export function assertPathAllowed(path: string, allowList: string[]): void {
  const resolved = resolve(path);
  const allowed = allowList.some(base => resolved.startsWith(resolve(base)));
  if (!allowed) throw new Error(`Path blocked: ${resolved}`);
}

export function assertDomainAllowed(url: string, patterns: string[]): void {
  const { hostname } = new URL(url);
  const allowed = patterns.some(p => new RegExp(p).test(hostname));
  if (!allowed) throw new Error(`Domain blocked: ${hostname}`);
}
```

### Secrets Management
```typescript
// packages/common/secrets.ts
import keytar from 'keytar';

const SERVICE = 'desktop-agent';

export async function setSecret(key: string, value: string): Promise<void> {
  await keytar.setPassword(SERVICE, key, value);
}

export async function getSecret(key: string): Promise<string | null> {
  return await keytar.getPassword(SERVICE, key);
}
```

---

## 🎨 UI/UX Specification

### 1. Chat Bubble (Always-On-Top)
```typescript
// apps/main/windows/bubble.ts
export function createBubble(): BrowserWindow {
  return new BrowserWindow({
    width: 64,
    height: 64,
    x: screen.getPrimaryDisplay().workAreaSize.width - 80,
    y: screen.getPrimaryDisplay().workAreaSize.height - 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: { preload: PRELOAD_PATH }
  });
}
```

**Visual**:
- 64x64px circular button
- Gradient background (purple → blue)
- Pulsing animation when active
- Drag to reposition
- Click to expand

### 2. Chat Panel (Expandable)
```typescript
// apps/main/windows/panel.ts
export function createPanel(): BrowserWindow {
  return new BrowserWindow({
    width: 420,
    height: Math.floor(screen.getPrimaryDisplay().workAreaSize.height * 0.7),
    x: screen.getPrimaryDisplay().workAreaSize.width - 440,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: { preload: PRELOAD_PATH }
  });
}
```

**Layout**:
```
┌─────────────────────────┐
│ ⚙️  Settings   ╳ Close  │ ← Header (drag handle)
├─────────────────────────┤
│                         │
│  Chat Messages          │ ← Scrollable history
│  (streaming support)    │
│                         │
│  Tool Call Preview      │ ← Collapsible cards
│  [Approve] [Cancel]     │
│                         │
├─────────────────────────┤
│ 💬 Type a command...    │ ← Input (Ctrl+Enter)
│ 🎤 🔗 📎               │ ← Actions
└─────────────────────────┘
```

### 3. Settings Modal
```typescript
// apps/renderer/components/Settings.tsx
interface SettingsSchema {
  providers: {
    ollama: { endpoint: string; model: string; enabled: boolean };
    openai: { model: string; enabled: boolean };
    anthropic: { model: string; enabled: boolean };
  };
  security: {
    allowListPaths: string[];
    allowListDomains: string[];
    requireConfirmation: {
      fileWrite: boolean;
      fileDelete: boolean;
      commandRun: boolean;
      browserSubmit: boolean;
      clipboardSet: boolean;
    };
  };
  browser: {
    mode: 'playwright' | 'cdp';
    headless: boolean;
    cdpEndpoint?: string;
  };
  mcp: {
    servers: Array<{
      name: string;
      command?: string[];
      url?: string;
      enabled: boolean;
    }>;
  };
  system: {
    autoStart: boolean;
    globalHotkey: string;
    notifications: boolean;
  };
  budget: {
    maxTokensPerRun: number;
    maxToolCallsPerRun: number;
    maxDurationSeconds: number;
  };
}
```

### 4. Global Hotkey
```typescript
// apps/main/hotkeys.ts
import { globalShortcut } from 'electron';

export function registerHotkey(key: string, callback: () => void): void {
  globalShortcut.register(key, callback);
}

// Default: Ctrl+Shift+Space
registerHotkey('CommandOrControl+Shift+Space', togglePanel);
```

### 5. System Tray
```typescript
// apps/main/tray.ts
import { Tray, Menu } from 'electron';

export function createTray(): Tray {
  const tray = new Tray(ICON_PATH);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '🟢 Agent Running', enabled: false },
    { type: 'separator' },
    { label: 'Open Chat', click: showPanel },
    { label: 'Pause Automation', type: 'checkbox', checked: false },
    { type: 'separator' },
    { label: 'Settings', click: showSettings },
    { label: 'View Logs', click: openLogsFolder },
    { type: 'separator' },
    { label: 'Quit', click: quitApp }
  ]));
  return tray;
}
```

---

## 🤖 Agent Architecture

### 1. Planner (Core Loop)
```typescript
// packages/agent/planner.ts
export interface Plan {
  id: string;
  intent: string;
  steps: Step[];
  confidence: number;
  estimatedTokens: number;
  estimatedDuration: number;
  requiresApproval: boolean;
}

export interface Step {
  id: string;
  description: string;
  tool: string;
  args: Record<string, unknown>;
  sensitive: boolean;
  dependencies: string[]; // step IDs
}

export class Planner {
  async createPlan(input: string, context: Context): Promise<Plan> {
    // 1. Parse intent with LLM
    const intent = await this.parseIntent(input, context);
    
    // 2. Generate tool sequence
    const steps = await this.generateSteps(intent, context);
    
    // 3. Validate schema & dependencies
    const validatedSteps = this.validateSteps(steps);
    
    // 4. Calculate confidence & cost
    const confidence = this.calculateConfidence(validatedSteps);
    
    // 5. Check if approval needed
    const requiresApproval = validatedSteps.some(s => s.sensitive);
    
    return {
      id: randomUUID(),
      intent: input,
      steps: validatedSteps,
      confidence,
      estimatedTokens: this.estimateTokens(validatedSteps),
      estimatedDuration: this.estimateDuration(validatedSteps),
      requiresApproval
    };
  }
  
  async executePlan(plan: Plan, onProgress: ProgressCallback): Promise<Result> {
    const results: StepResult[] = [];
    
    for (const step of plan.steps) {
      // Check dependencies
      if (!this.dependenciesMet(step, results)) {
        throw new Error(`Dependencies not met for step ${step.id}`);
      }
      
      // Execute tool
      onProgress({ step, status: 'running' });
      const result = await this.toolRouter.execute(step.tool, step.args);
      results.push({ stepId: step.id, ...result });
      onProgress({ step, status: 'complete', result });
      
      // Check budget
      if (this.budgetExceeded()) {
        throw new Error('Budget exceeded');
      }
    }
    
    // Reflect & summarize
    const summary = await this.reflect(plan, results);
    
    return { results, summary };
  }
  
  private calculateConfidence(steps: Step[]): number {
    // Heuristic based on:
    // - Tool schema match quality
    // - Historical success rate for similar plans
    // - Complexity (# steps, # dependencies)
    // - Data availability
    
    let score = 1.0;
    
    // Penalize complex plans
    score -= Math.min(0.3, steps.length * 0.02);
    
    // Penalize unknown tools
    steps.forEach(step => {
      if (!this.toolRouter.hasHandler(step.tool)) {
        score -= 0.2;
      }
    });
    
    // Boost based on historical success
    const historicalSuccess = this.getHistoricalSuccess(steps);
    score = score * 0.7 + historicalSuccess * 0.3;
    
    return Math.max(0, Math.min(1, score));
  }
}
```

### 2. Model Clients (Multi-Provider)
```typescript
// packages/agent/models/base.ts
export interface ModelClient {
  stream(prompt: string, options: StreamOptions): AsyncIterable<string>;
  plan(context: Context, tools: Tool[]): Promise<Plan>;
  complete(prompt: string, options: CompleteOptions): Promise<string>;
}

export interface StreamOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  tools?: Tool[];
}

// packages/agent/models/ollama.ts
export class OllamaClient implements ModelClient {
  constructor(
    private endpoint: string = 'http://localhost:11434',
    private model: string = 'llama3.1'
  ) {}
  
  async *stream(prompt: string, options: StreamOptions) {
    const response = await fetch(`${this.endpoint}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: true,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 2048
        }
      })
    });
    
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);
      
      for (const line of lines) {
        const data = JSON.parse(line);
        if (data.response) yield data.response;
      }
    }
  }
  
  async plan(context: Context, tools: Tool[]): Promise<Plan> {
    const prompt = this.buildPlanPrompt(context, tools);
    const response = await this.complete(prompt, { maxTokens: 4096 });
    return this.parsePlanResponse(response);
  }
}

// packages/agent/models/openai.ts
export class OpenAIClient implements ModelClient {
  constructor(
    private apiKey: string,
    private model: string = 'gpt-4o'
  ) {}
  
  async *stream(prompt: string, options: StreamOptions) {
    const stream = await openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      tools: options.tools ? this.formatTools(options.tools) : undefined
    });
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}

// packages/agent/models/anthropic.ts
export class AnthropicClient implements ModelClient {
  constructor(
    private apiKey: string,
    private model: string = 'claude-3-5-sonnet-20241022'
  ) {}
  
  async *stream(prompt: string, options: StreamOptions) {
    const stream = await anthropic.messages.stream({
      model: this.model,
      max_tokens: options.maxTokens ?? 4096,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature,
      tools: options.tools ? this.formatTools(options.tools) : undefined
    });
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }
}
```

### 3. Auto-Fallback Orchestrator
```typescript
// packages/agent/orchestrator.ts
export class ModelOrchestrator {
  constructor(
    private ollama: OllamaClient,
    private openai: OpenAIClient,
    private claude: AnthropicClient,
    private settings: Settings
  ) {}
  
  async executePlanWithFallback(
    input: string,
    context: Context
  ): Promise<ExecutionResult> {
    const providers: Array<{
      name: string;
      client: ModelClient;
      threshold: number;
    }> = [
      { name: 'ollama', client: this.ollama, threshold: 0.6 },
      { name: 'openai', client: this.openai, threshold: 0.4 },
      { name: 'claude', client: this.claude, threshold: 0 }
    ];
    
    for (const { name, client, threshold } of providers) {
      if (!this.isEnabled(name)) continue;
      
      try {
        // Generate plan
        const plan = await client.plan(context, this.getTools());
        
        // Check confidence
        if (plan.confidence < threshold) {
          logger.warn(`${name} confidence too low: ${plan.confidence}, escalating`);
          continue;
        }
        
        // Validate schema
        if (!this.validatePlanSchema(plan)) {
          logger.warn(`${name} produced invalid plan, escalating`);
          continue;
        }
        
        // Execute
        logger.info(`Executing plan with ${name}`);
        return await this.planner.executePlan(plan, this.onProgress);
        
      } catch (error) {
        logger.error(`${name} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All providers failed');
  }
  
  private isEnabled(provider: string): boolean {
    return this.settings.providers[provider]?.enabled ?? false;
  }
  
  private validatePlanSchema(plan: Plan): boolean {
    // Check all tools exist
    for (const step of plan.steps) {
      if (!this.toolRouter.hasHandler(step.tool)) {
        return false;
      }
      
      // Validate args against schema
      const schema = this.toolRouter.getSchema(step.tool);
      const result = schema.safeParse(step.args);
      if (!result.success) return false;
    }
    
    // Check dependency graph is acyclic
    return this.isAcyclic(plan.steps);
  }
}
```

---

## 🛠️ Tools Implementation

### 1. Filesystem Tools
```typescript
// packages/tools-node/fs.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { assertPathAllowed } from '@/common/security';
import { z } from 'zod';

const ListDirSchema = z.object({
  path: z.string()
});

const ReadFileSchema = z.object({
  path: z.string(),
  maxBytes: z.number().int().positive().default(1_000_000)
});

const WriteFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  mode: z.enum(['write', 'append']).default('write')
});

const SearchFilesSchema = z.object({
  path: z.string(),
  query: z.string(),
  glob: z.string().optional()
});

export class FilesystemTools {
  constructor(private allowList: string[]) {}
  
  async listDir(args: z.infer<typeof ListDirSchema>) {
    const { path: dir } = ListDirSchema.parse(args);
    assertPathAllowed(dir, this.allowList);
    
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return {
      items: entries.map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'dir' : 'file',
        path: path.join(dir, e.name)
      }))
    };
  }
  
  async readFile(args: z.infer<typeof ReadFileSchema>) {
    const { path: file, maxBytes } = ReadFileSchema.parse(args);
    assertPathAllowed(file, this.allowList);
    
    const buffer = await fs.readFile(file);
    const content = buffer.slice(0, maxBytes).toString('utf-8');
    
    return {
      content,
      size: buffer.length,
      truncated: buffer.length > maxBytes
    };
  }
  
  async writeFile(args: z.infer<typeof WriteFileSchema>) {
    const { path: file, content, mode } = WriteFileSchema.parse(args);
    assertPathAllowed(file, this.allowList);
    
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, { flag: mode === 'append' ? 'a' : 'w' });
    
    return {
      ok: true,
      bytesWritten: Buffer.byteLength(content),
      path: file
    };
  }
  
  async searchFiles(args: z.infer<typeof SearchFilesSchema>) {
    const { path: dir, query, glob } = SearchFilesSchema.parse(args);
    assertPathAllowed(dir, this.allowList);
    
    // Use ripgrep or simple recursive search
    const results = await this.recursiveSearch(dir, query, glob);
    
    return { matches: results };
  }
  
  private async recursiveSearch(
    dir: string,
    query: string,
    glob?: string
  ): Promise<Array<{ path: string; line: number; text: string }>> {
    // Implementation with glob matching and text search
    // ...
  }
}

export const fsToolsSchema = {
  listDir: { schema: ListDirSchema, requiresApproval: false },
  readFile: { schema: ReadFileSchema, requiresApproval: false },
  writeFile: { schema: WriteFileSchema, requiresApproval: true },
  searchFiles: { schema: SearchFilesSchema, requiresApproval: false }
};
```

### 2. Command Runner
```typescript
// packages/tools-node/command.ts
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';

const execAsync = promisify(exec);

const RunCommandSchema = z.object({
  command: z.string().min(1),
  timeout: z.number().int().positive().max(60).default(30),
  cwd: z.string().optional()
});

const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//,  // rm -rf /
  /format\s+c:/i,    // format c:
  /dd\s+if=/,        // dd if=...
  />.*\/dev\//       // redirect to /dev/*
];

export class CommandTools {
  async run(args: z.infer<typeof RunCommandSchema>) {
    const { command, timeout, cwd } = RunCommandSchema.parse(args);
    
    // Security checks
    if (BLOCKED_PATTERNS.some(p => p.test(command))) {
      throw new Error('Blocked dangerous command pattern');
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: timeout * 1000,
        cwd,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
      });
      
      return {
        code: 0,
        stdout: stdout.slice(0, 100_000), // Limit output
        stderr: stderr.slice(0, 100_000)
      };
      
    } catch (error: any) {
      return {
        code: error.code ?? 1,
        stdout: error.stdout?.slice(0, 100_000) ?? '',
        stderr: error.stderr?.slice(0, 100_000) ?? error.message
      };
    }
  }
}

export const commandToolsSchema = {
  run: { schema: RunCommandSchema, requiresApproval: true }
};
```

### 3. Browser Automation (Playwright)
```typescript
// packages/tools-node/browser.ts
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { assertDomainAllowed } from '@/common/security';
import { z } from 'zod';

const BrowserOpenSchema = z.object({
  url: z.string().url()
});

const BrowserFillSchema = z.object({
  selector: z.string(),
  value: z.string()
});

const BrowserClickSchema = z.object({
  selector: z.string()
});

const BrowserWaitSchema = z.object({
  selector: z.string(),
  timeout: z.number().int().max(30000).default(10000)
});

const BrowserTextSchema = z.object({
  selector: z.string()
});

const BrowserScreenshotSchema = z.object({
  path: z.string()
});

export class BrowserTools {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  
  constructor(
    private allowedDomains: string[],
    private headless: boolean = false
  ) {}
  
  private async ensureBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.headless,
        args: ['--disable-blink-features=AutomationControlled']
      });
    }
    
    if (!this.context) {
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0...' // Real UA
      });
    }
    
    if (!this.page) {
      this.page = await this.context.newPage();
    }
  }
  
  async open(args: z.infer<typeof BrowserOpenSchema>) {
    const { url } = BrowserOpenSchema.parse(args);
    assertDomainAllowed(url, this.allowedDomains);
    
    await this.ensureBrowser();
    await this.page!.goto(url, { waitUntil: 'domcontentloaded' });
    
    return {
      ok: true,
      title: await this.page!.title(),
      url: this.page!.url()
    };
  }
  
  async fill(args: z.infer<typeof BrowserFillSchema>) {
    const { selector, value } = BrowserFillSchema.parse(args);
    await this.ensureBrowser();
    
    await this.page!.fill(selector, value);
    return { ok: true };
  }
  
  async click(args: z.infer<typeof BrowserClickSchema>) {
    const { selector } = BrowserClickSchema.parse(args);
    await this.ensureBrowser();
    
    await this.page!.click(selector);
    return { ok: true };
  }
  
  async wait(args: z.infer<typeof BrowserWaitSchema>) {
    const { selector, timeout } = BrowserWaitSchema.parse(args);
    await this.ensureBrowser();
    
    await this.page!.waitForSelector(selector, { timeout });
    return { ok: true };
  }
  
  async text(args: z.infer<typeof BrowserTextSchema>) {
    const { selector } = BrowserTextSchema.parse(args);
    await this.ensureBrowser();
    
    const text = await this.page!.textContent(selector);
    return { text: text ?? '' };
  }
  
  async screenshot(args: z.infer<typeof BrowserScreenshotSchema>) {
    const { path } = BrowserScreenshotSchema.parse(args);
    await this.ensureBrowser();
    
    await this.page!.screenshot({ path, fullPage: false });
    return { ok: true, path };
  }
  
  async close() {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    this.browser = null;
    this.context = null;
    this.page = null;
  }
}

export const browserToolsSchema = {
  open: { schema: BrowserOpenSchema, requiresApproval: false },
  fill: { schema: BrowserFillSchema, requiresApproval: false },
  click: { schema: BrowserClickSchema, requiresApproval: false },
  wait: { schema: BrowserWaitSchema, requiresApproval: false },
  text: { schema: BrowserTextSchema, requiresApproval: false },
  screenshot: { schema: BrowserScreenshotSchema, requiresApproval: false }
};
```

### 4. Clipboard Tools
```typescript
// packages/tools-node/clipboard.ts
import clipboard from 'clipboardy';
import { z } from 'zod';

const GetClipboardSchema = z.object({});
const SetClipboardSchema = z.object({
  text: z.string()
});

export class ClipboardTools {
  async get(args: z.infer<typeof GetClipboardSchema>) {
    const text = await clipboard.read();
    return { text };
  }
  
  async set(args: z.infer<typeof SetClipboardSchema>) {
    const { text } = SetClipboardSchema.parse(args);
    await clipboard.write(text);
    return { ok: true };
  }
}

export const clipboardToolsSchema = {
  get: { schema: GetClipboardSchema, requiresApproval: false },
  set: { schema: SetClipboardSchema, requiresApproval: true }
};
```

### 5. Scheduler (Cron)
```typescript
// packages/tools-node/scheduler.ts
import { CronJob } from 'cron';
import { z } from 'zod';

const AddCronSchema = z.object({
  cron: z.string().regex(/^[\d\*\-,/\s]+$/),
  action: z.string(),
  description: z.string().optional()
});

const RemoveCronSchema = z.object({
  id: z.string()
});

export class SchedulerTools {
  private jobs = new Map<string, CronJob>();
  
  async add(args: z.infer<typeof AddCronSchema>) {
    const { cron, action, description } = AddCronSchema.parse(args);
    
    const id = randomUUID();
    const job = new CronJob(cron, () => {
      // Execute action (via planner)
      this.executeAction(action);
    });
    
    this.jobs.set(id, job);
    job.start();
    
    return { id, cron, description };
  }
  
  async remove(args: z.infer<typeof RemoveCronSchema>) {
    const { id } = RemoveCronSchema.parse(args);
    
    const job = this.jobs.get(id);
    if (!job) throw new Error(`Job not found: ${id}`);
    
    job.stop();
    this.jobs.delete(id);
    
    return { ok: true };
  }
  
  async list() {
    return {
      jobs: Array.from(this.jobs.entries()).map(([id, job]) => ({
        id,
        running: job.running
      }))
    };
  }
  
  private async executeAction(action: string) {
    // Delegate to planner
    // ...
  }
}

export const schedulerToolsSchema = {
  add: { schema: AddCronSchema, requiresApproval: true },
  remove: { schema: RemoveCronSchema, requiresApproval: false },
  list: { schema: z.object({}), requiresApproval: false }
};
```

---

## 🔌 MCP Integration

### Client Implementation
```typescript
// packages/mcp-client/client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';

export interface MCPServerConfig {
  name: string;
  command?: string[];
  url?: string;
  enabled: boolean;
}

export class MCPClientManager {
  private clients = new Map<string, Client>();
  
  async connect(config: MCPServerConfig): Promise<void> {
    if (config.command) {
      // Stdio transport
      const transport = new StdioClientTransport({
        command: config.command[0],
        args: config.command.slice(1)
      });
      
      const client = new Client({
        name: 'desktop-agent',
        version: '1.0.0'
      }, {
        capabilities: {}
      });
      
      await client.connect(transport);
      this.clients.set(config.name, client);
      
    } else if (config.url) {
      // SSE transport
      // ...
    }
  }
  
  async listTools(serverName: string): Promise<Tool[]> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`Server not connected: ${serverName}`);
    
    const { tools } = await client.listTools();
    return tools;
  }
  
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`Server not connected: ${serverName}`);
    
    const result = await client.callTool({ name: toolName, arguments: args });
    return result;
  }
  
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      await client.close();
      this.clients.delete(serverName);
    }
  }
}
```

### Example MCP Server (Python)
```python
# mcp/localops_server.py
"""
Local operations MCP server (filesystem + OS utils)
"""
import os
import json
from pathlib import Path
from fastmcp import FastMCP

mcp = FastMCP("localops")

# Allow-list
ALLOWED_ROOTS = [
    os.path.expanduser("~/AgentWorkspace"),
    os.path.expanduser("~/Documents")
]

def assert_allowed(path: str) -> Path:
    """Ensure path is within allow-list"""
    resolved = Path(path).resolve()
    for root in ALLOWED_ROOTS:
        if str(resolved).startswith(str(Path(root).resolve())):
            return resolved
    raise ValueError(f"Path blocked: {resolved}")

@mcp.tool()
def list_directory(path: str) -> dict:
    """List files and folders in a directory"""
    resolved = assert_allowed(path)
    items = []
    for item in resolved.iterdir():
        items.append({
            "name": item.name,
            "type": "dir" if item.is_dir() else "file",
            "size": item.stat().st_size if item.is_file() else 0
        })
    return {"items": items}

@mcp.tool()
def read_file(path: str, max_bytes: int = 1_000_000) -> dict:
    """Read text content from a file"""
    resolved = assert_allowed(path)
    with open(resolved, 'rb') as f:
        content = f.read(max_bytes).decode('utf-8', errors='ignore')
    return {
        "content": content,
        "size": resolved.stat().st_size,
        "truncated": resolved.stat().st_size > max_bytes
    }

@mcp.tool()
def write_file(path: str, content: str, mode: str = "write") -> dict:
    """Write content to a file"""
    resolved = assert_allowed(path)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    
    flag = 'a' if mode == 'append' else 'w'
    with open(resolved, flag, encoding='utf-8') as f:
        f.write(content)
    
    return {
        "ok": True,
        "bytes_written": len(content.encode('utf-8')),
        "path": str(resolved)
    }

@mcp.tool()
def get_system_info() -> dict:
    """Get system information"""
    import platform
    return {
        "os": platform.system(),
        "release": platform.release(),
        "machine": platform.machine(),
        "python": platform.python_version()
    }

if __name__ == "__main__":
    mcp.run()
```

### MCP Server Registry (Settings UI)
```typescript
// apps/renderer/components/MCPServers.tsx
export function MCPServersPanel() {
  const [servers, setServers] = useStore(state => [
    state.settings.mcp.servers,
    state.updateMCPServers
  ]);
  
  const addServer = () => {
    const newServer: MCPServerConfig = {
      name: `server-${Date.now()}`,
      command: ['python', 'mcp/localops_server.py'],
      enabled: true
    };
    setServers([...servers, newServer]);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">MCP Servers</h3>
        <button onClick={addServer} className="btn-primary">
          + Add Server
        </button>
      </div>
      
      {servers.map((server, i) => (
        <div key={i} className="border rounded p-4">
          <div className="flex justify-between">
            <input
              value={server.name}
              onChange={e => updateServer(i, { name: e.target.value })}
              className="input"
            />
            <Switch
              checked={server.enabled}
              onChange={enabled => updateServer(i, { enabled })}
            />
          </div>
          
          <div className="mt-2">
            {server.command ? (
              <input
                value={server.command.join(' ')}
                onChange={e => updateServer(i, {
                  command: e.target.value.split(' ')
                })}
                className="input w-full"
                placeholder="python mcp/server.py"
              />
            ) : (
              <input
                value={server.url}
                onChange={e => updateServer(i, { url: e.target.value })}
                className="input w-full"
                placeholder="http://localhost:8000/sse"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 Audit & Logging

### Audit Log (JSONL)
```typescript
// packages/common/audit.ts
import fs from 'node:fs';
import { createHash } from 'node:crypto';

export interface AuditEntry {
  timestamp: string;
  userId?: string;
  taskId: string;
  planId: string;
  stepId: string;
  tool: string;
  argsHash: string; // SHA256 of JSON args
  resultMeta: {
    success: boolean;
    durationMs: number;
    tokensUsed?: number;
    provider?: string;
  };
  error?: string;
}

export class AuditLogger {
  constructor(private logPath: string) {}
  
  log(entry: Omit<AuditEntry, 'timestamp'>): void {
    const full: AuditEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    
    const line = JSON.stringify(full) + '\n';
    fs.appendFileSync(this.logPath, line);
  }
  
  hashArgs(args: Record<string, unknown>): string {
    const json = JSON.stringify(args, null, 0);
    return createHash('sha256').update(json).digest('hex');
  }
  
  async query(filter: {
    startDate?: Date;
    endDate?: Date;
    tool?: string;
    success?: boolean;
  }): Promise<AuditEntry[]> {
    const lines = fs.readFileSync(this.logPath, 'utf-8').split('\n');
    const entries = lines
      .filter(Boolean)
      .map(line => JSON.parse(line) as AuditEntry);
    
    return entries.filter(e => {
      if (filter.startDate && new Date(e.timestamp) < filter.startDate) return false;
      if (filter.endDate && new Date(e.timestamp) > filter.endDate) return false;
      if (filter.tool && e.tool !== filter.tool) return false;
      if (filter.success !== undefined && e.resultMeta.success !== filter.success) return false;
      return true;
    });
  }
}
```

### Structured Logging
```typescript
// packages/common/logger.ts
import pino from 'pino';
import { app } from 'electron';
import path from 'node:path';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: {
          destination: path.join(app.getPath('logs'), 'app.log'),
          mkdir: true
        }
      },
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    ]
  }
});
```

---

## 🗂️ Repository Structure

```
desktop-agent/
├─ apps/
│  ├─ main/                     # Electron main process
│  │  ├─ index.ts               # Entry point
│  │  ├─ windows/               # Window management
│  │  │  ├─ bubble.ts
│  │  │  ├─ panel.ts
│  │  │  └─ settings.ts
│  │  ├─ ipc/                   # IPC handlers
│  │  │  ├─ agent.ts
│  │  │  ├─ tools.ts
│  │  │  └─ settings.ts
│  │  ├─ tray.ts                # System tray
│  │  ├─ hotkeys.ts             # Global shortcuts
│  │  └─ updater.ts             # Auto-update
│  │
│  ├─ preload/                  # Secure bridge
│  │  ├─ index.ts
│  │  └─ types.ts
│  │
│  └─ renderer/                 # React UI
│     ├─ index.tsx
│     ├─ App.tsx
│     ├─ components/
│     │  ├─ Bubble.tsx
│     │  ├─ ChatPanel.tsx
│     │  ├─ Settings.tsx
│     │  ├─ PlanViewer.tsx
│     │  ├─ ToolCallCard.tsx
│     │  └─ BudgetMeter.tsx
│     ├─ stores/
│     │  ├─ chat.ts             # Zustand store
│     │  └─ settings.ts
│     └─ styles/
│        └─ globals.css
│
├─ packages/
│  ├─ agent/                    # Agent core
│  │  ├─ planner.ts
│  │  ├─ orchestrator.ts
│  │  ├─ tool-router.ts
│  │  └─ models/
│  │     ├─ base.ts
│  │     ├─ ollama.ts
│  │     ├─ openai.ts
│  │     └─ anthropic.ts
│  │
│  ├─ tools-node/               # Native tools
│  │  ├─ fs.ts
│  │  ├─ command.ts
│  │  ├─ browser.ts
│  │  ├─ clipboard.ts
│  │  ├─ scheduler.ts
│  │  └─ window.ts (Windows-specific)
│  │
│  ├─ mcp-client/               # MCP integration
│  │  ├─ client.ts
│  │  ├─ registry.ts
│  │  └─ types.ts
│  │
│  └─ common/                   # Shared code
│     ├─ schemas.ts             # Zod schemas
│     ├─ types.ts
│     ├─ security.ts            # Allow-lists
│     ├─ logger.ts              # Pino logger
│     ├─ audit.ts               # Audit log
│     ├─ db.ts                  # SQLite wrapper
│     └─ utils.ts
│
├─ mcp/                         # Example MCP servers
│  ├─ localops_server.py        # FS + OS tools
│  ├─ browser_server.py         # Playwright tools
│  └─ requirements.txt
│
├─ resources/                   # Assets
│  ├─ icons/
│  │  ├─ icon.png
│  │  ├─ icon.ico
│  │  └─ tray.png
│  └─ installer/
│     ├─ background.png
│     └─ license.txt
│
├─ tests/
│  ├─ unit/
│  │  ├─ security.test.ts
│  │  ├─ planner.test.ts
│  │  └─ tools.test.ts
│  └─ e2e/
│     └─ smoke.spec.ts
│
├─ scripts/
│  ├─ postinstall.js            # Playwright setup
│  └─ build.js
│
├─ electron-builder.json        # Packaging config
├─ tsconfig.json
├─ vite.config.ts
├─ package.json
├─ .env.example
└─ README.md
```

---

## 📦 package.json

```json
{
  "name": "desktop-agent",
  "version": "1.0.0",
  "description": "Local-first AI desktop agent",
  "author": "Your Name",
  "license": "MIT",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"electron .\"",
    "build": "tsc && vite build",
    "package": "electron-builder",
    "package:win": "electron-builder --win",
    "package:mac": "electron-builder --mac",
    "package:linux": "electron-builder --linux",
    "postinstall": "node scripts/postinstall.js",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "@modelcontextprotocol/sdk": "^0.6.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@tanstack/react-query": "^5.59.0",
    "better-sqlite3": "^11.7.0",
    "clipboardy": "^4.0.0",
    "cron": "^3.1.7",
    "electron-auto-launch": "^5.0.5",
    "electron-updater": "^6.3.9",
    "keytar": "^7.9.0",
    "openai": "^4.73.0",
    "pino": "^9.5.0",
    "playwright": "^1.49.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.23.8",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^22.9.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "concurrently": "^9.1.0",
    "electron": "^32.2.6",
    "electron-builder": "^25.1.8",
    "eslint": "^9.14.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.5"
  },
  "build": {
    "appId": "com.yourcompany.desktop-agent",
    "productName": "Desktop Agent",
    "directories": {
      "output": "dist-installer"
    },
    "files": [
      "dist/**/*",
      "package.json"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "resources/icons/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "mac": {
      "target": ["dmg"],
      "icon": "resources/icons/icon.icns"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "resources/icons/icon.png"
    }
  }
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Get bubble UI + basic chat working with Ollama

- [ ] Electron scaffold (main + preload + renderer)
- [ ] Secure IPC bridge with Zod validation
- [ ] Bubble window (64px, always-on-top)
- [ ] Chat panel (expandable, message history)
- [ ] Global hotkey (Ctrl+Shift+Space)
- [ ] System tray menu
- [ ] Settings modal (basic)
- [ ] SQLite persistence (settings only)
- [ ] Ollama client (streaming chat)
- [ ] Basic logger (pino)

**Deliverable**: Chat with Ollama locally

---

### Phase 2: Agent Core (Week 2)
**Goal**: Plan → Execute → Reflect loop

- [ ] Planner (intent → tool plan)
- [ ] Tool router (dispatch to handlers)
- [ ] Plan validation (schema + dependency check)
- [ ] Approval flow UI (sensitive steps)
- [ ] Execution loop with progress streaming
- [ ] Reflection + summary generation
- [ ] Budget enforcement (tokens, time, tool calls)
- [ ] Budget meter UI

**Deliverable**: Agent can create + execute multi-step plans

---

### Phase 3: Tools (Week 3)
**Goal**: Core capabilities

- [ ] Filesystem tools (list/read/write/search)
- [ ] Allow-list enforcement
- [ ] Command runner (with safeguards)
- [ ] Browser automation (Playwright)
- [ ] Domain allow-list
- [ ] Clipboard tools
- [ ] Scheduler (cron)
- [ ] Approval gates for sensitive ops
- [ ] Tool call preview cards in UI

**Deliverable**: Agent can read files, run commands, automate browser

---

### Phase 4: Multi-Provider (Week 4)
**Goal**: OpenAI + Claude fallback

- [ ] OpenAI client (streaming + tools)
- [ ] Anthropic client (streaming + tools)
- [ ] Auto-fallback orchestrator
- [ ] Confidence scoring
- [ ] Provider selection UI
- [ ] Secret storage (Keytar)
- [ ] Rate limiting
- [ ] Cost tracking

**Deliverable**: Agent escalates to cloud when needed

---

### Phase 5: MCP Integration (Week 5)
**Goal**: External tool extensibility

- [ ] MCP client wrapper
- [ ] Server registry (settings UI)
- [ ] Connect to stdio servers
- [ ] List tools from servers
- [ ] Call tools via MCP
- [ ] Example server: localops (Python)
- [ ] Example server: browser (Python)
- [ ] Hot-reload servers

**Deliverable**: Agent can use external MCP tools

---

### Phase 6: Audit & Testing (Week 6)
**Goal**: Production-ready

- [ ] Audit log (JSONL with hashed args)
- [ ] Query audit log UI
- [ ] Unit tests (Vitest)
- [ ] E2E tests (Playwright)
- [ ] Error boundaries in UI
- [ ] Toast notifications
- [ ] Auto-update (electron-updater)
- [ ] Windows installer (NSIS)
- [ ] Docs (README + user guide)

**Deliverable**: Shippable v1.0

---

## ✅ Acceptance Criteria

### Must-Have (P0)
- ✅ Bubble renders bottom-right, always-on-top
- ✅ Hotkey (Ctrl+Shift+Space) toggles panel
- ✅ Settings persist across sessions
- ✅ Ollama is default provider (http://localhost:11434)
- ✅ OpenAI + Claude selectable with API keys
- ✅ FS tools enforce allow-list (read/write/delete)
- ✅ Write/delete prompt for approval
- ✅ Browser tools work (open/fill/click/text)
- ✅ Form submit prompts for approval
- ✅ Command runner has timeout + confirmation
- ✅ Plans show preview with Approve/Cancel
- ✅ Audit log records tool calls + results
- ✅ `npm install && npm run dev` → see bubble
- ✅ `npm run package:win` → creates installer

### Nice-to-Have (P1)
- ✅ Auto-fallback works (Ollama → OpenAI → Claude)
- ✅ Confidence scoring influences provider choice
- ✅ MCP servers connect and provide tools
- ✅ Budget meter shows tokens/cost/time
- ✅ Plan visualization (graph or list)
- ✅ Clipboard tools (get/set with approval)
- ✅ Scheduler (cron jobs)
- ✅ System tray menu
- ✅ Desktop notifications

### Stretch (P2)
- Voice I/O (Whisper + TTS)
- Self-bootstrapping (generate MCP tools)
- Policy engine (declarative rules)
- Skill marketplace
- Regression evals

---

## 🔥 Key Code Snippets

### 1. Secure Preload Bridge
```typescript
// apps/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Agent
  sendMessage: (text: string) => ipcRenderer.invoke('agent:send', text),
  onMessage: (cb: (data: any) => void) =>
    ipcRenderer.on('agent:message', (_, data) => cb(data)),
  
  // Tools
  invokeTool: (tool: string, args: any) =>
    ipcRenderer.invoke('tools:invoke', { tool, args }),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (patch: any) => ipcRenderer.invoke('settings:update', patch),
  
  // System
  quit: () => ipcRenderer.invoke('app:quit'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  togglePanel: () => ipcRenderer.invoke('window:toggle-panel')
};

contextBridge.exposeInMainWorld('agent', api);

export type AgentAPI = typeof api;
```

### 2. IPC Handlers with Zod
```typescript
// apps/main/ipc/agent.ts
import { ipcMain } from 'electron';
import { z } from 'zod';
import { planner } from '@/agent/planner';

const SendMessageSchema = z.object({
  text: z.string().min(1)
});

ipcMain.handle('agent:send', async (event, payload) => {
  const { text } = SendMessageSchema.parse(payload);
  
  try {
    const plan = await planner.createPlan(text, getContext());
    
    // Send plan to renderer
    event.sender.send('agent:message', {
      type: 'plan',
      data: plan
    });
    
    // Execute (if approved)
    // ...
    
  } catch (error) {
    event.sender.send('agent:message', {
      type: 'error',
      error: error.message
    });
  }
});
```

### 3. React Chat Panel
```typescript
// apps/renderer/components/ChatPanel.tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

export function ChatPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      await window.agent.sendMessage(text);
    },
    onSuccess: () => {
      setInput('');
    }
  });
  
  // Listen for agent messages
  useEffect(() => {
    const handler = (data: any) => {
      setMessages(prev => [...prev, data]);
    };
    window.agent.onMessage(handler);
  }, []);
  
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Agent</h2>
        <button onClick={() => window.agent.togglePanel()}>×</button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.type === 'plan' && <PlanCard plan={msg.data} />}
            {msg.type === 'tool' && <ToolCallCard tool={msg.data} />}
            {msg.type === 'error' && <ErrorCard error={msg.error} />}
          </div>
        ))}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.ctrlKey) {
              sendMessage.mutate(input);
            }
          }}
          placeholder="Type a command... (Ctrl+Enter)"
          className="w-full px-4 py-2 bg-gray-800 rounded"
        />
      </div>
    </div>
  );
}
```

---

## 📚 README Template

```markdown
# Desktop Agent

A local-first AI assistant that lives on your desktop. Control your computer with natural language.

## Features

- 🤖 **Local AI** — Runs Llama via Ollama (private, fast, free)
- ☁️ **Cloud Fallback** — Escalates to OpenAI/Claude for complex tasks
- 📁 **File Tools** — Read, write, search with allow-list security
- 🌐 **Browser Automation** — Fill forms, click buttons, extract text
- ⌨️ **Command Runner** — Execute shell commands safely
- 📋 **Clipboard** — Read/write with approval
- ⏰ **Scheduler** — Run tasks on cron schedules
- 🔌 **MCP Support** — Extend with custom tools
- 🔒 **Security First** — Sandboxed, validated, logged

## Quick Start

### Prerequisites
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1

# Install Node.js 20+
# (via nvm, fnm, or nodejs.org)
```

### Installation
```bash
git clone https://github.com/yourname/desktop-agent
cd desktop-agent
npm install
npx playwright install chromium
```

### Development
```bash
npm run dev
# Press Ctrl+Shift+Space to open chat
```

### Build Installer
```bash
npm run package:win   # Windows
npm run package:mac   # macOS
npm run package:linux # Linux
```

## Configuration

### Default Allow-List
Create this folder (or customize in Settings):
```
C:\Users\<USER>\AgentWorkspace
```

### API Keys (Optional)
In Settings → Providers:
- **OpenAI**: Enter API key for fallback
- **Claude**: Enter API key for final fallback

### MCP Servers
In Settings → MCP Servers, add:
```
Name: localops
Command: python mcp/localops_server.py
```

## Usage Examples

### File Operations
```
"Read the first 5 lines of README.md"
"Create a file called notes.txt with my meeting agenda"
"Search for TODO comments in my project"
```

### Browser Automation
```
"Open example.com and take a screenshot"
"Fill out the contact form with my details"
"Extract all links from the homepage"
```

### Command Runner
```
"Run git status in my project folder"
"Install dependencies with npm install"
"Build the project"
```

### Scheduler
```
"Every day at 9am, remind me to check emails"
"Run my backup script every Sunday"
```

## Architecture

```
Bubble (Always-On-Top)
  ↓
Panel (Chat UI)
  ↓
Planner (Intent → Plan)
  ↓
Tool Router
  ├─ Filesystem (allow-list)
  ├─ Browser (Playwright)
  ├─ Command (timeout + safeguards)
  ├─ Clipboard (approval)
  ├─ Scheduler (cron)
  └─ MCP Servers (external)
  ↓
Executor (with approval gates)
  ↓
Audit Log (JSONL)
```

## Security

- **Sandboxed**: Renderer has no Node.js access
- **Validated**: All IPC payloads use Zod schemas
- **Allow-Lists**: Paths and domains are pre-approved
- **Approvals**: Sensitive ops require user confirmation
- **Audit Log**: Every action is logged with hashed args
- **Secrets**: API keys stored in OS keychain

## Contributing

PRs welcome! Please:
1. Add tests for new features
2. Follow TypeScript strict mode
3. Use Zod for validation
4. Update docs

## License

MIT
```

---

## 🎯 Final Checklist

Before shipping v1.0:

### Code
- [ ] All Zod schemas defined
- [ ] IPC handlers validate inputs
- [ ] Allow-lists enforced everywhere
- [ ] Approval gates work for sensitive ops
- [ ] Audit log writes on every tool call
- [ ] Error boundaries in React
- [ ] Toast notifications on completion
- [ ] Auto-update configured

### Testing
- [ ] Unit tests pass (Vitest)
- [ ] E2E smoke test passes (Playwright)
- [ ] Manual QA on Windows
- [ ] Memory leak check (long-running)
- [ ] Security audit (npm audit)

### Docs
- [ ] README with quick start
- [ ] User guide (basic operations)
- [ ] MCP server examples documented
- [ ] API keys setup guide
- [ ] Troubleshooting section

### Packaging
- [ ] Windows installer builds
- [ ] Desktop shortcut created
- [ ] Autostart option works
- [ ] Uninstaller works cleanly
- [ ] Version number in About dialog

---

## 🚢 Ready to Build!

This prompt gives Cursor a complete blueprint to build your local desktop AI agent. It includes:

1. **Clear architecture** with modern stack
2. **Security-first** approach (sandboxing, validation, allow-lists)
3. **Phase-by-phase** implementation guide
4. **Real code examples** for every component
5. **Practical acceptance criteria**
6. **Production-ready** packaging and logging

Start with Phase 1 and iterate. Good luck! 🎉
