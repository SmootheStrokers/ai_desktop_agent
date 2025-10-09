/**
 * Test script to verify plugin loading functionality
 */

const { pluginManager } = require('./dist/main/plugins/manager.js');
const { toolRegistry } = require('./dist/main/tools/registry.js');

async function testPluginLoading() {
  console.log('Testing plugin loading...');
  
  try {
    // Initialize plugin manager
    console.log('\n1. Initializing plugin manager...');
    await pluginManager.initialize();
    
    // Discover plugins
    console.log('\n2. Discovering plugins...');
    const plugins = await pluginManager.discoverPlugins();
    console.log('Discovered plugins:', plugins.map(p => ({ name: p.name, path: p.path })));
    
    // Check loaded plugins
    console.log('\n3. Loaded plugins:');
    const loadedPlugins = pluginManager.getPlugins();
    console.log('Loaded plugins:', loadedPlugins.map(p => p.name));
    
    // Check plugin errors
    console.log('\n4. Plugin errors:');
    const errors = pluginManager.getErrors();
    if (errors.length > 0) {
      errors.forEach(error => console.log(`- ${error.pluginName}: ${error.error}`));
    } else {
      console.log('No plugin errors');
    }
    
    // List all available tools
    console.log('\n5. Available tools:');
    const allTools = toolRegistry.getAllDefinitions();
    allTools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    
    // Test weather tools if available
    console.log('\n6. Checking for get_weather tool...');
    const weatherTool = toolRegistry.get('get_weather');
    console.log('get_weather tool found:', !!weatherTool);
    
    if (weatherTool) {
      console.log('Testing get_weather tool:');
      const weatherResult = await toolRegistry.execute('get_weather', { location: 'New York' });
      console.log('Result:', JSON.stringify(weatherResult, null, 2));
    } else {
      console.log('get_weather tool not found in registry');
    }
    
  } catch (error) {
    console.error('Error testing plugin loading:', error);
  }
}

testPluginLoading();
