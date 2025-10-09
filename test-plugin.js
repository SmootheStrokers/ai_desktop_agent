// Simple test plugin
module.exports = {
  name: 'test-plugin',
  version: '1.0.0',
  description: 'A simple test plugin',
  author: 'Test',

  async onLoad() {
    console.log('Test plugin loaded successfully');
  },

  async onUnload() {
    console.log('Test plugin unloaded');
  },

  tools: [
    {
      name: 'test_tool',
      description: 'A simple test tool',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Test message' }
        },
        required: ['message']
      },
      handler: async ({ message }) => {
        return {
          success: true,
          data: { result: `Test plugin says: ${message}` },
          message: 'Test tool executed successfully'
        };
      }
    }
  ]
};
