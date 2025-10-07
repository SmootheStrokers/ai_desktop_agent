/**
 * Plugin Manager
 * Handles loading, unloading, and managing plugins
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import { Plugin, PluginInfo, PluginManifest, PluginError } from './types';
// import { toolRegistry } from '../tools/registry';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginDir: string;
  private enabledPlugins: Set<string> = new Set();
  private errors: PluginError[] = [];
  private toolRegistry: any;

  constructor(toolRegistry: any) {
    // Use local plugins directory for development
    this.pluginDir = path.join(__dirname, '../../../plugins');
    this.toolRegistry = toolRegistry;
    
    if (!this.toolRegistry) {
      throw new Error('PluginManager requires a toolRegistry instance');
    }
  }

  /**
   * Initialize the plugin manager and discover plugins
   */
  async initialize(): Promise<void> {
    try {
      console.log(`Initializing plugin manager with directory: ${this.pluginDir}`);
      // Ensure plugin directory exists
      await fs.mkdir(this.pluginDir, { recursive: true });
      console.log('Plugin directory ensured');
      
      // Load enabled plugins
      await this.loadEnabledPlugins();
      console.log(`Plugin manager initialized. Loaded ${this.plugins.size} plugins.`);
    } catch (error) {
      console.error('Failed to initialize plugin manager:', error);
    }
  }

  /**
   * Load a plugin from a file path
   */
  async loadPlugin(pluginPath: string): Promise<boolean> {
    try {
      // Clear any existing errors for this plugin
      this.clearPluginErrors(path.basename(pluginPath));

      // Read plugin manifest
      const manifestPath = path.join(pluginPath, 'package.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);

      // Import the plugin module (CommonJS)
      const pluginModulePath = path.join(pluginPath, manifest.main);
      const pluginModule = require(pluginModulePath);
      const plugin: Plugin = pluginModule.default || pluginModule;

      // Validate plugin structure
      if (!this.validatePlugin(plugin)) {
        throw new Error('Invalid plugin structure');
      }

      // Call plugin onLoad hook
      if (plugin.onLoad) {
        await plugin.onLoad();
      }

      // Register plugin
      this.plugins.set(plugin.name, plugin);
      this.enabledPlugins.add(plugin.name);

      // Register plugin tools
      if (plugin.tools) {
        plugin.tools.forEach(tool => {
          this.toolRegistry.register(tool);
          console.log(`Registered tool: ${tool.name} from plugin: ${plugin.name}`);
        });
      }

      console.log(`Loaded plugin: ${plugin.name} v${plugin.version}`);
      return true;
    } catch (error) {
      const pluginName = path.basename(pluginPath);
      this.addPluginError(pluginName, error instanceof Error ? error.message : 'Unknown error');
      console.error(`Failed to load plugin ${pluginName}:`, error);
      return false;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(name: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(name);
      if (!plugin) {
        return false;
      }

      // Call plugin onUnload hook
      if (plugin.onUnload) {
        await plugin.onUnload();
      }

      // Unregister plugin tools (this would require extending ToolRegistry)
      // For now, we'll keep tools registered until app restart

      // Remove plugin
      this.plugins.delete(name);
      this.enabledPlugins.delete(name);

      console.log(`Unloaded plugin: ${name}`);
      return true;
    } catch (error) {
      console.error(`Failed to unload plugin ${name}:`, error);
      return false;
    }
  }

  /**
   * Discover and load all plugins in the plugin directory
   */
  async discoverPlugins(): Promise<PluginInfo[]> {
    const pluginInfos: PluginInfo[] = [];

    // Check both local plugins directory and userData plugins directory
    const pluginDirs = [
      this.pluginDir // Local plugins directory
    ];
    
    // Add userData plugins directory if app is available (running in Electron)
    try {
      if (app && app.getPath) {
        pluginDirs.push(path.join(app.getPath('userData'), 'plugins'));
      }
    } catch (error) {
      // app not available, skip userData directory
    }

    for (const pluginDir of pluginDirs) {
      try {
        if (!await fs.access(pluginDir).then(() => true).catch(() => false)) {
          continue; // Skip if directory doesn't exist
        }

        const dirs = await fs.readdir(pluginDir);
        
        for (const dir of dirs) {
          const pluginPath = path.join(pluginDir, dir);
          const stat = await fs.stat(pluginPath);
          
          if (stat.isDirectory()) {
            try {
              const manifestPath = path.join(pluginPath, 'package.json');
              const manifestContent = await fs.readFile(manifestPath, 'utf-8');
              const manifest: PluginManifest = JSON.parse(manifestContent);

              const pluginInfo: PluginInfo = {
                name: manifest.name,
                version: manifest.version,
                description: manifest.description,
                author: manifest.author,
                installed: true,
                enabled: true, // Enable plugins by default
                path: pluginPath,
                manifest
              };

              pluginInfos.push(pluginInfo);
            } catch (error) {
              console.error(`Failed to read manifest for plugin ${dir}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to discover plugins in ${pluginDir}:`, error);
      }
    }

    return pluginInfos;
  }

  /**
   * Load all enabled plugins
   */
  private async loadEnabledPlugins(): Promise<void> {
    console.log('Discovering plugins...');
    const pluginInfos = await this.discoverPlugins();
    console.log(`Found ${pluginInfos.length} plugins:`, pluginInfos.map(p => p.name));
    
    for (const pluginInfo of pluginInfos) {
      if (pluginInfo.enabled && pluginInfo.path) {
        console.log(`Loading enabled plugin: ${pluginInfo.name} from ${pluginInfo.path}`);
        await this.loadPlugin(pluginInfo.path);
      }
    }
  }

  /**
   * Get all loaded plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Check if plugin is loaded
   */
  isPluginLoaded(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get plugin errors
   */
  getErrors(): PluginError[] {
    return [...this.errors];
  }

  /**
   * Clear errors for a specific plugin
   */
  clearPluginErrors(pluginName: string): void {
    this.errors = this.errors.filter(error => error.pluginName !== pluginName);
  }

  /**
   * Add plugin error
   */
  private addPluginError(pluginName: string, error: string, stack?: string): void {
    this.errors.push({ pluginName, error, stack });
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: any): plugin is Plugin {
    return (
      typeof plugin === 'object' &&
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.description === 'string' &&
      typeof plugin.author === 'string'
    );
  }
}
