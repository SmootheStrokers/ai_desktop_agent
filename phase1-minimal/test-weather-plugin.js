/**
 * Test script to verify weather plugin functionality
 */

const { toolRegistry } = require('./dist/main/tools/registry.js');

async function testWeatherPlugin() {
  console.log('Testing weather plugin...');
  
  try {
    // Test get_weather tool
    console.log('\n1. Testing get_weather tool:');
    const weatherResult = await toolRegistry.execute('get_weather', { location: 'New York' });
    console.log('Result:', JSON.stringify(weatherResult, null, 2));
    
    // Test get_weather_forecast tool
    console.log('\n2. Testing get_weather_forecast tool:');
    const forecastResult = await toolRegistry.execute('get_weather_forecast', { location: 'London' });
    console.log('Result:', JSON.stringify(forecastResult, null, 2));
    
    // List all available tools
    console.log('\n3. Available tools:');
    const allTools = toolRegistry.getAllDefinitions();
    allTools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    
  } catch (error) {
    console.error('Error testing weather plugin:', error);
  }
}

testWeatherPlugin();
