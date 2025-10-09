import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { ApplicationLauncher } from './application-launcher';

export interface CodeWritingProgress {
  phase: 'creating' | 'writing' | 'complete';
  file: string;
  linesWritten: number;
  totalLines: number;
  currentLine: string;
  percentComplete: number;
}

/**
 * Writes code to files gradually to create "live coding" effect
 * 
 * WORKFLOW:
 * 1. VSCode opens with empty project folder
 * 2. LiveCodeWriter creates files one by one
 * 3. Important files are opened in VSCode editor
 * 4. File content is written line-by-line for visual effect
 * 5. Each file is verified after writing
 * 
 * FILE TYPES:
 * - Important files (openInEditor: true): Written slowly, opened in editor
 * - Config files (openInEditor: false): Written quickly, not opened
 */
export class LiveCodeWriter extends EventEmitter {
  private appLauncher: ApplicationLauncher;
  private writingSpeed: number = 50; // milliseconds per line
  
  constructor() {
    super();
    this.appLauncher = new ApplicationLauncher();
  }
  
  /**
   * Open VSCode and write code gradually
   */
  async writeProjectLive(
    projectPath: string,
    files: Array<{ path: string; content: string; openInEditor?: boolean }>
  ): Promise<void> {
    console.log('[LiveCodeWriter] Starting live code writing session');
    console.log('[LiveCodeWriter] Project:', projectPath);
    console.log('[LiveCodeWriter] Files:', files.length);
    
    // Step 1: Open VSCode with empty project folder
    await this.appLauncher.openVSCodeWithShortcut(projectPath);
    
    this.emit('status', {
      message: '✓ VSCode opened',
      phase: 'setup'
    });
    
    await this.wait(2000);
    
    // Step 2: Write files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      console.log(`[LiveCodeWriter] Writing file ${i + 1}/${files.length}: ${file.path}`);
      
      this.emit('status', {
        message: `Creating ${file.path}...`,
        phase: 'creating',
        current: i + 1,
        total: files.length
      });
      
      await this.writeFileLive(projectPath, file.path, file.content, file.openInEditor);
      
      // Pause between files so user can see
      await this.wait(500);
    }
    
    this.emit('status', {
      message: '✓ All files written',
      phase: 'complete'
    });
    
    console.log('[LiveCodeWriter] ✓ Live code writing complete');
  }
  
  /**
   * Write a single file gradually (line by line)
   */
  private async writeFileLive(
    projectPath: string,
    filePath: string,
    content: string,
    openInEditor: boolean = false
  ): Promise<void> {
    const fullPath = path.join(projectPath, filePath);
    const dir = path.dirname(fullPath);
    
    console.log(`[LiveCodeWriter] Starting to write: ${filePath}`);
    console.log(`[LiveCodeWriter] Full path: ${fullPath}`);
    console.log(`[LiveCodeWriter] Open in editor: ${openInEditor}`);
    
    // Create directory
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[LiveCodeWriter] Created directory: ${dir}`);
    }
    
    // Split content into lines
    const lines = content.split('\n');
    const totalLines = lines.length;
    
    console.log(`[LiveCodeWriter] File has ${totalLines} lines`);
    
    // Create empty file first
    try {
      fs.writeFileSync(fullPath, '', 'utf-8');
      console.log(`[LiveCodeWriter] Created empty file: ${filePath}`);
    } catch (error) {
      console.error(`[LiveCodeWriter] Failed to create file: ${filePath}`, error);
      throw error;
    }
    
    // Open file in VSCode if requested (important files)
    if (openInEditor) {
      console.log(`[LiveCodeWriter] Opening file in VSCode: ${filePath}`);
      await this.appLauncher.openAndRevealFile(fullPath);
      await this.wait(1500); // Wait for VSCode to open the file
    }
    
    // Write lines gradually for visual effect
    let writtenContent = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      writtenContent += line + (i < lines.length - 1 ? '\n' : '');
      
      // Write to file
      try {
        fs.writeFileSync(fullPath, writtenContent, 'utf-8');
      } catch (error) {
        console.error(`[LiveCodeWriter] Failed to write line ${i + 1} to ${filePath}`, error);
        throw error;
      }
      
      // Emit progress
      const progress: CodeWritingProgress = {
        phase: 'writing',
        file: filePath,
        linesWritten: i + 1,
        totalLines,
        currentLine: line.trim().substring(0, 60) + '...',
        percentComplete: Math.round(((i + 1) / totalLines) * 100)
      };
      
      this.emit('progress', progress);
      
      // Determine speed based on line complexity
      const lineLength = line.length;
      let delay = this.writingSpeed;
      
      // Faster for empty lines or short lines
      if (lineLength === 0) {
        delay = 10;
      } else if (lineLength < 20) {
        delay = 30;
      } else if (lineLength > 100) {
        delay = 80; // Slower for complex lines
      }
      
      await this.wait(delay);
    }
    
    // Verify file was written successfully
    if (fs.existsSync(fullPath)) {
      const fileSize = fs.statSync(fullPath).size;
      console.log(`[LiveCodeWriter] ✓ File written successfully: ${filePath} (${fileSize} bytes)`);
    } else {
      console.error(`[LiveCodeWriter] ✗ File not found after writing: ${filePath}`);
    }
  }
  
  /**
   * Write important files slower for visibility
   */
  async writeImportantFilesWithPause(
    projectPath: string,
    files: Array<{ path: string; content: string; important: boolean }>
  ): Promise<void> {
    console.log(`[LiveCodeWriter] Writing ${files.length} files to project...`);
    
    let importantCount = 0;
    let regularCount = 0;
    
    for (const file of files) {
      if (file.important) {
        importantCount++;
        console.log(`[LiveCodeWriter] Writing important file [${importantCount}]: ${file.path}`);
        
        // Write slowly and open in editor
        this.writingSpeed = 80;
        await this.writeFileLive(projectPath, file.path, file.content, true);
        
        console.log(`[LiveCodeWriter] ✓ Important file written and opened: ${file.path}`);
        
        // Longer pause after important files for visibility
        await this.wait(2000);
      } else {
        regularCount++;
        console.log(`[LiveCodeWriter] Writing config file [${regularCount}]: ${file.path}`);
        
        // Write faster for config files
        this.writingSpeed = 30;
        await this.writeFileLive(projectPath, file.path, file.content, false);
        
        console.log(`[LiveCodeWriter] ✓ Config file written: ${file.path}`);
      }
    }
    
    console.log(`[LiveCodeWriter] ✓ Completed writing all files (${importantCount} important, ${regularCount} config)`);
  }
  
  /**
   * Set writing speed
   */
  setSpeed(speedMs: number): void {
    this.writingSpeed = speedMs;
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

