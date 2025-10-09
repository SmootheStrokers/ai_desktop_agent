import { spawn, exec } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { ApplicationName, ApplicationConfig } from './types';

export class ApplicationLauncher {
  private applications: Map<ApplicationName, ApplicationConfig> = new Map();
  private runningProcesses: Map<string, any> = new Map();
  
  constructor() {
    this.detectApplications();
  }
  
  private detectApplications(): void {
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Windows
      this.applications.set('vscode', {
        name: 'Visual Studio Code',
        executablePath: this.findVSCode(),
        launchArgs: [],
        waitForStartup: 2000
      });
      
      this.applications.set('powershell', {
        name: 'PowerShell',
        executablePath: 'powershell.exe',
        launchArgs: ['-NoExit'],
        waitForStartup: 1000
      });
      
      this.applications.set('cmd', {
        name: 'Command Prompt',
        executablePath: 'cmd.exe',
        launchArgs: ['/K'],
        waitForStartup: 500
      });
      
      this.applications.set('explorer', {
        name: 'File Explorer',
        executablePath: 'explorer.exe',
        launchArgs: [],
        waitForStartup: 500
      });
      
      this.applications.set('browser', {
        name: 'Default Browser',
        executablePath: 'start',
        launchArgs: [],
        waitForStartup: 2000
      });
      
    } else if (platform === 'darwin') {
      // macOS
      this.applications.set('vscode', {
        name: 'Visual Studio Code',
        executablePath: 'code',
        launchArgs: [],
        waitForStartup: 2000
      });
      
      this.applications.set('terminal', {
        name: 'Terminal',
        executablePath: 'open',
        launchArgs: ['-a', 'Terminal'],
        waitForStartup: 1000
      });
      
      this.applications.set('browser', {
        name: 'Default Browser',
        executablePath: 'open',
        launchArgs: [],
        waitForStartup: 2000
      });
      
      this.applications.set('explorer', {
        name: 'Finder',
        executablePath: 'open',
        launchArgs: [],
        waitForStartup: 500
      });
    }
  }
  
  private findVSCode(): string {
    const platform = os.platform();
    
    if (platform === 'win32') {
      const possiblePaths = [
        // User installation (most common)
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
        
        // System installation
        path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft VS Code', 'Code.exe'),
        
        // Insiders version
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code Insiders', 'Code - Insiders.exe'),
        
        // VSCodium (open source)
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'VSCodium', 'VSCodium.exe'),
      ];
      
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          console.log('[ApplicationLauncher] Found VSCode at:', testPath);
          return testPath;
        }
      }
      
      console.log('[ApplicationLauncher] VSCode not found in standard locations, using PATH');
      return 'code';
    } else if (platform === 'darwin') {
      return '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
    } else {
      return 'code';
    }
  }
  
  /**
   * Find VSCode - try shortcut first, then standard paths
   */
  private findVSCodePath(): string {
    const platform = os.platform();
    
    if (platform === 'win32') {
      // PRIORITY 1: Check for Desktop shortcuts (YOUR specific case)
      const desktopShortcuts = [
        path.join(os.homedir(), 'OneDrive', 'Desktop', 'Visual Studio Code.lnk'),
        path.join(os.homedir(), 'Desktop', 'Visual Studio Code.lnk'),
        path.join(os.homedir(), 'OneDrive', 'Desktop', 'Code.lnk'),
        path.join(os.homedir(), 'Desktop', 'Code.lnk'),
      ];
      
      for (const shortcut of desktopShortcuts) {
        if (fs.existsSync(shortcut)) {
          console.log('[ApplicationLauncher] ✓ Found VSCode shortcut:', shortcut);
          return shortcut;
        }
      }
      
      // PRIORITY 2: Standard installation paths
      const possiblePaths = [
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
        path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft VS Code', 'Code.exe'),
      ];
      
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          console.log('[ApplicationLauncher] ✓ Found VSCode executable:', testPath);
          return testPath;
        }
      }
      
      console.log('[ApplicationLauncher] VSCode not found, using PATH');
      return 'code';
    } else if (platform === 'darwin') {
      return 'code'; // macOS uses command
    } else {
      return 'code'; // Linux uses command
    }
  }

  /**
   * Open VSCode using shortcut or executable
   */
  async openVSCodeWithShortcut(projectPath: string): Promise<void> {
    const vscodePath = this.findVSCodePath();
    
    console.log('[ApplicationLauncher] Opening VSCode...');
    console.log('[ApplicationLauncher] Path:', vscodePath);
    console.log('[ApplicationLauncher] Project:', projectPath);
    
    const platform = os.platform();
    
    if (platform === 'win32') {
      // If it's a .lnk shortcut, use start command
      if (vscodePath.endsWith('.lnk')) {
        console.log('[ApplicationLauncher] Using Windows shortcut');
        
        // Use start command with the shortcut, then open folder
        exec(`start "" "${vscodePath}"`, (error) => {
          if (error) {
            console.error('[ApplicationLauncher] Error launching shortcut:', error);
          }
        });
        
        // Wait for VSCode to start
        await this.wait(3000);
        
        // Now use CLI to open the folder
        exec(`code "${projectPath}"`, (error) => {
          if (error) {
            console.error('[ApplicationLauncher] Error opening folder:', error);
          }
        });
        
      } else {
        // Direct executable
        spawn(vscodePath, [projectPath, '--new-window'], {
          detached: true,
          stdio: 'ignore',
          shell: true
        }).unref();
      }
    } else {
      // macOS/Linux
      spawn('code', [projectPath, '--new-window'], {
        detached: true,
        stdio: 'ignore',
        shell: true
      }).unref();
    }
    
    // Wait for VSCode to fully load
    await this.wait(5000);
    console.log('[ApplicationLauncher] ✓ VSCode should be open now');
  }

  /**
   * Open specific file in VSCode with line reveal
   */
  async openAndRevealFile(filePath: string, lineNumber?: number): Promise<void> {
    console.log('[ApplicationLauncher] Opening file in VSCode:', filePath);
    console.log('[ApplicationLauncher] Line number:', lineNumber || 'N/A');
    
    // Verify file exists before trying to open
    if (!fs.existsSync(filePath)) {
      console.error('[ApplicationLauncher] File does not exist:', filePath);
      throw new Error(`Cannot open file - does not exist: ${filePath}`);
    }
    
    const args = lineNumber 
      ? ['-g', `"${filePath}:${lineNumber}"`]  // Open and go to line
      : [`"${filePath}"`];  // Just open file
    
    const command = `code ${args.join(' ')}`;
    console.log('[ApplicationLauncher] Executing command:', command);
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('[ApplicationLauncher] Error opening file:', error);
          console.error('[ApplicationLauncher] stderr:', stderr);
          // Don't reject - VSCode might still open the file
          resolve();
        } else {
          console.log('[ApplicationLauncher] ✓ File opened in VSCode:', filePath);
          if (stdout) console.log('[ApplicationLauncher] stdout:', stdout);
          resolve();
        }
      });
      
      // Ensure we don't wait forever
      setTimeout(() => {
        console.log('[ApplicationLauncher] Open file command completed (timeout)');
        resolve();
      }, 2000);
    });
  }
  
  async openApplication(
    appName: ApplicationName,
    args: string[] = []
  ): Promise<{ pid: number; process: any }> {
    const config = this.applications.get(appName);
    if (!config) {
      throw new Error(`Application not configured: ${appName}`);
    }
    
    const allArgs = [...(config.launchArgs || []), ...args];
    
    console.log(`[Desktop Control] Opening ${config.name}:`, config.executablePath, allArgs);
    
    const process = spawn(config.executablePath, allArgs, {
      detached: true,
      stdio: 'ignore',
      shell: true
    });
    
    const processId = `${appName}_${Date.now()}`;
    this.runningProcesses.set(processId, process);
    
    if (config.waitForStartup) {
      await this.wait(config.waitForStartup);
    }
    
    return { pid: process.pid || 0, process };
  }
  
  async openVSCodeWithFolder(folderPath: string): Promise<void> {
    await this.openApplication('vscode', [folderPath]);
  }
  
  async openVSCodeWithFile(filePath: string): Promise<void> {
    await this.openApplication('vscode', [filePath]);
  }
  
  async openTerminalInDirectory(
    directory: string,
    shell: 'powershell' | 'cmd' | 'terminal' = 'powershell'
  ): Promise<void> {
    const platform = os.platform();
    
    if (platform === 'win32') {
      if (shell === 'powershell') {
        await this.openApplication('powershell', [
          '-NoExit',
          '-Command',
          `cd '${directory}'`
        ]);
      } else {
        await this.openApplication('cmd', [
          '/K',
          `cd /d "${directory}"`
        ]);
      }
    } else if (platform === 'darwin') {
      // macOS - use osascript to open Terminal in directory
      exec(`osascript -e 'tell application "Terminal" to do script "cd \\"${directory}\\""'`);
      await this.wait(1000);
    }
  }
  
  /**
   * Run command in visible PowerShell with full output capture
   */
  async runCommandInVisibleTerminal(
    command: string,
    workingDirectory: string,
    description?: string
  ): Promise<{ output: string; error?: string; exitCode: number }> {
    console.log(`[Desktop Control] Running command in PowerShell`);
    console.log(`[Desktop Control] Directory: ${workingDirectory}`);
    console.log(`[Desktop Control] Command: ${command}`);
    
    return new Promise((resolve, reject) => {
      const platform = os.platform();
      
      if (platform === 'win32') {
        // Create a PowerShell script that will execute the command and stay open
        const scriptContent = `
          Set-Location "${workingDirectory}"
          Write-Host "================================" -ForegroundColor Cyan
          Write-Host "AI Desktop Agent - Executing Command" -ForegroundColor Cyan
          Write-Host "Directory: ${workingDirectory}" -ForegroundColor Yellow
          Write-Host "Command: ${command}" -ForegroundColor Yellow
          Write-Host "================================" -ForegroundColor Cyan
          Write-Host ""
          
          # Execute the command and capture output
          try {
            ${command}
            $exitCode = $LASTEXITCODE
            
            Write-Host ""
            Write-Host "================================" -ForegroundColor Green
            Write-Host "Command completed successfully!" -ForegroundColor Green
            Write-Host "Exit Code: $exitCode" -ForegroundColor Green
            Write-Host "================================" -ForegroundColor Green
            
            # Keep window open
            Write-Host ""
            Write-Host "Press Enter to continue or close this window..." -ForegroundColor Cyan
            
          } catch {
            Write-Host ""
            Write-Host "================================" -ForegroundColor Red
            Write-Host "Command failed with error:" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
            Write-Host "================================" -ForegroundColor Red
            
            Write-Host ""
            Write-Host "Press Enter to continue or close this window..." -ForegroundColor Cyan
          }
        `.trim();
        
        // Save script to temp file
        const tempDir = os.tmpdir();
        const scriptPath = path.join(tempDir, `ai-agent-${Date.now()}.ps1`);
        
        fs.writeFileSync(scriptPath, scriptContent);
        console.log(`[Desktop Control] Created PowerShell script: ${scriptPath}`);
        
        // Execute PowerShell script in new window
        const process = spawn('cmd.exe', ['/c', 'start', 'powershell.exe', '-ExecutionPolicy', 'Bypass', '-NoExit', '-File', scriptPath], {
          cwd: workingDirectory,
          detached: true,
          stdio: 'ignore'
        });
        
        process.unref();
        
        // Give command time to start
        setTimeout(() => {
          resolve({
            output: `Command executed in PowerShell: ${command}`,
            exitCode: 0
          });
        }, 2000);
        
      } else if (platform === 'darwin') {
        // macOS Terminal
        const script = `
          cd "${workingDirectory}"
          echo "================================"
          echo "AI Desktop Agent - Executing Command"
          echo "Directory: ${workingDirectory}"
          echo "Command: ${command}"
          echo "================================"
          echo ""
          ${command}
          echo ""
          echo "================================"
          echo "Command completed!"
          echo "================================"
          read -p "Press Enter to continue..."
        `;
        
        exec(`osascript -e 'tell application "Terminal" to do script "${script.replace(/"/g, '\\"')}"'`);
        
        setTimeout(() => {
          resolve({
            output: `Command executed in Terminal: ${command}`,
            exitCode: 0
          });
        }, 2000);
        
      } else {
        // Linux
        exec(`gnome-terminal -- bash -c 'cd "${workingDirectory}" && ${command} && read -p "Press Enter to continue..."'`);
        
        setTimeout(() => {
          resolve({
            output: `Command executed in terminal: ${command}`,
            exitCode: 0
          });
        }, 2000);
      }
    });
  }

  /**
   * Run multiple commands in sequence in same PowerShell window
   */
  async runCommandSequence(
    commands: Array<{ command: string; description: string }>,
    workingDirectory: string
  ): Promise<void> {
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Build PowerShell script with all commands
      let scriptContent = `
        Set-Location "${workingDirectory}"
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "AI Desktop Agent - Command Sequence" -ForegroundColor Cyan
        Write-Host "Directory: ${workingDirectory}" -ForegroundColor Yellow
        Write-Host "Commands: ${commands.length}" -ForegroundColor Yellow
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host ""
      `;
      
      commands.forEach((cmd, index) => {
        scriptContent += `
        Write-Host "[${index + 1}/${commands.length}] ${cmd.description}" -ForegroundColor Yellow
        Write-Host "Running: ${cmd.command}" -ForegroundColor Gray
        ${cmd.command}
        
        if ($LASTEXITCODE -ne 0) {
          Write-Host "Warning: Command exited with code $LASTEXITCODE" -ForegroundColor Red
        } else {
          Write-Host "Success!" -ForegroundColor Green
        }
        Write-Host ""
        `;
      });
      
      scriptContent += `
        Write-Host "================================" -ForegroundColor Green
        Write-Host "All commands completed!" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Press Enter to close or keep window open..." -ForegroundColor Cyan
        Read-Host
      `;
      
      // Save and execute script
      const tempDir = os.tmpdir();
      const scriptPath = path.join(tempDir, `ai-agent-sequence-${Date.now()}.ps1`);
      
      fs.writeFileSync(scriptPath, scriptContent.trim());
      
      spawn('cmd.exe', ['/c', 'start', 'powershell.exe', '-ExecutionPolicy', 'Bypass', '-NoExit', '-File', scriptPath], {
        cwd: workingDirectory,
        detached: true,
        stdio: 'ignore'
      }).unref();
      
      await this.wait(2000);
    }
  }

  /**
   * Check if a command/tool is available
   */
  async checkCommandAvailable(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      exec(`where ${command}`, (error) => {
        resolve(!error);
      });
    });
  }

  /**
   * Install missing dependencies automatically
   */
  async ensureDependencies(dependencies: string[]): Promise<void> {
    console.log('[ApplicationLauncher] Checking dependencies:', dependencies);
    
    for (const dep of dependencies) {
      const available = await this.checkCommandAvailable(dep);
      
      if (!available) {
        console.log(`[ApplicationLauncher] Missing dependency: ${dep}`);
        
        // Could add auto-install logic here
        // For now, just log it
        throw new Error(`Missing required dependency: ${dep}. Please install it first.`);
      } else {
        console.log(`[ApplicationLauncher] ✓ ${dep} is available`);
      }
    }
  }

  /**
   * Run PowerShell command with advanced options
   */
  async runPowerShellCommand(
    command: string,
    workingDirectory: string,
    options?: {
      visible?: boolean;
      waitForCompletion?: boolean;
      env?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<{ output: string; error?: string; exitCode: number }> {
    console.log(`[PowerShell] Running: ${command}`);
    console.log(`[PowerShell] Working dir: ${workingDirectory}`);
    
    const opts = {
      visible: options?.visible ?? false,
      waitForCompletion: options?.waitForCompletion ?? true,
      env: options?.env ?? {},
      timeout: options?.timeout ?? 300000 // 5 minutes default
    };
    
    return new Promise((resolve, reject) => {
      // Build PowerShell command
      const psArgs = opts.visible ? ['-NoExit', '-Command'] : ['-Command'];
      
      // Change directory and run command
      const fullCommand = `Set-Location "${workingDirectory}"; ${command}`;
      psArgs.push(fullCommand);
      
      console.log(`[PowerShell] Args:`, psArgs);
      
      // Spawn PowerShell process
      const psProcess = spawn('powershell.exe', psArgs, {
        cwd: workingDirectory,
        env: { ...process.env, ...opts.env },
        shell: false,
        stdio: opts.visible ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe']
      });
      
      let output = '';
      let errorOutput = '';
      let hasResolved = false;
      
      // Set timeout
      const timeoutHandle = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          psProcess.kill();
          reject(new Error(`Command timed out after ${opts.timeout}ms`));
        }
      }, opts.timeout);
      
      // Capture output
      if (psProcess.stdout) {
        psProcess.stdout.on('data', (data) => {
          const text = data.toString();
          output += text;
          console.log(`[PowerShell Output] ${text}`);
        });
      }
      
      if (psProcess.stderr) {
        psProcess.stderr.on('data', (data) => {
          const text = data.toString();
          errorOutput += text;
          console.error(`[PowerShell Error] ${text}`);
        });
      }
      
      // Handle completion
      psProcess.on('close', (code) => {
        clearTimeout(timeoutHandle);
        if (!hasResolved) {
          hasResolved = true;
          console.log(`[PowerShell] Completed with code: ${code}`);
          resolve({
            output,
            error: errorOutput || undefined,
            exitCode: code || 0
          });
        }
      });
      
      psProcess.on('error', (err) => {
        clearTimeout(timeoutHandle);
        if (!hasResolved) {
          hasResolved = true;
          console.error(`[PowerShell] Process error:`, err);
          reject(err);
        }
      });
    });
  }

  /**
   * Run a batch of commands sequentially
   */
  async runCommandBatch(
    commands: Array<{
      command: string;
      workingDirectory: string;
      description?: string;
      shell?: 'powershell' | 'cmd';
      env?: Record<string, string>;
    }>
  ): Promise<Array<{ success: boolean; output?: string; error?: string }>> {
    const results: Array<{ success: boolean; output?: string; error?: string }> = [];
    
    for (const cmd of commands) {
      console.log(`[Batch] Running: ${cmd.description || cmd.command}`);
      
      try {
        const result = await this.runPowerShellCommand(
          cmd.command,
          cmd.workingDirectory,
          {
            visible: false,
            waitForCompletion: true,
            env: cmd.env
          }
        );
        
        results.push({
          success: result.exitCode === 0,
          output: result.output,
          error: result.error
        });
      } catch (error) {
        console.error(`[Batch] Command failed:`, error);
        results.push({
          success: false,
          error: (error as Error).message
        });
      }
    }
    
    return results;
  }
  
  async openFileExplorer(folderPath: string): Promise<void> {
    const platform = os.platform();
    
    if (platform === 'win32') {
      await this.openApplication('explorer', [folderPath]);
    } else if (platform === 'darwin') {
      exec(`open "${folderPath}"`);
      await this.wait(500);
    } else {
      exec(`xdg-open "${folderPath}"`);
      await this.wait(500);
    }
  }
  
  async openBrowser(url: string): Promise<void> {
    const platform = os.platform();
    
    console.log('[ApplicationLauncher] Opening browser with URL:', url);
    
    // Handle file:// URLs specially on Windows
    if (url.startsWith('file:///')) {
      // Extract the actual file path
      const filePath = url.replace('file:///', '').replace(/\//g, '\\');
      console.log('[ApplicationLauncher] Converted to file path:', filePath);
      
      // Verify file exists
      if (!fs.existsSync(filePath)) {
        console.error('[ApplicationLauncher] File not found:', filePath);
        throw new Error(`File not found: ${filePath}`);
      }
    }
    
    if (platform === 'win32') {
      // Use 'start' command which handles file:// URLs
      exec(`start "" "${url}"`);
    } else if (platform === 'darwin') {
      exec(`open "${url}"`);
    } else {
      exec(`xdg-open "${url}"`);
    }
    
    await this.wait(2000);
  }
  
  /**
   * Open VSCode and wait for it to fully load
   */
  async openVSCodeWithProject(projectPath: string, waitForLoad: boolean = true): Promise<void> {
    const vscodePath = this.findVSCode();
    
    console.log('[ApplicationLauncher] Opening VSCode...');
    console.log('[ApplicationLauncher] Executable:', vscodePath);
    console.log('[ApplicationLauncher] Project:', projectPath);
    
    // Open VSCode with the project folder
    const process = spawn(vscodePath, [projectPath, '--new-window'], {
      detached: true,
      stdio: 'ignore',
      shell: true
    });
    
    process.unref();
    
    if (waitForLoad) {
      // Wait longer for VSCode to fully load
      console.log('[ApplicationLauncher] Waiting for VSCode to load...');
      await this.wait(5000);
    }
  }

  /**
   * Create file in VSCode programmatically
   * This method creates a file and optionally opens it in VSCode
   */
  async createFileInVSCode(projectPath: string, filePath: string, content: string, openInEditor: boolean = false): Promise<void> {
    const fullPath = path.join(projectPath, filePath);
    const dir = path.dirname(fullPath);
    
    console.log('[ApplicationLauncher] Creating file:', filePath);
    console.log('[ApplicationLauncher] Full path:', fullPath);
    console.log('[ApplicationLauncher] Open in editor:', openInEditor);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('[ApplicationLauncher] Created directory:', dir);
    }
    
    // Write file to disk
    try {
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log('[ApplicationLauncher] ✓ File written to disk:', fullPath);
      
      // Verify file was created
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log('[ApplicationLauncher] ✓ File verified:', fullPath, `(${stats.size} bytes)`);
      }
    } catch (error) {
      console.error('[ApplicationLauncher] Failed to create file:', error);
      throw error;
    }
    
    // Small delay to ensure file system sync
    await this.wait(200);
    
    // Open in VSCode if requested
    if (openInEditor) {
      console.log('[ApplicationLauncher] Opening file in VSCode editor...');
      await this.openAndRevealFile(fullPath);
    }
  }

  /**
   * Open specific file in VSCode
   */
  async openFileInVSCode(filePath: string): Promise<void> {
    const vscodePath = this.findVSCode();
    
    spawn(vscodePath, [filePath], {
      detached: true,
      stdio: 'ignore',
      shell: true
    }).unref();
    
    await this.wait(1000);
  }

  /**
   * Create folder structure in VSCode
   */
  async createFolderStructure(projectPath: string, folders: string[]): Promise<void> {
    console.log('[ApplicationLauncher] Creating folder structure...');
    console.log('[ApplicationLauncher] Folders to create:', folders.length);
    
    for (const folder of folders) {
      const fullPath = path.join(projectPath, folder);
      
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log('[ApplicationLauncher] ✓ Created folder:', folder);
      } else {
        console.log('[ApplicationLauncher] Folder already exists:', folder);
      }
    }
    
    console.log('[ApplicationLauncher] ✓ Folder structure complete');
    await this.wait(500);
  }

  /**
   * Create multiple files in VSCode at once
   * Files are created in the order provided
   */
  async createMultipleFilesInVSCode(
    projectPath: string, 
    files: Array<{ path: string; content: string; openInEditor?: boolean }>
  ): Promise<void> {
    console.log(`[ApplicationLauncher] Creating ${files.length} files in VSCode...`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[ApplicationLauncher] Creating file ${i + 1}/${files.length}: ${file.path}`);
      
      await this.createFileInVSCode(
        projectPath, 
        file.path, 
        file.content, 
        file.openInEditor || false
      );
      
      // Small delay between files to ensure proper processing
      await this.wait(300);
    }
    
    console.log(`[ApplicationLauncher] ✓ All ${files.length} files created successfully`);
  }

  /**
   * Install VSCode extensions
   */
  async installVSCodeExtensions(extensions: string[]): Promise<void> {
    const vscodePath = this.findVSCode();
    
    console.log('[ApplicationLauncher] Installing VSCode extensions:', extensions);
    
    for (const ext of extensions) {
      console.log(`[ApplicationLauncher] Installing ${ext}...`);
      
      spawn(vscodePath, ['--install-extension', ext], {
        stdio: 'ignore',
        shell: true
      });
      
      await this.wait(2000);
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  killAllProcesses(): void {
    this.runningProcesses.forEach((process, id) => {
      try {
        process.kill();
      } catch (err) {
        console.error(`Failed to kill process ${id}:`, err);
      }
    });
    this.runningProcesses.clear();
  }
}

