/**
 * Test script to simulate the chat handler with weather plugin
 */

const { toolRegistry } = require('./dist/main/tools/registry.js');
const { PluginManager } = require('./dist/main/plugins/manager.js');
const { initializeTools } = require('./dist/main/tools/index.js');

async function testChatHandler() {
  console.log('Testing chat handler simulation...');
  
  try {
    // Simulate the exact initialization from the main app
    console.log('\n1. Initializing built-in tools...');
    initializeTools();
    
    console.log('\n2. Initializing plugin manager...');
    const pluginManager = new PluginManager(toolRegistry);
    await pluginManager.initialize();
    
    // Simulate the chat handler logic
    console.log('\n3. Simulating chat handler...');
    const availableTools = toolRegistry.getAll();
    console.log(`[DEBUG] Available tools count: ${availableTools.length}`);
    console.log(`[DEBUG] Available tools:`, availableTools.map(t => t.name));
    
    const toolList = availableTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
    
    const systemPrompt = `You are a helpful AI assistant with access to various tools. Use them when appropriate to help the user.

Available Tools:
${toolList}

When the user asks "what tools do you have" or similar questions, list these specific tools above, not generic capabilities.
When asked about weather, use the get_weather tool. When asked about GitHub, use the GitHub tools.
When asked about system information or file operations, use the localops MCP tools.`;

    console.log('\n4. System prompt that would be sent to AI:');
    console.log('---');
    console.log(systemPrompt);
    console.log('---');
    
    // Test if weather tool is available
    const weatherTool = toolRegistry.get('get_weather');
    console.log('\n5. Weather tool check:');
    console.log('get_weather tool found:', !!weatherTool);
    
    if (weatherTool) {
      console.log('\n6. Testing weather tool execution:');
      const result = await toolRegistry.execute('get_weather', { location: 'Scottsdale, Arizona' });
      console.log('Weather result:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('Error during chat handler test:', error);
  }
}

testChatHandler();
