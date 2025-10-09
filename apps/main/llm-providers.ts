import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Config {
  claudeApiKey?: string;
  openaiApiKey?: string;
}

const configPath = join(__dirname, '../../config.json');

function loadConfig(): Config {
  try {
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return {};
}

function saveConfig(config: Config): void {
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2));
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
  return `${provider} API key saved`;
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
