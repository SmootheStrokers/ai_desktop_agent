# Weather Plugin Setup Guide

The weather plugin now uses the OpenWeatherMap API to provide accurate weather data instead of mock data.

## Setup Instructions

### 1. Get a Free API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to your API keys section
4. Copy your API key

### 2. Configure the API Key

#### Option A: Environment Variable (Recommended)
Set the `WEATHER_API_KEY` environment variable:

**Windows (PowerShell):**
```powershell
$env:WEATHER_API_KEY="your-api-key-here"
```

**Windows (Command Prompt):**
```cmd
set WEATHER_API_KEY=your-api-key-here
```

**Linux/Mac:**
```bash
export WEATHER_API_KEY="your-api-key-here"
```

#### Option B: Direct Configuration
Edit the weather plugin files and replace `'your-openweathermap-api-key'` with your actual API key:

- `phase1-minimal/plugins/weather/index.ts`
- `phase1-minimal/plugins/weather/index.js`

### 3. Test the Weather Plugin

Once configured, you can test the weather plugin by asking:
- "What's the weather in New York?"
- "Get weather forecast for London"
- "Weather in Tokyo"

## Features

### Current Weather
- Temperature (in Fahrenheit)
- Weather condition and description
- Humidity percentage
- Wind speed (in mph) and direction
- Atmospheric pressure
- Visibility
- "Feels like" temperature
- Min/max temperatures

### 3-Day Forecast
- Daily high and low temperatures
- Weather conditions
- Humidity and wind speed averages
- Precipitation chance

## API Limits

The free OpenWeatherMap API includes:
- 1,000 calls per day
- Current weather and 5-day forecast
- No credit card required

## Troubleshooting

### "Weather API key not configured" Error
- Make sure you've set the `WEATHER_API_KEY` environment variable
- Restart the application after setting the environment variable

### "Location not found" Error
- Check the spelling of the location
- Try using "City, Country" format (e.g., "London, UK")
- Try using postal codes for more specific results

### API Rate Limit Exceeded
- The free tier allows 1,000 calls per day
- Wait 24 hours or upgrade to a paid plan for higher limits
