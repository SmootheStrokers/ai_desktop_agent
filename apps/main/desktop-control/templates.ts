/**
 * DEPRECATED: These templates are only used as fallbacks.
 * The AI Desktop Agent now uses AI to generate projects dynamically.
 * 
 * These templates remain for:
 * 1. Emergency fallback if AI generation fails
 * 2. Example reference for project structure
 * 
 * DO NOT add new templates here - the system should use AI for ALL project generation.
 */

import { ProjectScaffold } from './types';
import * as path from 'path';
import * as os from 'os';
import { app } from 'electron';

export class ProjectTemplates {
  /**
   * Get a reliable project path that avoids OneDrive and sync issues
   */
  private static getReliableProjectPath(projectName: string): string {
    // Try multiple locations in order of preference
    const possiblePaths = [
      // User profile directory (C:/Users/username/AI-Projects)
      path.join(os.homedir(), 'AI-Projects', projectName),
      
      // Desktop (easy to find)
      path.join(os.homedir(), 'Desktop', 'AI-Projects', projectName),
      
      // Local AppData (always accessible)
      path.join(process.env.LOCALAPPDATA || os.homedir(), 'AI-Projects', projectName),
      
      // Temp directory (fallback)
      path.join(os.tmpdir(), 'AI-Projects', projectName)
    ];
    
    // Use the first path that doesn't contain OneDrive
    for (const testPath of possiblePaths) {
      if (!testPath.toLowerCase().includes('onedrive')) {
        console.log('[Templates] Using project path:', testPath);
        return testPath;
      }
    }
    
    // Fallback to first option
    return possiblePaths[0];
  }

  /**
   * Convert Windows path to file:// URL properly
   */
  private static getFileUrl(directory: string, filename: string): string {
    const fullPath = path.join(directory, filename);
    
    // Convert backslashes to forward slashes and encode properly
    const normalized = fullPath.replace(/\\/g, '/');
    
    // Ensure proper file:/// format (three slashes)
    if (normalized.startsWith('/')) {
      return `file://${normalized}`;
    } else {
      return `file:///${normalized}`;
    }
  }

