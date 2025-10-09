import { ApplicationLauncher } from './application-launcher';
import { ProjectScaffold, VisualBuildProgress, DesktopAction } from './types';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { LiveCodeWriter, CodeWritingProgress } from './live-code-writer';

export class VisualProjectBuilder extends EventEmitter {
  private appLauncher: ApplicationLauncher;
  private liveCodeWriter: LiveCodeWriter;
  private currentProgress: VisualBuildProgress;
  
  constructor() {
    super();
    this.appLauncher = new ApplicationLauncher();
    this.liveCodeWriter = new LiveCodeWriter();
    
    // Forward live code writer events
    this.liveCodeWriter.on('progress', (progress: CodeWritingProgress) => {
      this.emit('code-writing-progress', progress);
    });
    
    this.liveCodeWriter.on('status', (status) => {
      this.emit('code-writing-status', status);
    });
    
    this.currentProgress = {
      phase: 'setup',
      currentAction: '',
      completedActions: [],
      totalActions: 0,
      visibleWindows: []
    };
  }
  
  async buildProjectVisually(scaffold: ProjectScaffold): Promise<void> {
    try {
      // Validate path before starting
      console.log('[VisualBuilder] Starting build for:', scaffold.name);
      console.log('[VisualBuilder] Target directory:', scaffold.directory);
      
      // Check for OneDrive
      if (scaffold.directory.toLowerCase().includes('onedrive')) {
        const error = 'Cannot build projects in OneDrive folders due to sync issues. Using Desktop instead.';
        console.warn('[VisualBuilder]', error);
        
        // Automatically fix the path
        const os = require('os');
        const path = require('path');
        scaffold.directory = path.join(os.homedir(), 'Desktop', 'AI-Projects', scaffold.name);
        
        console.log('[VisualBuilder] Using alternative path:', scaffold.directory);
      }
      
      this.emitProgress({
        phase: 'setup',
        currentAction: 'Preparing workspace...',
        completedActions: [],
        totalActions: this.calculateTotalActions(scaffold),
        visibleWindows: []
      });
      
      await this.createProjectDirectory(scaffold);
      await this.openProjectInVSCode(scaffold);
      await this.createProjectFiles(scaffold);
      await this.runProjectCommands(scaffold);
      await this.executeFinalActions(scaffold);
      
      this.emitProgress({
        phase: 'complete',
        currentAction: 'Project built successfully!',
        completedActions: this.currentProgress.completedActions,
        totalActions: this.currentProgress.totalActions,
        visibleWindows: this.currentProgress.visibleWindows
      });
      
      this.emit('build-complete', { scaffold });
      
    } catch (error) {
      this.emit('build-error', { error: (error as Error).message, scaffold });
      throw error;
    }
  }
  
  private calculateTotalActions(scaffold: ProjectScaffold): number {
    return 1 + 1 + scaffold.files.length + scaffold.commands.length + scaffold.finalActions.length;
  }
  
  private async createProjectDirectory(scaffold: ProjectScaffold): Promise<void> {
    this.emitProgress({
      ...this.currentProgress,
      phase: 'setup',
      currentAction: 'Creating project directory...'
    });
    
    try {
      console.log('[VisualBuilder] Creating directory:', scaffold.directory);
      
      // Ensure directory doesn't contain OneDrive
      if (scaffold.directory.toLowerCase().includes('onedrive')) {
        throw new Error('Cannot create projects in OneDrive folders. Please use a local directory.');
      }
      
      // Create directory with error handling
      if (!fs.existsSync(scaffold.directory)) {
        fs.mkdirSync(scaffold.directory, { recursive: true });
        console.log('[VisualBuilder] Directory created successfully');
      } else {
        console.log('[VisualBuilder] Directory already exists');
      }
      
      // Verify we can write to the directory
      const testFile = path.join(scaffold.directory, '.test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('[VisualBuilder] Directory is writable');
      
      // Open in file explorer
      await this.appLauncher.openFileExplorer(scaffold.directory);
      
      this.currentProgress.completedActions.push('Created project directory');
      this.currentProgress.visibleWindows.push('File Explorer');
      
      await this.wait(1000);
      
    } catch (error) {
      console.error('[VisualBuilder] Failed to create directory:', error);
      throw new Error(`Failed to create project directory: ${(error as Error).message}`);
    }
  }
  
  private async openProjectInVSCode(scaffold: ProjectScaffold): Promise<void> {
    this.emitProgress({
      ...this.currentProgress,
      phase: 'scaffolding',
      currentAction: 'Opening VSCode and preparing to write code...'
    });
    
    console.log('[VisualBuilder] Opening VSCode with project folder:', scaffold.directory);
    
    // Open VSCode with empty project folder
    await this.appLauncher.openVSCodeWithShortcut(scaffold.directory);
    
    this.currentProgress.completedActions.push('Opened VSCode');
    this.currentProgress.visibleWindows.push('VSCode');
    
    console.log('[VisualBuilder] VSCode opened, waiting for initialization...');
    await this.wait(3000); // Wait for VSCode to fully load
    
    console.log('[VisualBuilder] VSCode ready, proceeding to create files...');
  }
  
  private async createProjectFiles(scaffold: ProjectScaffold): Promise<void> {
    this.emitProgress({
      ...this.currentProgress,
      phase: 'coding',
      currentAction: 'Writing code live in VSCode...'
    });
    
    console.log(`[VisualBuilder] Creating ${scaffold.files.length} files in VSCode...`);
    
    // Mark important files
    const filesWithImportance = scaffold.files.map(f => ({
      path: f.path,
      content: f.content,
      important: f.openInEditor || false
    }));
    
    console.log('[VisualBuilder] Files to create:', filesWithImportance.map(f => ({
      path: f.path,
      important: f.important,
      size: f.content.length
    })));
    
    // Use live code writer to write files gradually
    await this.liveCodeWriter.writeImportantFilesWithPause(
      scaffold.directory,
      filesWithImportance
    );
    
    console.log(`[VisualBuilder] ✓ Successfully created ${scaffold.files.length} files in VSCode`);
    this.currentProgress.completedActions.push(`Wrote ${scaffold.files.length} files live in VSCode`);
    
    // Give VSCode time to process all file changes
    await this.wait(1000);
  }

  /**
   * Extract unique folders from file paths
   */
  private extractFolders(files: Array<{ path: string }>): string[] {
    const folders = new Set<string>();
    
    files.forEach(file => {
      const parts = file.path.split('/');
      
      // Build folder path progressively
      let currentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += (currentPath ? '/' : '') + parts[i];
        folders.add(currentPath);
      }
    });
    
    return Array.from(folders).sort();
  }
  
