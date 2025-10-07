/**
 * Plugin Marketplace Component
 * UI for browsing, installing, and managing plugins
 */

import React, { useState, useEffect } from 'react';
import { PluginInfo } from '../../main/plugins/types';

interface PluginCardProps {
  plugin: PluginInfo;
  onInstall: (plugin: PluginInfo) => void;
  onUninstall: (plugin: PluginInfo) => void;
  onToggle: (plugin: PluginInfo) => void;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, onInstall, onUninstall, onToggle }) => {
  return (
    <div className="plugin-card bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
          <p className="text-sm text-gray-600">v{plugin.version}</p>
        </div>
        <div className="flex space-x-2">
          {plugin.installed ? (
            <button
              onClick={() => onToggle(plugin)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                plugin.enabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {plugin.enabled ? 'Enabled' : 'Disabled'}
            </button>
          ) : (
            <button
              onClick={() => onInstall(plugin)}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
            >
              Install
            </button>
          )}
        </div>
      </div>
      
      <p className="text-gray-700 mb-4">{plugin.description}</p>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">by {plugin.author}</span>
        {plugin.installed && (
          <button
            onClick={() => onUninstall(plugin)}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            Uninstall
          </button>
        )}
      </div>
    </div>
  );
};

interface PluginMarketplaceProps {
  onClose: () => void;
}

export const PluginMarketplace: React.FC<PluginMarketplaceProps> = ({ onClose }) => {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'installed' | 'available'>('all');

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const result = await (window as any).electronAPI.listPlugins();
      if (result.success) {
        setPlugins(result.data);
      } else {
        console.error('Failed to load plugins:', result.error);
        // Fallback to mock data for development
        const mockPlugins: PluginInfo[] = [
          {
            name: 'weather',
            version: '1.0.0',
            description: 'Get weather information for any location',
            author: 'LocalDev Team',
            installed: true,
            enabled: true
          },
          {
            name: 'github',
            version: '1.0.0',
            description: 'Interact with GitHub repositories and issues',
            author: 'LocalDev Team',
            installed: true,
            enabled: false
          }
        ];
        setPlugins(mockPlugins);
      }
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (plugin: PluginInfo) => {
    try {
      if (plugin.path) {
        const result = await (window as any).electronAPI.loadPlugin(plugin.path);
        if (result.success) {
          setPlugins(prev => prev.map(p => 
            p.name === plugin.name ? { ...p, installed: true, enabled: true } : p
          ));
        } else {
          console.error('Failed to install plugin:', result.error);
        }
      }
    } catch (error) {
      console.error('Failed to install plugin:', error);
    }
  };

  const handleUninstall = async (plugin: PluginInfo) => {
    try {
      const result = await (window as any).electronAPI.unloadPlugin(plugin.name);
      if (result.success) {
        setPlugins(prev => prev.map(p => 
          p.name === plugin.name ? { ...p, installed: false, enabled: false } : p
        ));
      } else {
        console.error('Failed to uninstall plugin:', result.error);
      }
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
    }
  };

  const handleToggle = async (plugin: PluginInfo) => {
    try {
      if (plugin.enabled) {
        // Disable plugin
        const result = await (window as any).electronAPI.unloadPlugin(plugin.name);
        if (result.success) {
          setPlugins(prev => prev.map(p => 
            p.name === plugin.name ? { ...p, enabled: false } : p
          ));
        }
      } else {
        // Enable plugin
        if (plugin.path) {
          const result = await (window as any).electronAPI.loadPlugin(plugin.path);
          if (result.success) {
            setPlugins(prev => prev.map(p => 
              p.name === plugin.name ? { ...p, enabled: true } : p
            ));
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    }
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' ||
                         (filter === 'installed' && plugin.installed) ||
                         (filter === 'available' && !plugin.installed);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="plugin-marketplace fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Plugin Marketplace</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Plugins</option>
              <option value="installed">Installed</option>
              <option value="available">Available</option>
            </select>
          </div>
        </div>

        {/* Plugin Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading plugins...</span>
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No plugins found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPlugins.map(plugin => (
                <PluginCard
                  key={plugin.name}
                  plugin={plugin}
                  onInstall={handleInstall}
                  onUninstall={handleUninstall}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
