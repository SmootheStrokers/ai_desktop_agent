import { VisualProjectBuilder } from './visual-builder';
import { ProjectScaffold, DesktopAction } from './types';
import { ProjectAnalysis } from '../agent/project-analyzer';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { EventEmitter } from 'events';

export class DynamicProjectBuilder extends EventEmitter {
  private visualBuilder: VisualProjectBuilder;
  // Path to the local .env.local file containing API keys
  private readonly ENV_LOCAL_PATH = 'C:\\Users\\willi\\OneDrive\\Desktop\\localdev\\.env.local';
  
  constructor() {
    super();
    this.visualBuilder = new VisualProjectBuilder();
  }
  
  /**
   * Load API keys from the local .env.local file
   */
  private loadApiKeysFromEnvLocal(): Record<string, string> {
    try {
      if (fs.existsSync(this.ENV_LOCAL_PATH)) {
        const content = fs.readFileSync(this.ENV_LOCAL_PATH, 'utf-8');
        const keys: Record<string, string> = {};
        
        // Parse .env format
        content.split('\n').forEach(line => {
          line = line.trim();
          // Skip comments and empty lines
          if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              keys[key.trim()] = valueParts.join('=').trim();
            }
          }
        });
        
        console.log('[DynamicBuilder] Loaded API keys from .env.local:', Object.keys(keys));
        return keys;
      } else {
        console.warn('[DynamicBuilder] .env.local not found at:', this.ENV_LOCAL_PATH);
        return {};
      }
    } catch (error) {
      console.error('[DynamicBuilder] Error loading .env.local:', error);
      return {};
    }
  }
  
  /**
   * Convert ProjectAnalysis to ProjectScaffold and build it
   */
  async buildFromAnalysis(analysis: ProjectAnalysis): Promise<void> {
    console.log('[DynamicBuilder] Building project:', analysis.name);
    console.log('[DynamicBuilder] Type:', analysis.type);
    console.log('[DynamicBuilder] Files:', analysis.files.length);
    console.log('[DynamicBuilder] Setup commands:', analysis.setupCommands.length);
    
    const scaffold = this.convertToScaffold(analysis);
    
    // Forward events
    this.visualBuilder.on('progress', (progress) => {
      this.emit('progress', progress);
    });
    
    await this.visualBuilder.buildProjectVisually(scaffold);
  }
  
  /**
   * Convert ProjectAnalysis to ProjectScaffold
   */
  private convertToScaffold(analysis: ProjectAnalysis): ProjectScaffold {
    const baseDir = this.getProjectPath(analysis.name);
    
    // Sort files by category for logical creation order
    const sortedFiles = this.sortFilesByPriority(analysis.files);
    
    // Convert files
    const files = sortedFiles.map(f => ({
      path: f.path,
      content: f.content,
      openInEditor: this.shouldOpenInEditor(f.path, f.category)
    }));
    
    // Load API keys from .env.local
    const apiKeys = this.loadApiKeysFromEnvLocal();
    
    // Add .env file with actual API keys from .env.local
    if (!files.some(f => f.path === '.env') && Object.keys(apiKeys).length > 0) {
      let envContent = '# Environment Variables\n';
      envContent += '# Automatically populated from your .env.local file\n\n';
      
      // Add all API keys from .env.local
      Object.entries(apiKeys).forEach(([key, value]) => {
        envContent += `${key}=${value}\n`;
      });
      
      // Add any project-specific environment variables from analysis
      if (Object.keys(analysis.environmentVariables).length > 0) {
        envContent += '\n# Project-specific variables\n';
        Object.entries(analysis.environmentVariables).forEach(([key, value]) => {
          // Only add if not already in apiKeys
          if (!apiKeys[key]) {
            envContent += `${key}=${value}\n`;
          }
        });
      }
      
      files.push({
        path: '.env',
        content: envContent,
        openInEditor: false
      });
      
      console.log('[DynamicBuilder] Added .env file with API keys from .env.local');
    }
    
    // Add .env.example if environment variables specified (if not already added)
    if (Object.keys(analysis.environmentVariables).length > 0 && !files.some(f => f.path === '.env.example')) {
      const envContent = Object.entries(analysis.environmentVariables)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      files.push({
        path: '.env.example',
        content: envContent,
        openInEditor: false
      });
    }
    
    // Add .gitignore if not already added
    if (!files.some(f => f.path === '.gitignore')) {
      files.push({
        path: '.gitignore',
        content: this.generateGitignore(analysis.type),
        openInEditor: false
      });
    }
    
    // Create comprehensive commands list
    const commands: Array<{
      command: string;
      workingDirectory: string;
      description: string;
      waitForCompletion: boolean;
    }> = [];
    
    // Install dependencies
    if (analysis.dependencies.packages.length > 0) {
      const installCmd = this.getInstallCommand(analysis.type);
      commands.push({
        command: installCmd,
        workingDirectory: baseDir,
        description: 'Installing production dependencies',
        waitForCompletion: true
      });
    }
    
    // Install dev dependencies if separate
    if (analysis.dependencies.devPackages && analysis.dependencies.devPackages.length > 0) {
      const devInstallCmd = this.getDevInstallCommand(analysis.type, analysis.dependencies.devPackages);
      if (devInstallCmd) {
        commands.push({
          command: devInstallCmd,
          workingDirectory: baseDir,
          description: 'Installing development dependencies',
          waitForCompletion: true
        });
      }
    }
    
    // Run linting
    if (analysis.setupCommands.some(cmd => cmd.command.includes('lint'))) {
      commands.push({
        command: 'npm run lint -- --fix',
        workingDirectory: baseDir,
        description: 'Fixing code style issues',
        waitForCompletion: false
      });
    }
    
    // Run tests
    if (analysis.testCommand) {
      commands.push({
        command: analysis.testCommand,
        workingDirectory: baseDir,
        description: 'Running test suite',
        waitForCompletion: false
      });
    }
    
    // Build project
    analysis.buildCommands.forEach(cmd => {
      commands.push({
        command: cmd.command,
        workingDirectory: baseDir,
        description: cmd.description,
        waitForCompletion: true
      });
    });
    
    // Final actions
    const finalActions: DesktopAction[] = [];
    
    // Start dev server if available
    if (analysis.devCommand && analysis.portNeeded) {
      commands.push({
        command: `start powershell -NoExit -Command "cd '${baseDir}'; ${analysis.devCommand}"`,
        workingDirectory: baseDir,
        description: `Starting development server: ${analysis.devCommand}`,
        waitForCompletion: false
      });
      
      finalActions.push({
        type: 'wait',
        description: 'Waiting for development server to start',
        params: { duration: 8 },
        estimatedDuration: 8
      });
      
      finalActions.push({
        type: 'open_url',
        description: 'Opening application in browser',
        params: {
          url: `http://localhost:${analysis.portNeeded}`
        },
        estimatedDuration: 2
      });
    } else if (this.isStaticHtmlProject(analysis)) {
      // For static HTML, just open the file
      const indexFile = analysis.files.find(f => 
        f.path === 'index.html' || f.path.endsWith('/index.html')
      );
      
      if (indexFile) {
        finalActions.push({
          type: 'open_url',
          description: 'Opening application',
          params: {
            url: this.getFileUrl(baseDir, indexFile.path)
          },
          estimatedDuration: 2
        });
      }
    }
    
    return {
      name: analysis.name,
      type: this.mapProjectType(analysis.type),
      directory: baseDir,
      files,
      commands,
      finalActions
    };
  }

  /**
   * Sort files by priority (core files first)
   */
  private sortFilesByPriority(files: Array<{ path: string; content: string; purpose: string; category?: string }>): typeof files {
    const priority: Record<string, number> = {
      'config': 1,
      'tooling': 2,
      'core': 3,
      'documentation': 4,
      'deployment': 5
    };
    
    return files.sort((a, b) => {
      const aPriority = priority[a.category || ''] || 99;
      const bPriority = priority[b.category || ''] || 99;
      return aPriority - bPriority;
    });
  }

  /**
   * Get install command based on project type
   */
  private getInstallCommand(type: string): string {
    if (type === 'python') {
      return 'pip install -r requirements.txt';
    }
    
    if (type === 'nodejs' || type === 'react' || type === 'nextjs' || type === 'api' || type === 'fullstack') {
      return 'npm install';
    }
    
    return 'npm install';
  }

  /**
   * Get dev dependencies install command
   */
  private getDevInstallCommand(type: string, devPackages: string[]): string | null {
    if (type === 'python') {
      return null; // Python dev deps usually in requirements-dev.txt
    }
    
    if (type === 'nodejs' || type === 'react' || type === 'nextjs' || type === 'api' || type === 'fullstack') {
      return `npm install --save-dev ${devPackages.join(' ')}`;
    }
    
    return null;
  }
  
  /**
   * Get unique project directory path with timestamp
   */
  private getProjectPath(projectName: string): string {
    const sanitized = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Add timestamp to ensure uniqueness
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uniqueName = `${sanitized}-${timestamp}`;
    
    const basePath = path.join(os.homedir(), 'Desktop', 'AI-Projects', uniqueName);
    
    console.log('[DynamicBuilder] Project path:', basePath);
    
    return basePath;
  }
  
  /**
   * Determine if file should open in editor based on category
   */
  private shouldOpenInEditor(filePath: string, category?: string): boolean {
    // Open main files and important config
    const importantFiles = [
      'server.js', 'index.js', 'app.js', 'main.js',
      'server.ts', 'index.ts', 'app.ts', 'main.ts',
      'App.jsx', 'App.tsx', 'main.py', 'app.py'
    ];
    
    const filename = path.basename(filePath);
    
    // Open core files
    if (category === 'core' || importantFiles.includes(filename)) {
      return true;
    }
    
    // Open README
    if (filename === 'README.md') {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if static HTML project
   */
  private isStaticHtmlProject(analysis: ProjectAnalysis): boolean {
    return analysis.type === 'static' || 
           (!analysis.portNeeded && analysis.files.some(f => f.path === 'index.html'));
  }
  
  /**
   * Get file:// URL
   */
  private getFileUrl(directory: string, filename: string): string {
    const fullPath = path.join(directory, filename);
    const normalized = fullPath.replace(/\\/g, '/');
    return `file:///${normalized}`;
  }
  
  /**
   * Generate .gitignore based on project type
   */
  private generateGitignore(type: string): string {
    const common = [
      'node_modules/',
      '.env',
      '.env.local',
      '*.log',
      '.DS_Store',
      'Thumbs.db'
    ];
    
    const typeSpecific: Record<string, string[]> = {
      nodejs: ['dist/', 'build/', 'coverage/'],
      python: ['__pycache__/', '*.pyc', 'venv/', '.venv/', '*.egg-info/'],
      react: ['build/', 'dist/', '.cache/'],
      vue: ['dist/', '.cache/']
    };
    
    const lines = [...common, ...(typeSpecific[type] || [])];
    return lines.join('\n');
  }
  
  /**
   * Map analysis type to scaffold type
   */
  private mapProjectType(type: string): ProjectScaffold['type'] {
    const mapping: Record<string, ProjectScaffold['type']> = {
      nodejs: 'node_api',
      python: 'python_script',
      react: 'react_app',
      vue: 'react_app',
      static: 'web_app',
      api: 'node_api',
      fullstack: 'web_app'
    };
    
    return mapping[type] || 'web_app';
  }
  
  /**
   * Check if optional command should run
   */
  private shouldRunOptionalCommand(command: string): boolean {
    // For now, run git init but skip others
    return command.includes('git init');
  }
}