  private async runProjectCommands(scaffold: ProjectScaffold): Promise<void> {
    if (scaffold.commands.length === 0) return;
    
    this.emitProgress({
      ...this.currentProgress,
      phase: 'installing',
      currentAction: 'Running setup commands...'
    });
    
    // Open terminal for visibility
    await this.appLauncher.openTerminalInDirectory(scaffold.directory);
    this.currentProgress.visibleWindows.push('Terminal');
    
    await this.wait(2000);
    
    for (const cmd of scaffold.commands) {
      this.emitProgress({
        ...this.currentProgress,
        currentAction: `${cmd.description || cmd.command}`
      });
      
      try {
        console.log(`[VisualBuilder] Executing: ${cmd.command}`);
        
        // Use advanced PowerShell execution
        const result = await this.appLauncher.runPowerShellCommand(
          cmd.command,
          cmd.workingDirectory || scaffold.directory,
          {
            visible: false,
            waitForCompletion: cmd.waitForCompletion !== false,
            env: cmd.env,
            timeout: 600000 // 10 minutes for long installs
          }
        );
        
        if (result.exitCode === 0) {
          console.log(`[VisualBuilder] ✓ Success: ${cmd.description}`);
          this.currentProgress.completedActions.push(`✓ ${cmd.description || cmd.command}`);
        } else {
          console.error(`[VisualBuilder] ✗ Failed with code ${result.exitCode}`);
          if (result.error) {
            console.error(`[VisualBuilder] Error: ${result.error}`);
          }
          
          if (cmd.waitForCompletion !== false) {
            throw new Error(`Command failed: ${cmd.description || cmd.command}`);
          }
        }
        
        await this.wait(1000);
        
      } catch (error) {
        console.error(`[VisualBuilder] Command error:`, error);
        
        if (cmd.waitForCompletion !== false) {
          throw error;
        } else {
          console.log(`[VisualBuilder] Continuing despite error (waitForCompletion = false)`);
        }
      }
    }
  }
  
  private async executeFinalActions(scaffold: ProjectScaffold): Promise<void> {
    if (scaffold.finalActions.length === 0) return;
    
    this.emitProgress({
      ...this.currentProgress,
      phase: 'testing',
      currentAction: 'Launching application...'
    });
    
    for (const action of scaffold.finalActions) {
      await this.executeDesktopAction(action);
      this.currentProgress.completedActions.push(action.description);
      await this.wait(action.estimatedDuration * 1000);
    }
  }
  
  private async executeDesktopAction(action: DesktopAction): Promise<void> {
    switch (action.type) {
      case 'open_url':
        await this.appLauncher.openBrowser(action.params.url);
        this.currentProgress.visibleWindows.push('Browser');
        break;
        
      case 'open_folder':
        await this.appLauncher.openFileExplorer(action.params.path);
        break;
        
      case 'run_command':
        await this.appLauncher.runCommandInVisibleTerminal(
          action.params.command,
          action.params.workingDirectory
        );
        break;
        
      case 'wait':
        await this.wait(action.params.duration * 1000);
        break;
    }
  }
  
  private emitProgress(progress: VisualBuildProgress): void {
    this.currentProgress = progress;
    this.emit('progress', progress);
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

