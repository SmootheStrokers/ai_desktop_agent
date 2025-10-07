/**
 * Debug script to check what tools are available
 */

const { toolRegistry } = require('./dist/main/tools/registry.js');

console.log('Available tools:');
const tools = toolRegistry.getAllDefinitions();
tools.forEach(tool => {
  console.log(`- ${tool.name}: ${tool.description}`);
});

console.log(`\nTotal tools: ${tools.length}`);

// Check specifically for weather tools
const weatherTool = toolRegistry.get('get_weather');
console.log(`\nget_weather tool found: ${!!weatherTool}`);

if (weatherTool) {
  console.log('Weather tool details:', {
    name: weatherTool.name,
    description: weatherTool.description,
    parameters: weatherTool.parameters
  });
}
