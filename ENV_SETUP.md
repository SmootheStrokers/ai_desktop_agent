# Environment Variables Setup

This project uses environment variables to securely store API keys and configuration settings.

## Quick Start

1. **Your `.env.local` file is already set up** at:
   ```
   C:\Users\willi\OneDrive\Desktop\localdev\.env.local
   ```

2. **The application will automatically load it** when it starts

3. **Your API keys are now secure** - `.env.local` is in `.gitignore` and won't be committed to Git

## How It Works

### Priority Order
The application loads environment variables in this order:

1. **`.env.local`** (highest priority) - Your personal API keys
2. **`.env`** (fallback) - Shared configuration
3. **`config.json`** (legacy) - Deprecated, shows security warnings

### Supported Environment Variables

```env
# Claude API Key (from https://console.anthropic.com/settings/keys)
CLAUDE_API_KEY=sk-ant-api03-your-key-here

# OpenAI API Key (from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-your-key-here

# MCP Server Configuration
MCP_LOCALOPS_ENABLED=true
MCP_WEBSEARCH_ENABLED=false
```

## File Structure

- **`.env.local`** - Your actual API keys (gitignored, never commit!)
- **`.env.example`** - Template file showing what keys are needed (safe to commit)
- **`.env`** - Optional shared configuration (gitignored)

## Security Features

✅ **`.env.local` is gitignored** - Your keys won't accidentally be committed  
✅ **Environment variables are loaded before any other code** - Keys are available immediately  
✅ **Warnings are shown** if using the old `config.json` method  
✅ **Example file provided** - Easy for other developers to set up  

## Code Implementation

The environment loading happens at the very top of `apps/main/index.ts`:

```typescript
// Load environment variables from .env.local first
import { config as dotenvConfig } from 'dotenv';

const envLocalPath = join(__dirname, '../../.env.local');
if (existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath });
  console.log('[ENV] Loaded environment variables from .env.local');
}
```

## Verifying It Works

When you run the application, you should see in the console:
```
[ENV] Loaded environment variables from .env.local
```

If you see this, your API keys are loaded and ready to use!

## Troubleshooting

### "No .env.local or .env file found"
- Check that `.env.local` exists in the project root
- Verify the file has the correct name (with the dot at the start)
- On Windows, use PowerShell: `Get-ChildItem -Path . -Filter .env* -Force`

### "API key not set" errors
- Ensure the environment variable names are correct (check for typos)
- Verify the keys in `.env.local` match the format shown above
- Try rebuilding: `npm run build`

### Keys not loading
- Make sure you rebuild after any changes: `npm run build`
- Check the console for the `[ENV] Loaded` message
- Verify `.env.local` is in the project root, not in a subdirectory

## Migration from config.json

If you were using `config.json` before:

1. Copy your API keys from `config.json` to `.env.local`
2. Delete or empty `config.json` (it's gitignored)
3. The old method still works as a fallback, but you'll see security warnings

## For Team Members

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your API keys

3. Never commit `.env.local` - it's already in `.gitignore`

4. Run the app: `npm run dev`

