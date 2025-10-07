/**
 * MCP Connection Integration Test
 * 
 * Tests the full MCP pipeline:
 * - Connect to Python MCP servers
 * - Discover tools
 * - Execute tool calls
 * - Handle disconnection
 */
import { mcpClientManager } from './apps/main/mcp';
import { resolve } from 'path';

async function testMCPConnection() {
  console.log('=== MCP Connection Integration Test ===\n');

  try {
    // Test 1: Connect to localops server
    console.log('Test 1: Connecting to localops server...');
    await mcpClientManager.connect({
      name: 'localops',
      command: ['python', resolve(__dirname, 'mcp/localops_server.py')],
      enabled: true,
      description: 'Local operations server'
    });

    // Verify connection
    if (mcpClientManager.isConnected('localops')) {
      console.log('✅ localops server connected successfully\n');
    } else {
      throw new Error('Failed to connect to localops server');
    }

    // Test 2: List discovered tools
    console.log('Test 2: Listing discovered tools...');
    const tools = mcpClientManager.getTools('localops');
    console.log(`✅ Found ${tools.length} tools from localops:`);
    tools.forEach(tool => {
      console.log(`  - ${tool.fullName}: ${tool.description}`);
    });
    console.log();

    // Test 3: Call a tool (get_system_info)
    console.log('Test 3: Calling get_system_info tool...');
    const result = await mcpClientManager.callTool('localops', 'get_system_info', {});
    console.log('✅ Tool execution result:', result);
    console.log();

    // Test 4: Connect to websearch server
    console.log('Test 4: Connecting to websearch server...');
    await mcpClientManager.connect({
      name: 'websearch',
      command: ['python', resolve(__dirname, 'mcp/websearch_server.py')],
      enabled: true,
      description: 'Web search server'
    });

    if (mcpClientManager.isConnected('websearch')) {
      console.log('✅ websearch server connected successfully\n');
    }

    // Test 5: Get status of all servers
    console.log('Test 5: Getting status of all servers...');
    const status = mcpClientManager.getStatus();
    console.log('✅ Server status:');
    status.forEach(s => {
      console.log(`  - ${s.name}: ${s.connected ? 'Connected' : 'Disconnected'} (${s.toolCount} tools)`);
    });
    console.log();

    // Test 6: Get all tools from all servers
    console.log('Test 6: Getting all tools from all servers...');
    const allTools = mcpClientManager.getTools();
    console.log(`✅ Total tools available: ${allTools.length}`);
    console.log();

    // Test 7: Disconnect from all servers
    console.log('Test 7: Disconnecting from all servers...');
    await mcpClientManager.disconnectAll();
    console.log('✅ Disconnected successfully\n');

    console.log('=== All Tests Passed ✅ ===');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testMCPConnection()
  .then(() => {
    console.log('\n[MCP] Integration test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n[MCP] Integration test failed:', error);
    process.exit(1);
  });

