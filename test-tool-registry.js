/**
 * Test script to verify tool registry functionality
 */

const { toolRegistry } = require('./dist/main/tools/registry.js');

async function testToolRegistry() {
  console.log('Testing tool registry...');
  
  try {
    // Register a test tool
    console.log('\n1. Registering test tool...');
    const testTool = {
      name: 'test_tool',
      description: 'A test tool',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        },
        required: ['message']
      },
      handler: async ({ message }) => {
        return { success: true, result: `Test: ${message}` };
      }
    };
    
    toolRegistry.register(testTool);
    console.log('Test tool registered');
    
    // Check if tool is registered
    console.log('\n2. Checking registered tools...');
    const allTools = toolRegistry.getAllDefinitions();
    console.log('Available tools:', allTools.map(t => t.name));
    
    // Test the tool
    console.log('\n3. Testing tool execution...');
    const result = await toolRegistry.execute('test_tool', { message: 'Hello World' });
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error testing tool registry:', error);
  }
}

testToolRegistry();
