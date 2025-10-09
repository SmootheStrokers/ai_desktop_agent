# .env.local Quick Reference Card

## 🚀 Quick Setup (30 seconds)

### Option 1: Automated Script
```powershell
# Run the automated setup script
.\create-env-local.ps1
```

### Option 2: Manual Creation
```powershell
# Create .env.local file
@"
CLAUDE_API_KEY=your_claude_key_here
OPENAI_API_KEY=your_openai_key_here
"@ | Out-File -FilePath .env.local -Encoding utf8

# Rebuild and run
npm run build
npm run dev
```

## 📍 File Location
```
C:\Users\willi\OneDrive\Desktop\localdev\.env.local
```

## ✨ What It Does

| Action | Result |
|--------|--------|
| You build a project via chat | AI reads your `.env.local` |
| AI generates project files | Creates `.env` with your API keys |
| You run the generated project | Works immediately - no setup needed! |

## 🔑 Supported Keys

The system will copy **ALL** keys from `.env.local` to generated projects.

Common keys:
- `CLAUDE_API_KEY`
- `OPENAI_API_KEY`
- `WEATHER_API_KEY`
- `STRIPE_SECRET_KEY`
- `FIREBASE_API_KEY`
- Any custom keys you add

## 🎯 Usage Examples

### Example 1: Build a Chat App
```
You: "Build a chat app using OpenAI"

Result:
✅ Project generated
✅ .env file includes OPENAI_API_KEY
✅ App works immediately
```

### Example 2: Build a Weather App
```
You: "Build a weather dashboard"

Result:
✅ Project generated
✅ .env file includes all your API keys
✅ You can add WEATHER_API_KEY to the generated .env
```

## 📝 Common Tasks

### Add a New API Key
```powershell
# Edit .env.local
notepad .env.local

# Add your key
WEATHER_API_KEY=your_key_here

# Save and close
# All future projects will include this key!
```

### View Current Keys
```powershell
# See all keys (be careful - this shows secrets!)
Get-Content .env.local

# See just the key names
Get-Content .env.local | Select-String "^[A-Z]" | ForEach-Object { $_.Line.Split('=')[0] }
```

### Verify File Exists
```powershell
Test-Path .env.local
# Should return: True
```

## 🔒 Security Checklist

- ✅ `.env.local` is in `.gitignore`
- ✅ Never commit this file
- ✅ Never share this file
- ✅ Each generated project gets its own `.env` (also gitignored)
- ✅ Use different keys for development vs production
- ✅ Rotate keys regularly

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| File not found | Run `.\create-env-local.ps1` |
| Keys not in generated projects | Rebuild: `npm run build` |
| Permission denied | Run PowerShell as Administrator |
| Format error | Ensure format is `KEY=value` (no spaces) |

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `ENV_LOCAL_QUICK_REFERENCE.md` | This file - quick reference |
| `ENV_LOCAL_SETUP.md` | Detailed setup guide |
| `ENV_LOCAL_INTEGRATION_COMPLETE.md` | Technical implementation details |
| `create-env-local.ps1` | Automated setup script |
| `README.md` | Updated with `.env.local` info |

## 💡 Pro Tips

1. **Keep it updated**: Add new keys as you need them
2. **Document custom keys**: Add comments in `.env.local`
3. **Project-specific keys**: Edit the generated project's `.env` after creation
4. **Backup safely**: Store keys in a password manager, not in git

## 🎨 Example .env.local

```env
# Core AI APIs
CLAUDE_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...

# Weather Services
WEATHER_API_KEY=abc123...
OPENWEATHERMAP_API_KEY=xyz789...

# Payment Processing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Database
DATABASE_URL=postgresql://localhost:5432/mydb
REDIS_URL=redis://localhost:6379

# Firebase
FIREBASE_API_KEY=AIza...
FIREBASE_PROJECT_ID=my-project

# Custom APIs
MY_CUSTOM_API_KEY=custom123...
```

## 🚦 Status Indicators

When you generate a project, look for these console logs:

```
✅ [DynamicGenerator] Loaded API keys from .env.local: [ 'CLAUDE_API_KEY', 'OPENAI_API_KEY' ]
✅ [DynamicGenerator] Added .env file with API keys from .env.local
```

Or:

```
✅ [DynamicBuilder] Loaded API keys from .env.local: [ 'CLAUDE_API_KEY', 'OPENAI_API_KEY' ]
✅ [DynamicBuilder] Added .env file with API keys from .env.local
```

## 🔄 Workflow

```
1. Create .env.local (one time)
   └─> Add your API keys

2. Build projects via chat
   └─> AI automatically includes your keys

3. Generated project works immediately
   └─> No manual API key setup needed!

4. Add new keys anytime
   └─> Future projects include them
```

## 📞 Need Help?

1. Check `ENV_LOCAL_SETUP.md` for detailed instructions
2. Run `.\create-env-local.ps1` for automated setup
3. Verify console logs when generating projects
4. Ensure file path matches: `C:\Users\willi\OneDrive\Desktop\localdev\.env.local`

---

**That's it! You're ready to build projects with automatic API key integration! 🎉**

