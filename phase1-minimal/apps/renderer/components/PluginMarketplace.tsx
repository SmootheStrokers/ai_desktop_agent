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
    <div style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>{plugin.name}</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>v{plugin.version}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {plugin.installed ? (
            <button
              onClick={() => onToggle(plugin)}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                background: plugin.enabled ? '#d1fae5' : '#f3f4f6',
                color: plugin.enabled ? '#065f46' : '#374151'
              }}
            >
              {plugin.enabled ? 'Enabled' : 'Disabled'}
            </button>
          ) : (
            <button
              onClick={() => onInstall(plugin)}
              style={{
                padding: '4px 12px',
                background: '#dbeafe',
                color: '#1e40af',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Install
            </button>
          )}
        </div>
      </div>
      
      <p style={{ color: '#374151', marginBottom: '16px' }}>{plugin.description}</p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>by {plugin.author}</span>
        {plugin.installed && (
          <button
            onClick={() => onUninstall(plugin)}
            style={{
              fontSize: '14px',
              color: '#dc2626',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        maxWidth: '900px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>Plugin Marketplace</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '4px',
              fontSize: '24px',
              lineHeight: 1
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Plugins</option>
              <option value="installed">Installed</option>
              <option value="available">Available</option>
            </select>
          </div>
        </div>

        {/* Plugin Grid */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
              <span style={{ color: '#6b7280' }}>Loading plugins...</span>
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: '#6b7280' }}>No plugins found matching your criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
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
