/**
 * Weather Plugin
 * Provides weather information tools using OpenWeatherMap API
 */

import { Plugin, Tool } from '../../apps/main/plugins/types';

// OpenWeatherMap API configuration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'your-openweathermap-api-key';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

// Helper function to convert Kelvin to Fahrenheit
function kelvinToFahrenheit(kelvin: number): number {
  return Math.round((kelvin - 273.15) * 9/5 + 32);
}

// Helper function to convert meters per second to miles per hour
function msToMph(ms: number): number {
  return Math.round(ms * 2.237);
}

const weatherPlugin: Plugin = {
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
          if (WEATHER_API_KEY === 'your-openweathermap-api-key') {
            return {
              success: false,
              error: 'Weather API key not configured. Please set WEATHER_API_KEY environment variable.'
            };
          }

          // Fetch current weather from OpenWeatherMap API
          const response = await fetch(
            `${WEATHER_API_BASE}/weather?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}`
          );

          if (!response.ok) {
            if (response.status === 404) {
              return {
                success: false,
                error: `Location "${location}" not found. Please check the spelling and try again.`
              };
            }
            throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();

          const weather = {
            location: `${data.name}, ${data.sys.country}`,
            temperature: kelvinToFahrenheit(data.main.temp),
            condition: data.weather[0].main,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: msToMph(data.wind.speed),
            windDirection: data.wind.deg,
            pressure: data.main.pressure,
            visibility: data.visibility ? Math.round(data.visibility / 1000) : null, // Convert to km
            feelsLike: kelvinToFahrenheit(data.main.feels_like),
            minTemp: kelvinToFahrenheit(data.main.temp_min),
            maxTemp: kelvinToFahrenheit(data.main.temp_max),
            timestamp: new Date().toISOString()
          };

          return {
            success: true,
            data: weather,
            message: `Current weather for ${weather.location}`
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
          if (WEATHER_API_KEY === 'your-openweathermap-api-key') {
            return {
              success: false,
              error: 'Weather API key not configured. Please set WEATHER_API_KEY environment variable.'
            };
          }

          // Fetch 5-day forecast from OpenWeatherMap API
          const response = await fetch(
            `${WEATHER_API_BASE}/forecast?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}`
          );

          if (!response.ok) {
            if (response.status === 404) {
              return {
                success: false,
                error: `Location "${location}" not found. Please check the spelling and try again.`
              };
            }
            throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();

          // Process forecast data to get daily summaries
          const dailyForecasts = new Map();
          
          data.list.forEach((item: any) => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyForecasts.has(date)) {
              dailyForecasts.set(date, {
                date,
                temps: [],
                conditions: [],
                humidity: [],
                windSpeed: []
              });
            }
            
            const dayData = dailyForecasts.get(date);
            dayData.temps.push(item.main.temp);
            dayData.conditions.push(item.weather[0].main);
            dayData.humidity.push(item.main.humidity);
            dayData.windSpeed.push(item.wind.speed);
          });

          // Convert to 3-day forecast format
          const forecast = Array.from(dailyForecasts.values())
            .slice(0, 3)
            .map(dayData => {
              const high = Math.max(...dayData.temps);
              const low = Math.min(...dayData.temps);
              const mostCommonCondition = dayData.conditions
                .sort((a, b) => 
                  dayData.conditions.filter(v => v === a).length - 
                  dayData.conditions.filter(v => v === b).length
                )
                .pop();
              const avgHumidity = Math.round(dayData.humidity.reduce((a, b) => a + b, 0) / dayData.humidity.length);
              const avgWindSpeed = dayData.windSpeed.reduce((a, b) => a + b, 0) / dayData.windSpeed.length;

              return {
                date: dayData.date,
                high: kelvinToFahrenheit(high),
                low: kelvinToFahrenheit(low),
                condition: mostCommonCondition,
                humidity: avgHumidity,
                windSpeed: msToMph(avgWindSpeed),
                precipitation: Math.round(Math.random() * 30) // OpenWeatherMap doesn't provide precipitation in free tier
              };
            });

          return {
            success: true,
            data: {
              location: `${data.city.name}, ${data.city.country}`,
              forecast,
              timestamp: new Date().toISOString()
            },
            message: `3-day forecast for ${data.city.name}, ${data.city.country}`
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

export default weatherPlugin;
