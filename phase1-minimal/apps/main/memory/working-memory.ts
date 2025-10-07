/**
 * Working Memory
 * Manages facts, files, URLs and other contextual information during a conversation
 */

export interface FileMemory {
  path: string;
  content?: string;
  lastRead: number;
  size?: number;
  modified?: number;
}

export interface URLMemory {
  url: string;
  title?: string;
  visitedAt: number;
  extractedText?: string;
}

export interface Fact {
  key: string;
  value: any;
  timestamp: number;
  source?: string;
}

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  result?: any;
}

/**
 * Manages working memory for the current session
 */
export class WorkingMemory {
  private facts: Map<string, Fact> = new Map();
  private files: Map<string, FileMemory> = new Map();
  private urls: Map<string, URLMemory> = new Map();
  private tasks: Map<string, Task> = new Map();
  private notes: string[] = [];

  /**
   * Remember a fact
   */
  rememberFact(key: string, value: any, source?: string): void {
    this.facts.set(key, {
      key,
      value,
      timestamp: Date.now(),
      source
    });
  }

  /**
   * Get a fact by key
   */
  getFact(key: string): any | undefined {
    return this.facts.get(key)?.value;
  }

  /**
   * Check if a fact exists
   */
  hasFact(key: string): boolean {
    return this.facts.has(key);
  }

  /**
   * Get all facts
   */
  getAllFacts(): Record<string, any> {
    const result: Record<string, any> = {};
    this.facts.forEach((fact, key) => {
      result[key] = fact.value;
    });
    return result;
  }

  /**
   * Remove a fact
   */
  forgetFact(key: string): void {
    this.facts.delete(key);
  }

  /**
   * Remember a file
   */
  rememberFile(path: string, content?: string, metadata?: Partial<FileMemory>): void {
    this.files.set(path, {
      path,
      content,
      lastRead: Date.now(),
      ...metadata
    });
  }

  /**
   * Get file memory
   */
  getFile(path: string): FileMemory | undefined {
    return this.files.get(path);
  }

  /**
   * Get all remembered files
   */
  getAllFiles(): FileMemory[] {
    return Array.from(this.files.values());
  }

  /**
   * Forget a file
   */
  forgetFile(path: string): void {
    this.files.delete(path);
  }

  /**
   * Remember a URL visit
   */
  rememberURL(url: string, metadata?: Partial<URLMemory>): void {
    this.urls.set(url, {
      url,
      visitedAt: Date.now(),
      ...metadata
    });
  }

  /**
   * Get URL memory
   */
  getURL(url: string): URLMemory | undefined {
    return this.urls.get(url);
  }

  /**
   * Get all remembered URLs
   */
  getAllURLs(): URLMemory[] {
    return Array.from(this.urls.values());
  }

  /**
   * Forget a URL
   */
  forgetURL(url: string): void {
    this.urls.delete(url);
  }

  /**
   * Add a task
   */
  addTask(description: string, id?: string): Task {
    const taskId = id || `task_${Date.now()}`;
    const task: Task = {
      id: taskId,
      description,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.tasks.set(taskId, task);
    return task;
  }

  /**
   * Update task status
   */
  updateTask(id: string, updates: Partial<Task>): void {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates, { updatedAt: Date.now() });
    }
  }

  /**
   * Get a task
   */
  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: Task['status']): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  /**
   * Add a note
   */
  addNote(note: string): void {
    this.notes.push(note);
  }

  /**
   * Get all notes
   */
  getNotes(): string[] {
    return [...this.notes];
  }

  /**
   * Get context summary for LLM
   */
  getContext(): string {
    const parts: string[] = [];

    // Facts
    if (this.facts.size > 0) {
      const factsObj = this.getAllFacts();
      parts.push(`Known facts: ${JSON.stringify(factsObj, null, 2)}`);
    }

    // Files
    if (this.files.size > 0) {
      const filePaths = Array.from(this.files.keys());
      parts.push(`Working with files: ${filePaths.join(', ')}`);
    }

    // URLs
    if (this.urls.size > 0) {
      const recentUrls = Array.from(this.urls.values())
        .sort((a, b) => b.visitedAt - a.visitedAt)
        .slice(0, 5)
        .map(u => `${u.url}${u.title ? ` (${u.title})` : ''}`);
      parts.push(`Recent URLs: ${recentUrls.join(', ')}`);
    }

    // Tasks
    const pendingTasks = this.getTasksByStatus('pending');
    const inProgressTasks = this.getTasksByStatus('in_progress');
    if (pendingTasks.length > 0 || inProgressTasks.length > 0) {
      parts.push(
        `Tasks: ${inProgressTasks.length} in progress, ${pendingTasks.length} pending`
      );
    }

    // Notes
    if (this.notes.length > 0) {
      parts.push(`Notes: ${this.notes.slice(-3).join('; ')}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Get detailed context for LLM (more verbose)
   */
  getDetailedContext(): string {
    const parts: string[] = ['=== Working Memory ==='];

    // Facts
    if (this.facts.size > 0) {
      parts.push('\n## Known Facts:');
      this.facts.forEach((fact) => {
        parts.push(`- ${fact.key}: ${JSON.stringify(fact.value)}`);
      });
    }

    // Files
    if (this.files.size > 0) {
      parts.push('\n## Files:');
      this.files.forEach((file) => {
        parts.push(`- ${file.path} (${file.size || 'unknown size'})`);
      });
    }

    // URLs
    if (this.urls.size > 0) {
      parts.push('\n## URLs Visited:');
      Array.from(this.urls.values())
        .sort((a, b) => b.visitedAt - a.visitedAt)
        .forEach((url) => {
          parts.push(`- ${url.url}${url.title ? ` - ${url.title}` : ''}`);
        });
    }

    // Tasks
    const allTasks = this.getAllTasks();
    if (allTasks.length > 0) {
      parts.push('\n## Tasks:');
      allTasks.forEach((task) => {
        parts.push(`- [${task.status}] ${task.description}`);
      });
    }

    // Notes
    if (this.notes.length > 0) {
      parts.push('\n## Notes:');
      this.notes.forEach((note) => {
        parts.push(`- ${note}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Clear all working memory
   */
  clear(): void {
    this.facts.clear();
    this.files.clear();
    this.urls.clear();
    this.tasks.clear();
    this.notes = [];
  }

  /**
   * Get statistics
   */
  getStats(): {
    facts: number;
    files: number;
    urls: number;
    tasks: number;
    notes: number;
  } {
    return {
      facts: this.facts.size,
      files: this.files.size,
      urls: this.urls.size,
      tasks: this.tasks.size,
      notes: this.notes.length
    };
  }

  /**
   * Export to JSON
   */
  export(): string {
    return JSON.stringify({
      facts: Array.from(this.facts.entries()),
      files: Array.from(this.files.entries()),
      urls: Array.from(this.urls.entries()),
      tasks: Array.from(this.tasks.entries()),
      notes: this.notes
    }, null, 2);
  }

  /**
   * Import from JSON
   */
  import(data: string): void {
    const parsed = JSON.parse(data);
    this.facts = new Map(parsed.facts);
    this.files = new Map(parsed.files);
    this.urls = new Map(parsed.urls);
    this.tasks = new Map(parsed.tasks);
    this.notes = parsed.notes;
  }
}

/**
 * Global working memory instance
 */
let globalMemory: WorkingMemory | null = null;

export function getGlobalWorkingMemory(): WorkingMemory {
  if (!globalMemory) {
    globalMemory = new WorkingMemory();
  }
  return globalMemory;
}

export function resetGlobalWorkingMemory(): void {
  globalMemory = new WorkingMemory();
}

