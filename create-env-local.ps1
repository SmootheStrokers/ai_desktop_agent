# PowerShell Script to Create .env.local File
# This script creates the .env.local file with API keys from config.json

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Creating .env.local for API Key Management" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$envLocalPath = "$PSScriptRoot\.env.local"
$configPath = "$PSScriptRoot\config.json"

# Check if .env.local already exists
if (Test-Path $envLocalPath) {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Cancelled. Existing .env.local was not modified." -ForegroundColor Red
        exit
    }
}

# Try to read API keys from config.json
$claudeKey = ""
$openaiKey = ""

if (Test-Path $configPath) {
    Write-Host "📖 Reading API keys from config.json..." -ForegroundColor Green
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        $claudeKey = $config.claudeApiKey
        $openaiKey = $config.openaiApiKey
        Write-Host "✅ Found API keys in config.json" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not read config.json" -ForegroundColor Yellow
    }
}

# If keys not found in config.json, prompt user
if ([string]::IsNullOrWhiteSpace($claudeKey)) {
    Write-Host ""
    $claudeKey = Read-Host "Enter your Claude API Key (or press Enter to skip)"
}

if ([string]::IsNullOrWhiteSpace($openaiKey)) {
    Write-Host ""
    $openaiKey = Read-Host "Enter your OpenAI API Key (or press Enter to skip)"
}

# Create .env.local content
$envContent = @"
# API Keys for Local Development
# This file is used by the AI agent and passed to generated projects

"@

if (-not [string]::IsNullOrWhiteSpace($claudeKey)) {
    $envContent += @"

# Claude API Key (Anthropic)
CLAUDE_API_KEY=$claudeKey
"@
}

if (-not [string]::IsNullOrWhiteSpace($openaiKey)) {
    $envContent += @"

# OpenAI API Key
OPENAI_API_KEY=$openaiKey
"@
}

$envContent += @"


# Add any other API keys you need for your projects below:
# WEATHER_API_KEY=your_key_here
# STRIPE_SECRET_KEY=your_key_here
# FIREBASE_API_KEY=your_key_here
# GOOGLE_MAPS_API_KEY=your_key_here
# DATABASE_URL=your_database_url
"@

# Write to file
try {
    $envContent | Out-File -FilePath $envLocalPath -Encoding UTF8 -NoNewline
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "✅ Successfully created .env.local!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Location: $envLocalPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔒 Security Note:" -ForegroundColor Yellow
    Write-Host "   - This file is in .gitignore (won't be committed)" -ForegroundColor Gray
    Write-Host "   - Keep it secret and never share it" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✨ What's Next:" -ForegroundColor Cyan
    Write-Host "   1. Rebuild the application: npm run build" -ForegroundColor Gray
    Write-Host "   2. Start the agent: npm run dev" -ForegroundColor Gray
    Write-Host "   3. Build a project: 'Build a chat app using OpenAI'" -ForegroundColor Gray
    Write-Host "   4. Check the generated project's .env file!" -ForegroundColor Gray
    Write-Host ""
    
    # Show what was added
    if (-not [string]::IsNullOrWhiteSpace($claudeKey)) {
        Write-Host "✓ Added CLAUDE_API_KEY" -ForegroundColor Green
    }
    if (-not [string]::IsNullOrWhiteSpace($openaiKey)) {
        Write-Host "✓ Added OPENAI_API_KEY" -ForegroundColor Green
    }
    
    if ([string]::IsNullOrWhiteSpace($claudeKey) -and [string]::IsNullOrWhiteSpace($openaiKey)) {
        Write-Host ""
        Write-Host "⚠️  No API keys were added!" -ForegroundColor Yellow
        Write-Host "   Edit .env.local and add your keys manually." -ForegroundColor Gray
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error creating .env.local: $_" -ForegroundColor Red
    Write-Host "   You may need to create it manually." -ForegroundColor Gray
}

Write-Host ""
Write-Host "📖 For more information, see ENV_LOCAL_SETUP.md" -ForegroundColor Cyan
Write-Host ""