  static getCalculatorTemplate(projectName: string): ProjectScaffold {
    const baseDir = this.getReliableProjectPath(projectName);
    
    return {
      name: projectName,
      type: 'web_app',
      directory: baseDir,
      files: [
        {
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculator</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="calculator">
        <div class="display" id="display">0</div>
        <div class="buttons">
            <button class="btn" onclick="appendNumber('7')">7</button>
            <button class="btn" onclick="appendNumber('8')">8</button>
            <button class="btn" onclick="appendNumber('9')">9</button>
            <button class="btn operator" onclick="setOperator('÷')">÷</button>
            <button class="btn" onclick="appendNumber('4')">4</button>
            <button class="btn" onclick="appendNumber('5')">5</button>
            <button class="btn" onclick="appendNumber('6')">6</button>
            <button class="btn operator" onclick="setOperator('×')">×</button>
            <button class="btn" onclick="appendNumber('1')">1</button>
            <button class="btn" onclick="appendNumber('2')">2</button>
            <button class="btn" onclick="appendNumber('3')">3</button>
            <button class="btn operator" onclick="setOperator('-')">-</button>
            <button class="btn" onclick="appendNumber('0')">0</button>
            <button class="btn" onclick="appendNumber('.')">.</button>
            <button class="btn equals" onclick="calculate()">=</button>
            <button class="btn operator" onclick="setOperator('+')">+</button>
            <button class="btn clear" onclick="clearDisplay()">C</button>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
          openInEditor: true
        },
        {
          path: 'style.css',
          content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.calculator {
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    width: 320px;
}
.display {
    background: #2d3748;
    color: white;
    font-size: 2.5em;
    padding: 30px;
    text-align: right;
    min-height: 100px;
}
.buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: #e2e8f0;
}
.btn {
    border: none;
    background: white;
    font-size: 1.5em;
    padding: 25px;
    cursor: pointer;
    transition: all 0.3s;
}
.btn:hover { background: #f7fafc; }
.btn.operator { background: #4299e1; color: white; }
.btn.equals { background: #48bb78; color: white; }
.btn.clear { grid-column: span 4; background: #f56565; color: white; }`,
          openInEditor: false
        },
        {
          path: 'script.js',
          content: `let display = document.getElementById('display');
let currentValue = '0';
let previousValue = null;
let operator = null;
let waitingForOperand = false;

function updateDisplay() {
    display.textContent = currentValue;
}

function appendNumber(num) {
    if (waitingForOperand) {
        currentValue = num;
        waitingForOperand = false;
    } else {
        currentValue = currentValue === '0' ? num : currentValue + num;
    }
    updateDisplay();
}

function setOperator(op) {
    const value = parseFloat(currentValue);
    if (previousValue === null) {
        previousValue = value;
    } else if (operator) {
        const result = performCalculation();
        currentValue = \`\${parseFloat(result.toFixed(7))}\`;
        previousValue = parseFloat(currentValue);
    }
    waitingForOperand = true;
    operator = op;
    updateDisplay();
}

function performCalculation() {
    const current = parseFloat(currentValue);
    const previous = previousValue;
    switch (operator) {
        case '+': return previous + current;
        case '-': return previous - current;
        case '×': return previous * current;
        case '÷': return previous / current;
        default: return current;
    }
}

function calculate() {
    if (operator && !waitingForOperand) {
        const result = performCalculation();
        currentValue = \`\${parseFloat(result.toFixed(7))}\`;
        previousValue = null;
        operator = null;
        waitingForOperand = false;
        updateDisplay();
    }
}

function clearDisplay() {
    currentValue = '0';
    previousValue = null;
    operator = null;
    waitingForOperand = false;
    updateDisplay();
}`,
          openInEditor: false
        },
        {
          path: 'README.md',
          content: `# Calculator App\n\nA beautiful calculator built with HTML, CSS, and JavaScript.\n\n## How to Use\n\n1. Open index.html in your browser\n2. Click buttons to calculate\n\nBuilt by AI Desktop Agent 🤖`,
          openInEditor: false
        }
      ],
      commands: [],
      finalActions: [
        {
          type: 'open_url',
          description: 'Opening calculator in browser',
          params: {
            url: this.getFileUrl(baseDir, 'index.html')
          },
          estimatedDuration: 2
        }
      ]
    };
  }

  /**
   * Get template for Weather Application
   */
  static getWeatherAppTemplate(projectName: string): ProjectScaffold {
    const baseDir = this.getReliableProjectPath(projectName);
    
    return {
      name: projectName,
      type: 'web_app',
      directory: baseDir,
      files: [
        {
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weather Dashboard</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌤️ Weather Dashboard</h1>
            <p class="subtitle">Get real-time weather updates for any city</p>
        </div>

        <div class="search-container">
            <input type="text" id="cityInput" placeholder="Enter city name..." />
            <button id="searchBtn" class="search-btn">Search</button>
        </div>

        <div id="loading" class="loading" style="display: none;">
            <div class="spinner"></div>
            <p>Fetching weather data...</p>
        </div>

        <div id="error" class="error" style="display: none;"></div>

        <div id="weatherData" class="weather-container" style="display: none;">
            <div class="current-weather">
                <div class="location">
                    <h2 id="cityName"></h2>
                    <p id="date"></p>
                </div>
                <div class="temperature">
                    <span id="temp" class="temp-value"></span>
                    <span class="temp-unit">°C</span>
                </div>
                <div class="weather-info">
                    <div class="weather-icon" id="weatherIcon"></div>
                    <p id="description" class="description"></p>
                </div>
                <div class="details">
                    <div class="detail-item">
                        <span class="label">Feels Like</span>
                        <span id="feelsLike"></span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Humidity</span>
                        <span id="humidity"></span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Wind Speed</span>
                        <span id="windSpeed"></span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Pressure</span>
                        <span id="pressure"></span>
                    </div>
                </div>
            </div>

            <div class="forecast-title">
                <h3>5-Day Forecast</h3>
            </div>
            <div id="forecast" class="forecast-container"></div>
        </div>

        <div class="instructions" id="instructions">
            <h3>How to use:</h3>
            <ol>
                <li>Get a free API key from <a href="https://openweathermap.org/api" target="_blank">OpenWeatherMap</a></li>
                <li>Open the JavaScript file (script.js) in the code editor</li>
                <li>Replace 'YOUR_API_KEY_HERE' with your actual API key</li>
                <li>Refresh this page and search for any city!</li>
            </ol>
            <p class="note">📝 Without an API key, the app will show demo data for testing.</p>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>`,
          openInEditor: true
        },
        {
          path: 'style.css',
          content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.container {
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 900px;
    width: 100%;
    padding: 40px;
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.header {
    text-align: center;
    margin-bottom: 30px;
}

.header h1 {
    font-size: 2.5em;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 10px;
}

.subtitle {
    color: #718096;
    font-size: 1.1em;
}

.search-container {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
}

#cityInput {
    flex: 1;
    padding: 15px 20px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1em;
    transition: border-color 0.3s;
}

#cityInput:focus {
    outline: none;
    border-color: #667eea;
}

.search-btn {
    padding: 15px 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.search-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.search-btn:active {
    transform: translateY(0);
}

.loading {
    text-align: center;
    padding: 40px;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #e2e8f0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.error {
    background: #fed7d7;
    color: #742a2a;
    padding: 20px;
    border-radius: 10px;
    border: 2px solid #fc8181;
    margin-bottom: 20px;
}

.weather-container {
    animation: fadeIn 0.5s ease-in;
}

.current-weather {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px;
    border-radius: 15px;
    margin-bottom: 30px;
}

.location h2 {
    font-size: 2em;
    margin-bottom: 5px;
}

.location p {
    opacity: 0.9;
    font-size: 1.1em;
}

.temperature {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 30px 0;
}

.temp-value {
    font-size: 5em;
    font-weight: bold;
}

.temp-unit {
    font-size: 2em;
    margin-left: 10px;
}

.weather-info {
    text-align: center;
    margin-bottom: 30px;
}

.weather-icon {
    font-size: 4em;
    margin-bottom: 10px;
}

.description {
    font-size: 1.5em;
    text-transform: capitalize;
}

.details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
}

.detail-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.detail-item .label {
    font-size: 0.9em;
    opacity: 0.8;
    margin-bottom: 5px;
}

.detail-item span:last-child {
    font-size: 1.2em;
    font-weight: 600;
}

.forecast-title {
    margin-bottom: 20px;
}

.forecast-title h3 {
    color: #2d3748;
    font-size: 1.5em;
}

.forecast-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
}

.forecast-item {
    background: #f7fafc;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
}

.forecast-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.forecast-item .day {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 10px;
}

.forecast-item .icon {
    font-size: 2.5em;
    margin: 10px 0;
}

.forecast-item .temp {
    font-size: 1.3em;
    color: #667eea;
    font-weight: bold;
}

.forecast-item .desc {
    color: #718096;
    font-size: 0.9em;
    margin-top: 5px;
    text-transform: capitalize;
}

.instructions {
    background: #fef5e7;
    border: 2px solid #f39c12;
    border-radius: 10px;
    padding: 25px;
    margin-top: 30px;
}

.instructions h3 {
    color: #d68910;
    margin-bottom: 15px;
}

.instructions ol {
    margin-left: 20px;
    color: #2d3748;
}

.instructions li {
    margin: 10px 0;
    line-height: 1.6;
}

.instructions a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
}

.instructions a:hover {
    text-decoration: underline;
}

.note {
    margin-top: 15px;
    color: #718096;
    font-style: italic;
}

@media (max-width: 600px) {
    .container {
        padding: 20px;
    }
    
    .header h1 {
        font-size: 2em;
    }
    
    .temp-value {
        font-size: 3.5em;
    }
    
    .details {
        grid-template-columns: repeat(2, 1fr);
    }
}`,
          openInEditor: false
        },
        {
          path: 'script.js',
          content: `// OpenWeatherMap API Configuration
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your API key from https://openweathermap.org/api
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const weatherData = document.getElementById('weatherData');
const instructions = document.getElementById('instructions');

// Weather icon mapping
const weatherIcons = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
};

// Event Listeners
searchBtn.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

// Initialize with default city
window.addEventListener('load', () => {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showDemoData();
    } else {
        searchWeather('London');
    }
});

async function searchWeather(defaultCity) {
    const city = defaultCity || cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    // Check if API key is set
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showDemoData();
        return;
    }
    
    showLoading();
    hideError();
    hideWeather();
    
    try {
        // Fetch current weather
        const currentResponse = await fetch(
            \`\${API_BASE_URL}/weather?q=\${city}&units=metric&appid=\${API_KEY}\`
        );
        
        if (!currentResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentData = await currentResponse.json();
        
        // Fetch 5-day forecast
        const forecastResponse = await fetch(
            \`\${API_BASE_URL}/forecast?q=\${city}&units=metric&appid=\${API_KEY}\`
        );
        
        const forecastData = await forecastResponse.json();
        
        displayWeather(currentData, forecastData);
        hideInstructions();
        
    } catch (err) {
        showError(\`Error: \${err.message}. Please check the city name and try again.\`);
    } finally {
        hideLoading();
    }
}

function displayWeather(current, forecast) {
    // Current weather
    document.getElementById('cityName').textContent = \`\${current.name}, \${current.sys.country}\`;
    document.getElementById('date').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('temp').textContent = Math.round(current.main.temp);
    document.getElementById('weatherIcon').textContent = weatherIcons[current.weather[0].icon] || '🌤️';
    document.getElementById('description').textContent = current.weather[0].description;
    document.getElementById('feelsLike').textContent = \`\${Math.round(current.main.feels_like)}°C\`;
    document.getElementById('humidity').textContent = \`\${current.main.humidity}%\`;
    document.getElementById('windSpeed').textContent = \`\${current.wind.speed} m/s\`;
    document.getElementById('pressure').textContent = \`\${current.main.pressure} hPa\`;
    
    // 5-day forecast (one per day at noon)
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';
    
    const dailyForecasts = forecast.list.filter((item, index) => index % 8 === 0).slice(0, 5);
    
    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = \`
            <div class="day">\${dayName}</div>
            <div class="icon">\${weatherIcons[day.weather[0].icon] || '🌤️'}</div>
            <div class="temp">\${Math.round(day.main.temp)}°C</div>
            <div class="desc">\${day.weather[0].description}</div>
        \`;
        
        forecastContainer.appendChild(forecastItem);
    });
    
    showWeather();
}

function showDemoData() {
    // Display demo data when no API key is set
    const demoCurrentData = {
        name: 'Demo City',
        sys: { country: 'XX' },
        main: {
            temp: 22,
            feels_like: 20,
            humidity: 65,
            pressure: 1013
        },
        weather: [{ description: 'partly cloudy', icon: '02d' }],
        wind: { speed: 3.5 }
    };
    
    const demoForecastData = {
        list: Array(40).fill(null).map((_, i) => ({
            dt: Date.now() / 1000 + (i * 3 * 3600),
            main: { temp: 22 + Math.random() * 5 },
            weather: [{ description: 'sunny', icon: '01d' }]
        }))
    };
    
    displayWeather(demoCurrentData, demoForecastData);
    showError('Demo mode: Add your API key to see real weather data!');
}

function showLoading() {
    loading.style.display = 'block';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
}

function hideError() {
    error.style.display = 'none';
}

function showWeather() {
    weatherData.style.display = 'block';
}

function hideWeather() {
    weatherData.style.display = 'none';
}

function hideInstructions() {
    instructions.style.display = 'none';
}`,
          openInEditor: false
        },
        {
          path: 'README.md',
          content: `# Weather Dashboard

A beautiful weather application that displays current weather and 5-day forecast for any city.

## Features

- 🌤️ Real-time weather data
- 📅 5-day forecast
- 🔍 Search any city worldwide
- 📱 Responsive design
- 🎨 Beautiful UI with animations

## Setup

### Get an API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the dashboard

### Configure the App

1. Open \`script.js\` in your code editor
2. Find the line: \`const API_KEY = 'YOUR_API_KEY_HERE';\`
3. Replace \`YOUR_API_KEY_HERE\` with your actual API key
4. Save the file

### Run the App

1. Open \`index.html\` in your browser
2. Search for any city
3. Enjoy the weather data!

## Demo Mode

Without an API key, the app will show demo data so you can see how it works.

## How to Use

1. Enter a city name in the search box
2. Click "Search" or press Enter
3. View current weather and 5-day forecast
4. Search for different cities as needed

## Technologies

- HTML5
- CSS3 (with animations and gradients)
- Vanilla JavaScript
- OpenWeatherMap API

---

Built by AI Desktop Agent 🤖`,
          openInEditor: false
        }
      ],
      commands: [],
      finalActions: [
        {
          type: 'open_url',
          description: 'Opening weather app in browser',
          params: {
            url: this.getFileUrl(baseDir, 'index.html')
          },
          estimatedDuration: 2
        }
      ]
    };
  }

  /**
   * Get template for Text-to-Speech Voice App
   */
  static getTextToSpeechTemplate(projectName: string): ProjectScaffold {
    const baseDir = this.getReliableProjectPath(projectName);
    
    return {
      name: projectName,
      type: 'web_app',
      directory: baseDir,
      files: [
        {
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Voice - Text to Speech</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎙️ AI Voice Generator</h1>
            <p class="subtitle">Type anything and hear it spoken aloud</p>
        </div>

        <div class="main-content">
            <!-- Voice Selection -->
            <div class="control-group">
                <label for="voiceSelect">Choose Voice:</label>
                <select id="voiceSelect" class="voice-select">
                    <option value="">Loading voices...</option>
                </select>
            </div>

            <!-- Speed Control -->
            <div class="control-group">
                <label for="speedRange">Speed: <span id="speedValue">1.0x</span></label>
                <input type="range" id="speedRange" min="0.5" max="2" step="0.1" value="1" class="slider">
            </div>

            <!-- Pitch Control -->
            <div class="control-group">
                <label for="pitchRange">Pitch: <span id="pitchValue">1.0</span></label>
                <input type="range" id="pitchRange" min="0.5" max="2" step="0.1" value="1" class="slider">
            </div>

            <!-- Text Input -->
            <div class="text-area-container">
                <label for="textInput">Enter text to speak:</label>
                <textarea 
                    id="textInput" 
                    placeholder="Type or paste any text here and I'll say it out loud..."
                    rows="8"
                ></textarea>
                <div class="char-count">
                    <span id="charCount">0</span> characters
                </div>
            </div>

            <!-- Control Buttons -->
            <div class="button-group">
                <button id="speakBtn" class="btn btn-primary">
                    <span class="btn-icon">🔊</span>
                    Speak
                </button>
                <button id="pauseBtn" class="btn btn-secondary" disabled>
                    <span class="btn-icon">⏸️</span>
                    Pause
                </button>
                <button id="resumeBtn" class="btn btn-secondary" disabled>
                    <span class="btn-icon">▶️</span>
                    Resume
                </button>
                <button id="stopBtn" class="btn btn-danger" disabled>
                    <span class="btn-icon">⏹️</span>
                    Stop
                </button>
                <button id="clearBtn" class="btn btn-secondary">
                    <span class="btn-icon">🗑️</span>
                    Clear
                </button>
            </div>

            <!-- Status Display -->
            <div id="status" class="status"></div>

            <!-- Quick Phrases -->
            <div class="quick-phrases">
                <h3>Quick Phrases:</h3>
                <div class="phrase-grid">
                    <button class="phrase-btn" data-text="Hello! How can I help you today?">Greeting</button>
                    <button class="phrase-btn" data-text="Thank you very much!">Thank You</button>
                    <button class="phrase-btn" data-text="I'm an AI-powered text to speech system.">Introduction</button>
                    <button class="phrase-btn" data-text="Have a wonderful day!">Farewell</button>
                    <button class="phrase-btn" data-text="That's absolutely fantastic!">Excitement</button>
                    <button class="phrase-btn" data-text="I understand what you're saying.">Understanding</button>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Built by AI Desktop Agent 🤖</p>
            <p class="info">Uses your browser's built-in speech synthesis</p>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>`,
          openInEditor: true
        },
        {
          path: 'style.css',
          content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.container {
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 800px;
    width: 100%;
    overflow: hidden;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    text-align: center;
}

.header h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
}

.subtitle {
    font-size: 1.1em;
    opacity: 0.9;
}

.main-content {
    padding: 30px;
}

.control-group {
    margin-bottom: 25px;
}

.control-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #2d3748;
}

.voice-select {
    width: 100%;
    padding: 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1em;
    background: white;
    cursor: pointer;
    transition: border-color 0.3s;
}

.voice-select:hover {
    border-color: #667eea;
}

.voice-select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.slider {
    width: 100%;
    height: 8px;
    border-radius: 5px;
    background: #e2e8f0;
    outline: none;
    -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #667eea;
    cursor: pointer;
    transition: transform 0.2s;
}

.slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
}

.slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #667eea;
    cursor: pointer;
    border: none;
}

.text-area-container {
    margin-bottom: 20px;
}

.text-area-container label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #2d3748;
}

textarea {
    width: 100%;
    padding: 15px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1em;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.3s;
}

textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.char-count {
    text-align: right;
    color: #718096;
    font-size: 0.9em;
    margin-top: 5px;
}

.button-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-icon {
    font-size: 1.2em;
}

.btn-primary {
    background: #667eea;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
    background: #718096;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background: #4a5568;
    transform: translateY(-2px);
}

.btn-danger {
    background: #f56565;
    color: white;
}

.btn-danger:hover:not(:disabled) {
    background: #e53e3e;
    transform: translateY(-2px);
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.status {
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: none;
    font-weight: 500;
}

.status.active {
    display: block;
    background: #c6f6d5;
    color: #22543d;
    border: 2px solid #9ae6b4;
}

.status.error {
    display: block;
    background: #fed7d7;
    color: #742a2a;
    border: 2px solid #fc8181;
}

.quick-phrases {
    margin-top: 30px;
    padding-top: 30px;
    border-top: 2px solid #e2e8f0;
}

.quick-phrases h3 {
    color: #2d3748;
    margin-bottom: 15px;
}

.phrase-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
}

.phrase-btn {
    padding: 10px 15px;
    background: #f7fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 500;
}

.phrase-btn:hover {
    background: #667eea;
    color: white;
    border-color: #667eea;
    transform: translateY(-2px);
}

.footer {
    background: #f7fafc;
    padding: 20px;
    text-align: center;
    color: #718096;
}

.footer p {
    margin: 5px 0;
}

.info {
    font-size: 0.9em;
}

@media (max-width: 600px) {
    .button-group {
        flex-direction: column;
    }
    
    .btn {
        width: 100%;
        justify-content: center;
    }
    
    .phrase-grid {
        grid-template-columns: 1fr;
    }
}`,
          openInEditor: false
        },
        {
          path: 'script.js',
          content: `// Text to Speech Controller
class VoiceController {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.isPaused = false;
        
        this.initElements();
        this.initVoices();
        this.attachEventListeners();
    }
    
    initElements() {
        this.textInput = document.getElementById('textInput');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.speedRange = document.getElementById('speedRange');
        this.pitchRange = document.getElementById('pitchRange');
        this.speedValue = document.getElementById('speedValue');
        this.pitchValue = document.getElementById('pitchValue');
        this.charCount = document.getElementById('charCount');
        this.status = document.getElementById('status');
        
        this.speakBtn = document.getElementById('speakBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
    }
    
    initVoices() {
        // Load voices (may need to wait for them to be ready)
        const loadVoices = () => {
            this.voices = this.synth.getVoices();
            
            if (this.voices.length > 0) {
                this.populateVoiceList();
            }
        };
        
        loadVoices();
        
        // Chrome loads voices asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }
    
    populateVoiceList() {
        this.voiceSelect.innerHTML = '';
        
        // Group voices by language
        const voicesByLang = {};
        
        this.voices.forEach((voice, index) => {
            const lang = voice.lang.split('-')[0];
            if (!voicesByLang[lang]) {
                voicesByLang[lang] = [];
            }
            voicesByLang[lang].push({ voice, index });
        });
        
        // Add voices to select, English first
        const languages = Object.keys(voicesByLang).sort((a, b) => {
            if (a === 'en') return -1;
            if (b === 'en') return 1;
            return a.localeCompare(b);
        });
        
        languages.forEach(lang => {
            voicesByLang[lang].forEach(({ voice, index }) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = \`\${voice.name} (\${voice.lang})\`;
                
                // Mark default voice
                if (voice.default) {
                    option.textContent += ' [Default]';
                    option.selected = true;
                }
                
                this.voiceSelect.appendChild(option);
            });
        });
    }
    
    attachEventListeners() {
        // Text input character count
        this.textInput.addEventListener('input', () => {
            this.charCount.textContent = this.textInput.value.length;
        });
        
        // Speed slider
        this.speedRange.addEventListener('input', (e) => {
            this.speedValue.textContent = \`\${e.target.value}x\`;
        });
        
        // Pitch slider
        this.pitchRange.addEventListener('input', (e) => {
            this.pitchValue.textContent = e.target.value;
        });
        
        // Control buttons
        this.speakBtn.addEventListener('click', () => this.speak());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resumeBtn.addEventListener('click', () => this.resume());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.clearBtn.addEventListener('click', () => this.clear());
        
        // Quick phrases
        document.querySelectorAll('.phrase-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-text');
                this.textInput.value = text;
                this.charCount.textContent = text.length;
                this.speak();
            });
        });
        
        // Enter key to speak (Ctrl+Enter)
        this.textInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.speak();
            }
        });
    }
    
    speak() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.showStatus('Please enter some text to speak!', 'error');
            return;
        }
        
        // Stop any ongoing speech
        this.synth.cancel();
        
        // Create new utterance
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        
        // Set voice
        const selectedIndex = this.voiceSelect.value;
        if (selectedIndex !== '') {
            this.currentUtterance.voice = this.voices[selectedIndex];
        }
        
        // Set speed and pitch
        this.currentUtterance.rate = parseFloat(this.speedRange.value);
        this.currentUtterance.pitch = parseFloat(this.pitchRange.value);
        
        // Event handlers
        this.currentUtterance.onstart = () => {
            this.showStatus('🔊 Speaking...', 'active');
            this.updateButtonStates('speaking');
        };
        
        this.currentUtterance.onend = () => {
            this.showStatus('✓ Finished speaking', 'active');
            this.updateButtonStates('idle');
            setTimeout(() => this.hideStatus(), 2000);
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('Speech error:', event);
            this.showStatus('Error: Could not speak text', 'error');
            this.updateButtonStates('idle');
        };
        
        // Speak
        this.synth.speak(this.currentUtterance);
        this.isPaused = false;
    }
    
    pause() {
        if (this.synth.speaking && !this.isPaused) {
            this.synth.pause();
            this.isPaused = true;
            this.showStatus('⏸️ Paused', 'active');
            this.updateButtonStates('paused');
        }
    }
    
    resume() {
        if (this.synth.speaking && this.isPaused) {
            this.synth.resume();
            this.isPaused = false;
            this.showStatus('🔊 Speaking...', 'active');
            this.updateButtonStates('speaking');
        }
    }
    
    stop() {
        this.synth.cancel();
        this.isPaused = false;
        this.showStatus('⏹️ Stopped', 'active');
        this.updateButtonStates('idle');
        setTimeout(() => this.hideStatus(), 2000);
    }
    
    clear() {
        this.textInput.value = '';
        this.charCount.textContent = '0';
        this.stop();
    }
    
    updateButtonStates(state) {
        switch (state) {
            case 'speaking':
                this.speakBtn.disabled = true;
                this.pauseBtn.disabled = false;
                this.resumeBtn.disabled = true;
                this.stopBtn.disabled = false;
                break;
                
            case 'paused':
                this.speakBtn.disabled = true;
                this.pauseBtn.disabled = true;
                this.resumeBtn.disabled = false;
                this.stopBtn.disabled = false;
                break;
                
            case 'idle':
            default:
                this.speakBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.resumeBtn.disabled = true;
                this.stopBtn.disabled = true;
                break;
        }
    }
    
    showStatus(message, type) {
        this.status.textContent = message;
        this.status.className = \`status \${type}\`;
    }
    
    hideStatus() {
        this.status.className = 'status';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const voiceController = new VoiceController();
    console.log('AI Voice Generator initialized');
});`,
          openInEditor: false
        },
        {
          path: 'README.md',
          content: `# AI Voice Generator - Text to Speech

A beautiful web-based text-to-speech application that converts any text into spoken words using your browser's built-in speech synthesis.

## Features

- 🎙️ **Multiple Voices**: Choose from dozens of different voices
- ⚡ **Speed Control**: Adjust speaking speed from 0.5x to 2x
- 🎵 **Pitch Control**: Modify voice pitch for different effects
- ⏸️ **Playback Controls**: Pause, resume, and stop speech
- 🔤 **Character Counter**: Track text length
- 🎯 **Quick Phrases**: Pre-loaded common phrases
- 🎨 **Beautiful UI**: Modern, responsive design

## How to Use

1. Open \`index.html\` in your browser
2. Select a voice from the dropdown
3. Adjust speed and pitch if desired
4. Type or paste text
5. Click "Speak" or press Ctrl+Enter

## Keyboard Shortcuts

- **Ctrl+Enter**: Start speaking
- **Tab**: Navigate between controls

## Browser Compatibility

Works in all modern browsers with Web Speech API support:
- Chrome/Edge (Best support)
- Safari
- Firefox

## Technical Details

Uses the Web Speech API (SpeechSynthesis interface) which is built into modern browsers. No external APIs or internet connection required after loading the page.

Built by AI Desktop Agent 🤖
`,
          openInEditor: false
        }
      ],
      commands: [],
      finalActions: [
        {
          type: 'open_url',
          description: 'Opening AI Voice Generator in browser',
          params: {
            url: this.getFileUrl(baseDir, 'index.html')
          },
          estimatedDuration: 2
        }
      ]
    };
  }

  /**
   * Baseball Statistics Analyzer Template
   */
  static getBaseballStatsTemplate(projectName: string): ProjectScaffold {
    const baseDir = this.getReliableProjectPath(projectName);
    
    return {
      name: projectName,
      type: 'node_api',
      directory: baseDir,
      files: [
        {
          path: 'package.json',
          content: JSON.stringify({
            name: 'baseball-stats-analyzer',
            version: '1.0.0',
            description: 'Baseball statistics analyzer tool',
            main: 'src/index.js',
            scripts: {
              start: 'node src/index.js',
              dev: 'nodemon src/index.js',
              test: 'jest'
            },
            dependencies: {
              express: '^4.18.2',
              dotenv: '^16.0.3',
              cors: '^2.8.5',
              axios: '^1.6.0'
            },
            devDependencies: {
              nodemon: '^3.0.1',
              jest: '^29.7.0'
            }
          }, null, 2),
          openInEditor: false
        },
        {
          path: 'src/index.js',
          content: `const express = require('express');
const cors = require('cors');
const statsRoutes = require('./routes/stats');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(\`Baseball Stats Analyzer running on http://localhost:\${PORT}\`);
});`,
          openInEditor: true
        },
        {
          path: 'src/routes/stats.js',
          content: `const express = require('express');
const router = express.Router();
const { calculateBattingAverage, calculateSlugPct, calculateOPS } = require('../utils/calculations');

// Get batting statistics
router.post('/batting', (req, res) => {
  try {
    const { hits, atBats, singles, doubles, triples, homeRuns, walks } = req.body;
    
    const avg = calculateBattingAverage(hits, atBats);
    const slugPct = calculateSlugPct(singles, doubles, triples, homeRuns, atBats);
    const obp = (hits + walks) / (atBats + walks);
    const ops = calculateOPS(obp, slugPct);
    
    res.json({
      battingAverage: avg.toFixed(3),
      sluggingPercentage: slugPct.toFixed(3),
      onBasePercentage: obp.toFixed(3),
      OPS: ops.toFixed(3)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Compare two players
router.post('/compare', (req, res) => {
  try {
    const { player1, player2 } = req.body;
    
    const comparison = {
      player1: {
        name: player1.name,
        avg: calculateBattingAverage(player1.hits, player1.atBats)
      },
      player2: {
        name: player2.name,
        avg: calculateBattingAverage(player2.hits, player2.atBats)
      }
    };
    
    comparison.winner = comparison.player1.avg > comparison.player2.avg ? player1.name : player2.name;
    
    res.json(comparison);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;`,
          openInEditor: false
        },
        {
          path: 'src/utils/calculations.js',
          content: `/**
 * Calculate batting average
 */
function calculateBattingAverage(hits, atBats) {
  if (atBats === 0) return 0;
  return hits / atBats;
}

/**
 * Calculate slugging percentage
 */
function calculateSlugPct(singles, doubles, triples, homeRuns, atBats) {
  if (atBats === 0) return 0;
  const totalBases = singles + (doubles * 2) + (triples * 3) + (homeRuns * 4);
  return totalBases / atBats;
}

/**
 * Calculate OPS (On-base Plus Slugging)
 */
function calculateOPS(onBasePercentage, sluggingPercentage) {
  return onBasePercentage + sluggingPercentage;
}

/**
 * Calculate ERA (Earned Run Average)
 */
function calculateERA(earnedRuns, inningsPitched) {
  if (inningsPitched === 0) return 0;
  return (earnedRuns * 9) / inningsPitched;
}

module.exports = {
  calculateBattingAverage,
  calculateSlugPct,
  calculateOPS,
  calculateERA
};`,
          openInEditor: false
        },
        {
          path: 'public/index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Baseball Stats Analyzer</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>⚾ Baseball Statistics Analyzer</h1>
        
        <div class="card">
            <h2>Calculate Batting Statistics</h2>
            <div class="form-group">
                <label>Hits:</label>
                <input type="number" id="hits" value="0">
            </div>
            <div class="form-group">
                <label>At Bats:</label>
                <input type="number" id="atBats" value="0">
            </div>
            <div class="form-group">
                <label>Singles:</label>
                <input type="number" id="singles" value="0">
            </div>
            <div class="form-group">
                <label>Doubles:</label>
                <input type="number" id="doubles" value="0">
            </div>
            <div class="form-group">
                <label>Triples:</label>
                <input type="number" id="triples" value="0">
            </div>
            <div class="form-group">
                <label>Home Runs:</label>
                <input type="number" id="homeRuns" value="0">
            </div>
            <div class="form-group">
                <label>Walks:</label>
                <input type="number" id="walks" value="0">
            </div>
            <button onclick="calculateStats()">Calculate Stats</button>
        </div>
        
        <div id="results" class="card" style="display: none;">
            <h2>Results</h2>
            <div class="stat">
                <span class="stat-label">Batting Average:</span>
                <span id="avg" class="stat-value"></span>
            </div>
            <div class="stat">
                <span class="stat-label">Slugging %:</span>
                <span id="slug" class="stat-value"></span>
            </div>
            <div class="stat">
                <span class="stat-label">On-Base %:</span>
                <span id="obp" class="stat-value"></span>
            </div>
            <div class="stat">
                <span class="stat-label">OPS:</span>
                <span id="ops" class="stat-value"></span>
            </div>
        </div>
    </div>
    <script src="app.js"></script>
</body>
</html>`,
          openInEditor: false
        },
        {
          path: 'public/style.css',
          content: `body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    margin: 0;
    padding: 20px;
}
.container {
    max-width: 600px;
    margin: 0 auto;
}
h1 {
    color: white;
    text-align: center;
    margin-bottom: 30px;
}
.card {
    background: white;
    border-radius: 10px;
    padding: 25px;
    margin-bottom: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.form-group {
    margin-bottom: 15px;
}
label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
}
input {
    width: 100%;
    padding: 10px;
    border: 2px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
}
button {
    width: 100%;
    padding: 15px;
    background: #1e3c72;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
}
button:hover {
    background: #2a5298;
}
.stat {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}
.stat-label {
    font-weight: 600;
}
.stat-value {
    color: #1e3c72;
    font-weight: bold;
}`,
          openInEditor: false
        },
        {
          path: 'public/app.js',
          content: `async function calculateStats() {
    const hits = parseInt(document.getElementById('hits').value);
    const atBats = parseInt(document.getElementById('atBats').value);
    const singles = parseInt(document.getElementById('singles').value);
    const doubles = parseInt(document.getElementById('doubles').value);
    const triples = parseInt(document.getElementById('triples').value);
    const homeRuns = parseInt(document.getElementById('homeRuns').value);
    const walks = parseInt(document.getElementById('walks').value);
    
    try {
        const response = await fetch('http://localhost:3000/api/stats/batting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hits, atBats, singles, doubles, triples, homeRuns, walks
            })
        });
        
        const data = await response.json();
        
        document.getElementById('avg').textContent = data.battingAverage;
        document.getElementById('slug').textContent = data.sluggingPercentage;
        document.getElementById('obp').textContent = data.onBasePercentage;
        document.getElementById('ops').textContent = data.OPS;
        
        document.getElementById('results').style.display = 'block';
    } catch (error) {
        alert('Error calculating stats: ' + error.message);
    }
}`,
          openInEditor: false
        },
        {
          path: 'README.md',
          content: `# Baseball Statistics Analyzer

A professional baseball statistics analysis tool.

## Features

- Calculate batting average
- Calculate slugging percentage
- Calculate on-base percentage
- Calculate OPS (On-base Plus Slugging)
- Compare players
- Web interface

## Setup

\`\`\`bash
npm install
npm start
\`\`\`

Open http://localhost:3000

## API Endpoints

POST /api/stats/batting - Calculate batting statistics
POST /api/stats/compare - Compare two players

Built by AI Desktop Agent ⚾`,
          openInEditor: false
        },
        {
          path: '.env.example',
          content: 'PORT=3000\nNODE_ENV=development',
          openInEditor: false
        },
        {
          path: '.gitignore',
          content: 'node_modules/\n.env\n*.log\ndist/',
          openInEditor: false
        }
      ],
      commands: [
        {
          command: 'npm install',
          workingDirectory: baseDir,
          description: 'Installing dependencies',
          waitForCompletion: true
        },
        {
          command: 'start powershell -NoExit -Command "cd \'' + baseDir + '\'; npm start"',
          workingDirectory: baseDir,
          description: 'Starting server',
          waitForCompletion: false
        }
      ],
      finalActions: [
        {
          type: 'wait',
          description: 'Waiting for server to start',
          params: { duration: 5 },
          estimatedDuration: 5
        },
        {
          type: 'open_url',
          description: 'Opening Baseball Stats Analyzer',
          params: {
            url: 'http://localhost:3000'
          },
          estimatedDuration: 2
        }
      ]
    };
  }
}

