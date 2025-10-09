/**
 * Test file for MCP Client Manager
 * 
 * This demonstrates how to use the MCP Client Manager to connect to servers
 */
import { mcpClientManager } from './apps/main/mcp';

async function testMCPClientManager() {
  console.log('=== MCP Client Manager Test ===\n');

  // Test connection (will fail since we don't have servers yet - that's expected)
  const testConfig = {
    name: 'test',
    command: ['python', 'mcp/test_server.py'],
    enabled: true,
    description: 'Test MCP server'
  };

  console.log('1. Testing connection to test server...');
  await mcpClientManager.connect(testConfig);

  // Check status
  console.log('\n2. Checking server status...');
  const status = mcpClientManager.getStatus();
  console.log('Server status:', JSON.stringify(status, null, 2));

  // Check if connected
  console.log('\n3. Checking connection state...');
  console.log('Is test server connected?', mcpClientManager.isConnected('test'));

  // Get connected servers
  console.log('\n4. Getting connected servers...');
  const connectedServers = mcpClientManager.getConnectedServers();
  console.log('Connected servers:', connectedServers);

  // Get tools
  console.log('\n5. Getting available tools...');
  const tools = mcpClientManager.getTools();
  console.log(`Total tools available: ${tools.length}`);

  // Cleanup
  console.log('\n6. Disconnecting from all servers...');
  await mcpClientManager.disconnectAll();

  console.log('\n=== Test Complete ===');
}

// Run test
testMCPClientManager()
  .then(() => console.log('\n[MCP] Test completed'))
  .catch(err => console.error('\n[MCP] Test failed:', err));

