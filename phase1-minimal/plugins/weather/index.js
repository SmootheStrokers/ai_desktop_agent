/**
 * Weather Plugin - JavaScript Version
 * Provides weather information tools
 */

const weatherPlugin = {
  name: 'weather',
  version: '1.0.0',
  description: 'Get weather information for any location',
  author: 'LocalDev Team',

  async onLoad() {
    console.log('Weather plugin loaded');
  },

  async onUnload() {
    console.log('Weather plugin unloaded');
  },

  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { 
            type: 'string', 
            description: 'City name, state/country, or zip code' 
          }
        },
        required: ['location']
      },
      handler: async ({ location }) => {
        try {
          // Mock weather data
          const mockWeather = {
            location: location,
            temperature: Math.round(Math.random() * 30 + 10), // 10-40°C
            condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
            humidity: Math.round(Math.random() * 40 + 40), // 40-80%
            windSpeed: Math.round(Math.random() * 20 + 5), // 5-25 km/h
            timestamp: new Date().toISOString()
          };

          return {
            success: true,
            data: mockWeather,
            message: `Current weather for ${location}`
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get weather data'
          };
        }
      }
    },
    {
      name: 'get_weather_forecast',
      description: 'Get 3-day weather forecast for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { 
            type: 'string', 
            description: 'City name, state/country, or zip code' 
          }
        },
        required: ['location']
      },
      handler: async ({ location }) => {
        try {
          // Mock 3-day forecast
          const forecast = [];
          for (let i = 0; i < 3; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            forecast.push({
              date: date.toISOString().split('T')[0],
              high: Math.round(Math.random() * 15 + 20), // 20-35°C
              low: Math.round(Math.random() * 10 + 5),   // 5-15°C
              condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
              precipitation: Math.round(Math.random() * 30) // 0-30%
            });
          }

          return {
            success: true,
            data: {
              location,
              forecast,
              timestamp: new Date().toISOString()
            },
            message: `3-day forecast for ${location}`
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get weather forecast'
          };
        }
      }
    }
  ]
};

module.exports = weatherPlugin;
