const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up Phase 1 minimal agent...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(path.join(distDir, 'main'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'preload'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'renderer'), { recursive: true });
}

// Fix Electron installation if needed
try {
  console.log('Checking Electron installation...');
  const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe');
  if (!fs.existsSync(electronPath)) {
    console.log('Electron binary not found, rebuilding...');
    execSync('npm run electron:rebuild', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  }
} catch (error) {
  console.log('Electron rebuild failed, trying to reinstall...');
  try {
    execSync('npm uninstall electron && npm install electron', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (reinstallError) {
    console.log('Manual Electron reinstall may be needed. Try: npm install electron --force');
  }
}

console.log('Phase 1 minimal agent setup complete!');
console.log('Run "npm run dev" to start the development server.');
console.log('Make sure Ollama is running on localhost:11434 with llama3.1 model.');
