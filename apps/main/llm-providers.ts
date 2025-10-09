import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Config {
  claudeApiKey?: string;
  openaiApiKey?: string;
}

// Secure configuration: prioritize environment variables over config.json
const configPath = join(__dirname, '../../config.json');

function loadConfig(): Config {
  const config: Config = {};
  
  // First, try environment variables (most secure)
  if (process.env.CLAUDE_API_KEY) {
    config.claudeApiKey = process.env.CLAUDE_API_KEY;
  }
  if (process.env.OPENAI_API_KEY) {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  }
  
  // Fallback to config.json only if env vars not set (for backward compatibility)
  // WARNING: Storing API keys in config.json is insecure and deprecated
  if ((!config.claudeApiKey || !config.openaiApiKey) && existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (!config.claudeApiKey && fileConfig.claudeApiKey) {
        config.claudeApiKey = fileConfig.claudeApiKey;
        console.warn('[SECURITY WARNING] Using API key from config.json. Please migrate to environment variables.');
      }
      if (!config.openaiApiKey && fileConfig.openaiApiKey) {
        config.openaiApiKey = fileConfig.openaiApiKey;
        console.warn('[SECURITY WARNING] Using API key from config.json. Please migrate to environment variables.');
      }
    } catch (error) {
      console.error('Error loading config.json:', error);
    }
  }
  
  return config;
}

function saveConfig(config: Config): void {
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.warn('[SECURITY WARNING] API keys saved to config.json. Consider using environment variables instead.');
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

export function saveApiKey(provider: 'claude' | 'openai', key: string): string {
  const config = loadConfig();
  if (provider === 'claude') {
    config.claudeApiKey = key;
  } else {
    config.openaiApiKey = key;
  }
  saveConfig(config);
  return `${provider} API key saved to config.json. SECURITY WARNING: Consider using environment variables instead.`;
}

export async function callOllama(prompt: string): Promise<string> {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.1',
      prompt: prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}

export async function callClaude(prompt: string): Promise<string> {
  const config = loadConfig();
  if (!config.claudeApiKey) {
    throw new Error('Claude API key not set. Use: setkey claude YOUR_KEY');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.claudeApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function callOpenAI(prompt: string): Promise<string> {
  const config = loadConfig();
  if (!config.openaiApiKey) {
    throw new Error('OpenAI API key not set. Use: setkey openai YOUR_KEY');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
