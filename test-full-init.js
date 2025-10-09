/**
 * Test script to simulate full application initialization
 */

const { toolRegistry } = require('./dist/main/tools/registry.js');
const { PluginManager } = require('./dist/main/plugins/manager.js');
const { initializeTools } = require('./dist/main/tools/index.js');

async function testFullInitialization() {
  console.log('Testing full application initialization...');
  
  try {
    // Initialize tools (like the main app does)
    console.log('\n1. Initializing built-in tools...');
    initializeTools();
    
    // Check tools after initialization
    console.log('\n2. Tools after built-in initialization:');
    const tools1 = toolRegistry.getAllDefinitions();
    console.log('Available tools:', tools1.map(t => t.name));
    
    // Initialize plugin manager with tool registry
    console.log('\n3. Initializing plugin manager...');
    const pluginManager = new PluginManager(toolRegistry);
    await pluginManager.initialize();
    
    // Check tools after plugin initialization
    console.log('\n4. Tools after plugin initialization:');
    const tools2 = toolRegistry.getAllDefinitions();
    console.log('Available tools:', tools2.map(t => t.name));
    
    // Test weather tool specifically
    console.log('\n5. Testing weather tool...');
    const weatherTool = toolRegistry.get('get_weather');
    console.log('get_weather tool found:', !!weatherTool);
    
    if (weatherTool) {
      console.log('Testing get_weather tool:');
      const result = await toolRegistry.execute('get_weather', { location: 'Scottsdale, Arizona' });
      console.log('Result:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('Error during initialization:', error);
  }
}

testFullInitialization();
