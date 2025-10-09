# 🔐 Security Guide - API Configuration

## Quick Start: Secure Setup

### 1. Create .env File (Recommended Method)

```bash
# Copy the template
cp .env.example .env
```

Edit `.env` with your API keys:
```env
CLAUDE_API_KEY=sk-ant-api03-your-actual-key
OPENAI_API_KEY=sk-proj-your-actual-key
```

### 2. Run the Application

```bash
npm run build
npm run dev
```

The application will automatically use environment variables for API keys.

---

## Configuration Methods (Security Ranking)

### 🥇 Method 1: System Environment Variables (Most Secure)

**Windows PowerShell:**
```powershell
[System.Environment]::SetEnvironmentVariable('CLAUDE_API_KEY', 'your-key', 'User')
[System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', 'your-key', 'User')
```

**macOS/Linux:**
```bash
export CLAUDE_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
```

### 🥈 Method 2: .env File (Recommended)

Create `.env` in project root:
```env
CLAUDE_API_KEY=your-key
OPENAI_API_KEY=your-key
```

**Note:** `.env` files are automatically ignored by Git

### 🥉 Method 3: config.json (Deprecated, Not Secure)

⚠️ **NOT RECOMMENDED** - Only for backward compatibility

You'll see security warnings if using this method.

---

## Security Best Practices

### ✅ DO:
- Use environment variables
- Keep `.env` in `.gitignore` (already configured)
- Rotate API keys regularly (every 90 days)
- Set spending limits on API platforms
- Use different keys for dev/prod environments
- Monitor API usage regularly

### ❌ DON'T:
- Commit API keys to Git
- Share API keys via chat/email
- Use production keys for development
- Hardcode API keys in source code
- Share config.json files
- Push config.json to repositories

---

## Troubleshooting

### Problem: "API key not set" error

**Solution:** Check that environment variables are set:
```bash
# Windows PowerShell
echo $env:CLAUDE_API_KEY

# macOS/Linux
echo $CLAUDE_API_KEY
```

### Problem: Security warnings in console

**Cause:** Application is loading keys from `config.json`  
**Solution:** Migrate to environment variables (see Method 1 or 2 above)

### Problem: Application can't find .env file

**Cause:** .env file not in project root  
**Solution:** Ensure `.env` is in the same directory as `package.json`

---

## Getting API Keys

### Anthropic (Claude)
1. Visit: https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Copy the key (starts with `sk-ant-api03-`)
4. Save securely in your environment variables

### OpenAI
1. Visit: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-` or `sk-`)
4. Save securely in your environment variables

---

## Additional Resources

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Git Security Best Practices](https://docs.github.com/en/code-security)
- [Environment Variables Guide](https://en.wikipedia.org/wiki/Environment_variable)

---

**For full security remediation details, see:** `SECURITY_REMEDIATION.md`

