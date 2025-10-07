import React, { useState, useEffect } from 'react';

interface MCPServerConfig {
  name: string;
  command: string[];
  enabled: boolean;
  description?: string;
}

interface MCPServerStatus {
  name: string;
  connected: boolean;
  toolCount: number;
  error?: string;
  config?: MCPServerConfig;
}

export function MCPServersPanel() {
  const [servers, setServers] = useState<MCPServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load servers on mount
  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await (window as any).electronAPI.mcp.getServers();
      
      if (response.success) {
        setServers(response.data);
      } else {
        setError(response.error || 'Failed to load servers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleServer = async (server: MCPServerStatus) => {
    try {
      if (server.connected) {
        // Disconnect
        const response = await (window as any).electronAPI.mcp.disconnect(server.name);
        if (!response.success) {
          alert(`Failed to disconnect: ${response.error}`);
        }
      } else {
        // Reconnect using stored config
        if (server.config) {
          const response = await (window as any).electronAPI.mcp.connect(server.config);
          if (!response.success) {
            alert(`Failed to reconnect: ${response.error}`);
          }
        } else {
          alert('Server configuration not found. Please restart the app.');
        }
      }
      
      // Reload servers
      await loadServers();
    } catch (err) {
      alert(`Error toggling server: ${err}`);
    }
  };

  const handleRefresh = () => {
    loadServers();
  };

  if (loading) {
    return (
      <div style={{ padding: '16px' }}>
        <p style={{ color: '#6b7280' }}>Loading MCP servers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
          <p style={{ color: '#991b1b', fontSize: '14px' }}>Error: {error}</p>
          <button
            onClick={handleRefresh}
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>MCP Servers</h3>
        <button
          onClick={handleRefresh}
          style={{
            padding: '6px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {servers.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '14px' }}>No MCP servers configured</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {servers.map((server) => (
            <div
              key={server.name}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                background: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: server.connected ? '#10b981' : '#9ca3af'
                      }}
                    ></span>
                    <h4 style={{ margin: 0, fontWeight: '500', color: '#111827' }}>{server.name}</h4>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 16px' }}>
                    {server.connected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                
                <button
                  onClick={() => handleToggleServer(server)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    border: 'none',
                    background: server.connected ? '#fef2f2' : '#f0fdf4',
                    color: server.connected ? '#991b1b' : '#166534'
                  }}
                >
                  {server.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>

              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Tools available: <span style={{ fontWeight: '500' }}>{server.toolCount}</span>
                </p>
                {server.error && (
                  <p style={{ color: '#dc2626', marginTop: '4px' }}>Error: {server.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
        <p style={{ fontSize: '14px', color: '#1e40af', margin: 0 }}>
          <strong>Note:</strong> MCP servers are configured in the application code.
          Restart the app to connect to enabled servers.
        </p>
      </div>
    </div>
  );
}

