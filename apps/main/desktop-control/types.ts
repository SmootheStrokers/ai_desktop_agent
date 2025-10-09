export interface DesktopAction {
  type: 'open_app' | 'run_command' | 'create_file' | 'open_folder' | 'open_url' | 'focus_window' | 'type_text' | 'click' | 'wait';
  description: string;
  params: any;
  estimatedDuration: number; // seconds
}

export interface ApplicationConfig {
  name: string;
  executablePath: string;
  launchArgs?: string[];
  waitForStartup?: number; // ms to wait after launch
}

export type ApplicationName = 
  | 'vscode'
  | 'terminal'
  | 'powershell'
  | 'cmd'
  | 'browser'
  | 'explorer'
  | 'notepad';

export interface ProjectScaffold {
  name: string;
  type: 'web_app' | 'node_api' | 'python_script' | 'desktop_app' | 'react_app';
  directory: string;
  files: Array<{
    path: string;
    content: string;
    openInEditor?: boolean;
  }>;
  commands: Array<{
    command: string;
    workingDirectory: string;
    description: string;
    waitForCompletion: boolean;
    shell?: 'powershell' | 'cmd' | 'bash';
    runAsAdmin?: boolean;
    env?: Record<string, string>;
  }>;
  productionCommands?: Array<{
    command: string;
    workingDirectory: string;
    description: string;
    when?: 'pre-build' | 'post-build' | 'deploy';
  }>;
  finalActions: DesktopAction[];
}

export interface VisualBuildProgress {
  phase: 'setup' | 'scaffolding' | 'coding' | 'installing' | 'testing' | 'complete';
  currentAction: string;
  completedActions: string[];
  totalActions: number;
  visibleWindows: string[];
  screenshot?: string;
}

