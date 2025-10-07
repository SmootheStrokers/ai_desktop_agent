/**
 * Plugin System Types
 * Defines the interface for plugins that can extend the application functionality
 */

import { Tool } from '../tools/types';

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string;
  
  // Lifecycle hooks
  onLoad?(): Promise<void>;
  onUnload?(): Promise<void>;
  
  // Tool registration
  tools?: Tool[];
  
  // UI components (for future use)
  ui?: {
    settings?: React.ComponentType;
    panel?: React.ComponentType;
  };
  
  // Event handlers
  onMessage?(message: string): Promise<string | null>;
  onToolCall?(tool: string, params: any): Promise<any>;
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  dependencies?: Record<string, string>;
  permissions?: string[];
}

export interface PluginInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  installed: boolean;
  enabled: boolean;
  path?: string;
  manifest?: PluginManifest;
}

export interface PluginError {
  pluginName: string;
  error: string;
  stack?: string;
}
