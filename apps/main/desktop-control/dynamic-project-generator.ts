import { ProjectScaffold } from './types';
import { getProvider } from '../llm-providers-enhanced';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export class DynamicProjectGenerator {
  // Path to the local .env.local file containing API keys
  private readonly ENV_LOCAL_PATH = 'C:\\Users\\willi\\OneDrive\\Desktop\\localdev\\.env.local';
  
  /**
   * Load API keys from the local .env.local file
   */
  private loadApiKeysFromEnvLocal(): Record<string, string> {
    try {
      if (fs.existsSync(this.ENV_LOCAL_PATH)) {
        const content = fs.readFileSync(this.ENV_LOCAL_PATH, 'utf-8');
        const keys: Record<string, string> = {};
        
        // Parse .env format
        content.split('\n').forEach(line => {
          line = line.trim();
          // Skip comments and empty lines
          if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              keys[key.trim()] = valueParts.join('=').trim();
            }
          }
        });
        
        console.log('[DynamicGenerator] Loaded API keys from .env.local:', Object.keys(keys));
        return keys;
      } else {
        console.warn('[DynamicGenerator] .env.local not found at:', this.ENV_LOCAL_PATH);
        return {};
      }
    } catch (error) {
      console.error('[DynamicGenerator] Error loading .env.local:', error);
      return {};
    }
  }
  /**
   * Generate a complete project scaffold from a natural language description
   */
  async generateProject(userRequest: string): Promise<ProjectScaffold> {
    console.log('[DynamicGenerator] Generating project for:', userRequest);
    
    const provider = getProvider('claude');
    
    const prompt = `You are an expert full-stack developer. Generate a PRODUCTION-READY project with all necessary build tools, configurations, and deployment prep.

USER REQUEST: "${userRequest}"

CRITICAL REQUIREMENTS:
1. Respond with VALID JSON only - properly escape ALL strings
2. Include ALL production necessities (.gitignore, build scripts, env files, etc.)
3. Add PowerShell/npm commands for complete setup and build
4. Make it deployment-ready

ESCAPING RULES (CRITICAL):
- Every " inside content must be \\"
- Every newline must be \\n
- Every \\ must be \\\\
- No unescaped quotes or newlines

JSON STRUCTURE:
{
  "projectName": "my-app-name",
  "projectType": "web_app" | "node_api" | "react_app" | "python_script",
  "description": "Brief description",
  "technology": "HTML/CSS/JS" | "React" | "Node.js" | "Python",
  "files": [
    {
      "path": "index.html",
      "content": "ESCAPED CODE",
      "openInEditor": true
    },
    {
      "path": ".gitignore",
      "content": "node_modules/\\n.env\\n",
      "openInEditor": false
    },
    {
      "path": ".env.example",
      "content": "# Environment variables\\n",
      "openInEditor": false
    }
  ],
  "setupCommands": [
    {
      "command": "npm install",
      "description": "Installing dependencies",
      "shell": "powershell"
    }
  ],
  "buildCommands": [
    {
      "command": "npm run build",
      "description": "Building for production",
      "shell": "powershell"
    }
  ],
  "dependencies": {
    "npm": ["express", "dotenv"],
    "pip": ["flask", "python-dotenv"]
  },
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "build": "webpack --mode production",
    "test": "jest"
  },
  "openInBrowser": true,
  "entryFile": "index.html"
}

PRODUCTION FEATURES TO INCLUDE:
1. **.gitignore** - Proper ignore patterns (node_modules, .env, dist, etc.)
2. **.env.example** - Template for environment variables
3. **README.md** - Complete setup and deployment instructions
4. **Build scripts** - Production build commands (if needed)
5. **package.json** - With proper scripts (start, dev, build, test)
6. **Error handling** - Proper error handling in all code
7. **Security** - No hardcoded secrets, proper validation
8. **Optimization** - Minification, bundling (if complex app)

COMMANDS YOU CAN USE:
- npm install, npm run build, npm start
- pip install -r requirements.txt
- webpack, rollup, vite (for bundling)
- PowerShell commands for setup
- git init (for version control)
- Any other setup commands needed

TECHNOLOGY SELECTION:
- **Simple web apps**: HTML + CSS + vanilla JS (no build needed)
- **Interactive SPAs**: React/Vue with build tools
- **APIs**: Node.js + Express or Python + Flask
- **Full-stack**: React frontend + Node backend
- **Scripts**: Python or Node.js

Generate ONLY valid JSON (no markdown):`;


    try {
      const result = await provider.chat([
        { role: 'user', content: prompt }
      ]);
      
      const content = this.extractContent(result);
      console.log('[DynamicGenerator] LLM Response length:', content.length);
      
      // Try to extract and parse JSON with multiple strategies
      let projectSpec: any = null;
      let parseError: Error | null = null;
      
      // Strategy 1: Direct JSON parsing
      try {
        projectSpec = JSON.parse(content);
        console.log('[DynamicGenerator] ✓ Direct JSON parse successful');
      } catch (e) {
        parseError = e as Error;
        console.log('[DynamicGenerator] Direct parse failed:', parseError.message);
      }
      
      // Strategy 2: Extract JSON from markdown code blocks
      if (!projectSpec) {
        const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (codeBlockMatch) {
          try {
            projectSpec = JSON.parse(codeBlockMatch[1]);
            console.log('[DynamicGenerator] ✓ Code block parse successful');
          } catch (e) {
            console.log('[DynamicGenerator] Code block parse failed');
          }
        }
      }
      
      // Strategy 3: Find first { to last } and parse
      if (!projectSpec) {
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = content.substring(firstBrace, lastBrace + 1);
          try {
            projectSpec = JSON.parse(jsonStr);
            console.log('[DynamicGenerator] ✓ Brace extraction parse successful');
          } catch (e) {
            console.log('[DynamicGenerator] Brace extraction parse failed');
          }
        }
      }
      
      // Strategy 4: Try to fix common JSON issues
      if (!projectSpec && parseError) {
        try {
          // Remove any markdown artifacts
          let cleaned = content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          
          // Find JSON object
          const match = cleaned.match(/\{[\s\S]*\}/);
          if (match) {
            projectSpec = JSON.parse(match[0]);
            console.log('[DynamicGenerator] ✓ Cleaned parse successful');
          }
        } catch (e) {
          console.log('[DynamicGenerator] Cleaned parse failed');
        }
      }
      
      if (!projectSpec) {
        console.error('[DynamicGenerator] All parsing strategies failed');
        console.error('[DynamicGenerator] Raw content preview:', content.substring(0, 500));
        throw new Error(`Failed to parse AI response as JSON. Original error: ${parseError?.message || 'Unknown'}`);
      }
      
      console.log('[DynamicGenerator] Parsed project spec:', projectSpec.projectName);
      
      // Validate required fields
      if (!projectSpec.projectName || !projectSpec.files || !Array.isArray(projectSpec.files)) {
        throw new Error('Invalid project specification: missing required fields (projectName, files)');
      }
      
      // Convert to ProjectScaffold
      const scaffold = this.convertToScaffold(projectSpec, userRequest);
      
      console.log('[DynamicGenerator] ✓ Generated scaffold with', scaffold.files.length, 'files');
      return scaffold;
      
    } catch (error) {
      console.error('[DynamicGenerator] Generation failed:', error);
      
      // Provide helpful error message
      const errorMsg = (error as Error).message;
      if (errorMsg.includes('JSON') || errorMsg.includes('parse')) {
        throw new Error(`AI generated invalid code format. This is usually temporary. Please try again, or try asking for something simpler like "build a simple calculator".`);
      }
      
      throw new Error(`Failed to generate project: ${errorMsg}`);
    }
  }
  
  /**
   * Convert AI-generated spec to ProjectScaffold format
   */
  private convertToScaffold(spec: any, originalRequest: string): ProjectScaffold {
    const projectName = this.sanitizeProjectName(spec.projectName || 'my-project');
    const baseDir = this.getReliableProjectPath(projectName);    
    console.log('[DynamicGenerator] Converting spec to scaffold...');
    console.log('[DynamicGenerator] Project name:', projectName);
    console.log('[DynamicGenerator] Base directory:', baseDir);
    
    // Convert files
    const files = (spec.files || []).map((file: any) => ({
      path: file.path,
      content: file.content,
      openInEditor: file.openInEditor || false
    }));
    
    console.log('[DynamicGenerator] Files count:', files.length);
    
    // Add production-ready files if not already included
    this.addProductionFiles(files, spec, projectName, originalRequest);
    
    // Convert commands with PowerShell support
    const commands = this.buildCommandList(spec, baseDir);
    
    console.log('[DynamicGenerator] Commands count:', commands.length);
    
    // Determine final actions
    const finalActions: any[] = [];
    
    if (spec.openInBrowser !== false) {
      let url = '';
      
      if (spec.projectType === 'web_app' && spec.entryFile) {
        // Simple HTML file
        url = this.getFileUrl(baseDir, spec.entryFile);
      } else if (spec.projectType === 'web_app') {
        // Default to index.html
        url = this.getFileUrl(baseDir, 'index.html');
      } else if (spec.projectType === 'node_api' || spec.projectType === 'react_app') {
        // Runs on localhost
        url = 'http://localhost:3000';
      }
      
      if (url) {
        finalActions.push({
          type: 'open_url',
          description: 'Opening app in browser',
          params: { url },
          estimatedDuration: 2
        });
      }
    }
    
    return {
      name: projectName,
      type: spec.projectType || 'web_app',
      directory: baseDir,
      files,
      commands,
      finalActions
    };
  }
  
  /**
   * Add production-ready files to the project
   */
  private addProductionFiles(files: any[], spec: any, projectName: string, originalRequest: string): void {
    const fileNames = files.map(f => f.path);
    
    // Load API keys from .env.local
    const apiKeys = this.loadApiKeysFromEnvLocal();
    
    // Add .env file with actual API keys from .env.local
    if (!fileNames.includes('.env') && Object.keys(apiKeys).length > 0) {
      let envContent = '# Environment Variables\n';
      envContent += '# Automatically populated from your .env.local file\n\n';
      
      // Add all API keys from .env.local
      Object.entries(apiKeys).forEach(([key, value]) => {
        envContent += `${key}=${value}\n`;
      });
      
      files.push({
        path: '.env',
        content: envContent,
        openInEditor: false
      });
      
      console.log('[DynamicGenerator] Added .env file with API keys from .env.local');
    }
    
    // Add .gitignore if not present
    if (!fileNames.includes('.gitignore')) {
      let gitignoreContent = '';
      
      if (spec.projectType === 'node_api' || spec.projectType === 'react_app' || spec.dependencies?.npm) {
        gitignoreContent = `# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
*.log
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
`;
      } else if (spec.projectType === 'python_script' || spec.dependencies?.pip) {
        gitignoreContent = `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/

# Environment
.env

# Build
build/
dist/
*.egg-info/
`;
      } else {
        gitignoreContent = `.env
.DS_Store
Thumbs.db
`;
      }
      
      files.push({
        path: '.gitignore',
        content: gitignoreContent,
        openInEditor: false
      });
    }
    
    // Add .env.example if project uses env variables
    if (!fileNames.includes('.env.example') && 
        (spec.projectType === 'node_api' || spec.projectType === 'python_script')) {
      files.push({
        path: '.env.example',
        content: `# Environment Variables
# Copy this file to .env and fill in your values

# Example:
# API_KEY=your_api_key_here
# DATABASE_URL=your_database_url
# PORT=3000
`,
        openInEditor: false
      });
    }
    
    // Add package.json if needed and not present
    if (!fileNames.includes('package.json') && 
        (spec.dependencies?.npm || spec.projectType === 'node_api' || spec.projectType === 'react_app')) {
      const packageJson = {
        name: projectName,
        version: '1.0.0',
        description: spec.description || 'Generated by AI Desktop Agent',
        main: spec.entryFile || 'index.js',
        scripts: spec.scripts || {
          start: this.getStartScript(spec),
          dev: 'nodemon app.js || node app.js',
          build: 'echo "No build step required"'
        },
        dependencies: spec.dependencies?.npm ? this.convertDependencies(spec.dependencies.npm) : {},
        devDependencies: {
          nodemon: '^3.0.1'
        }
      };
      
      files.push({
        path: 'package.json',
        content: JSON.stringify(packageJson, null, 2),
        openInEditor: false
      });
    }
    
    // Add requirements.txt if Python project
    if (!fileNames.includes('requirements.txt') && spec.dependencies?.pip) {
      files.push({
        path: 'requirements.txt',
        content: spec.dependencies.pip.join('\n'),
        openInEditor: false
      });
    }
    
    // Add README.md if not present
    if (!fileNames.includes('README.md')) {
      files.push({
        path: 'README.md',
        content: this.generateReadme(spec, originalRequest),
        openInEditor: false
      });
    }
  }
  
  /**
   * Build comprehensive command list with PowerShell support
   */
  private buildCommandList(spec: any, baseDir: string): any[] {
    const commands: any[] = [];
    
    // Setup commands (from AI or inferred)
    if (spec.setupCommands && Array.isArray(spec.setupCommands)) {
      for (const cmd of spec.setupCommands) {
        commands.push({
          command: cmd.command,
          workingDirectory: baseDir,
          description: cmd.description || cmd.command,
          waitForCompletion: true,
          shell: cmd.shell || 'powershell',
          env: cmd.env
        });
      }
    } else {
      // Infer setup commands
      if (spec.dependencies?.npm && spec.dependencies.npm.length > 0) {
        commands.push({
          command: 'npm install',
          workingDirectory: baseDir,
          description: 'Installing npm dependencies',
          waitForCompletion: true,
          shell: 'powershell'
        });
      }
      
      if (spec.dependencies?.pip && spec.dependencies.pip.length > 0) {
        commands.push({
          command: 'pip install -r requirements.txt',
          workingDirectory: baseDir,
          description: 'Installing Python dependencies',
          waitForCompletion: true,
          shell: 'powershell'
        });
      }
    }
    
    // Initialize git repository (optional but production-ready)
    commands.push({
      command: 'git init',
      workingDirectory: baseDir,
      description: 'Initializing git repository',
      waitForCompletion: false, // Don't fail if git not installed
      shell: 'powershell'
    });
    
    // Build commands (if specified)
    if (spec.buildCommands && Array.isArray(spec.buildCommands)) {
      for (const cmd of spec.buildCommands) {
        commands.push({
          command: cmd.command,
          workingDirectory: baseDir,
          description: cmd.description || cmd.command,
          waitForCompletion: true,
          shell: cmd.shell || 'powershell',
          env: cmd.env
        });
      }
    }
    
    // Custom commands from spec
    if (spec.commands && Array.isArray(spec.commands)) {
      for (const cmd of spec.commands) {
        commands.push({
          command: cmd.command,
          workingDirectory: baseDir,
          description: cmd.description || cmd.command,
          waitForCompletion: cmd.waitForCompletion !== false,
          shell: cmd.shell || 'powershell',
          env: cmd.env
        });
      }
    }
    
    return commands;
  }

  /**
   * Generate README content
   */
  private generateReadme(spec: any, originalRequest: string): string {
    return `# ${spec.projectName || 'My Project'}

${spec.description || 'Generated by AI Desktop Agent'}

## 📋 About

This project was built in response to: **"${originalRequest}"**

## 🛠️ Technology Stack

- ${spec.technology || 'HTML/CSS/JavaScript'}
${spec.dependencies?.npm ? '- Node.js with npm packages' : ''}
${spec.dependencies?.pip ? '- Python with pip packages' : ''}

## 🚀 Quick Start

${this.getRunInstructions(spec)}

## ✨ Features

${this.getFeaturesList(spec)}

## 📦 Project Structure

\`\`\`
${this.getProjectStructure(spec)}
\`\`\`

## 🔧 Development

${this.getDevelopmentInstructions(spec)}

## 🏗️ Building for Production

${this.getBuildInstructions(spec)}

## 🌐 Deployment

${this.getDeploymentInstructions(spec)}

## 📝 Environment Variables

${this.getEnvironmentInstructions(spec)}

## 🧪 Testing

${this.getTestingInstructions(spec)}

## 📄 License

MIT License

## 🤖 Generated By

AI Desktop Agent - Built with ❤️ by AI

---

**Need help?** Check the code comments or modify as needed!
`;
  }
  
  /**
   * Get run instructions based on project type
   */
  private getRunInstructions(spec: any): string {
    switch (spec.projectType) {
      case 'web_app':
        return '1. Open `index.html` in your browser\n2. That\'s it! The app should work immediately.';
      case 'node_api':
        return '1. Run `npm install` to install dependencies\n2. Run `npm start` to start the server\n3. Open http://localhost:3000 in your browser';
      case 'react_app':
        return '1. Run `npm install` to install dependencies\n2. Run `npm start` to start the development server\n3. Open http://localhost:3000 in your browser';
      case 'python_script':
        return '1. Install dependencies: `pip install -r requirements.txt`\n2. Run the script: `python app.py`';
      default:
        return 'See the code files for specific instructions.';
    }
  }
  
  /**
   * Get features list
   */
  private getFeaturesList(spec: any): string {
    if (spec.features && Array.isArray(spec.features)) {
      return spec.features.map((f: string) => `- ✅ ${f}`).join('\n');
    }
    return '- ✅ Fully functional\n- ✅ Modern UI\n- ✅ Responsive design\n- ✅ Production-ready';
  }
  
  /**
   * Get project structure
   */
  private getProjectStructure(spec: any): string {
    if (spec.projectType === 'node_api' || spec.projectType === 'react_app') {
      return `project/
├── src/
│   ├── app.js          # Main application
│   └── ...
├── package.json        # Dependencies & scripts
├── .env.example        # Environment template
├── .gitignore          # Git ignore rules
└── README.md           # Documentation`;
    } else if (spec.projectType === 'python_script') {
      return `project/
├── app.py              # Main application
├── requirements.txt    # Python dependencies
├── .env.example        # Environment template
├── .gitignore          # Git ignore rules
└── README.md           # Documentation`;
    } else {
      return `project/
├── index.html          # Main HTML file
├── style.css           # Styling
├── script.js           # JavaScript logic
├── .gitignore          # Git ignore rules
└── README.md           # Documentation`;
    }
  }
  
  /**
   * Get development instructions
   */
  private getDevelopmentInstructions(spec: any): string {
    if (spec.projectType === 'node_api' || spec.projectType === 'react_app') {
      return `### Start Development Server

\`\`\`bash
npm run dev
\`\`\`

This will start the development server with hot reload enabled.

### Making Changes

1. Edit files in the \`src/\` directory
2. Changes will automatically reload
3. Check the console for errors`;
    } else if (spec.projectType === 'python_script') {
      return `### Run in Development Mode

\`\`\`bash
python app.py
\`\`\`

### Making Changes

1. Edit the Python files
2. Restart the script to see changes
3. Use a debugger for troubleshooting`;
    } else {
      return `### Development

1. Open \`index.html\` in your browser
2. Edit the HTML, CSS, or JavaScript files
3. Refresh the browser to see changes
4. Use browser DevTools for debugging`;
    }
  }
  
  /**
   * Get build instructions
   */
  private getBuildInstructions(spec: any): string {
    if (spec.scripts?.build && spec.scripts.build !== 'echo "No build step required"') {
      return `### Build for Production

\`\`\`bash
npm run build
\`\`\`

This will create an optimized production build in the \`dist/\` or \`build/\` directory.

### Production Optimizations

- Minified code
- Optimized assets
- Production-ready configuration`;
    } else if (spec.projectType === 'node_api') {
      return `### Production Build

For Node.js apps, there's typically no build step needed. However, ensure:

1. Set \`NODE_ENV=production\`
2. Install only production dependencies: \`npm install --production\`
3. Use a process manager like PM2: \`pm2 start app.js\``;
    } else {
      return `### Production Build

This project doesn't require a build step. The files are already optimized for production use.

Simply deploy the files to your web server or hosting platform.`;
    }
  }
  
  /**
   * Get deployment instructions
   */
  private getDeploymentInstructions(spec: any): string {
    if (spec.projectType === 'node_api' || spec.projectType === 'react_app') {
      return `### Deploy to Production

**Option 1: Vercel (Recommended for Node/React)**
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

**Option 2: Heroku**
\`\`\`bash
git init
heroku create
git push heroku main
\`\`\`

**Option 3: Docker**
\`\`\`bash
docker build -t my-app .
docker run -p 3000:3000 my-app
\`\`\`

**Option 4: Traditional Server**
1. Copy files to server
2. Run \`npm install --production\`
3. Set environment variables
4. Start with PM2: \`pm2 start app.js\``;
    } else if (spec.projectType === 'python_script') {
      return `### Deploy Python Application

**Option 1: Heroku**
\`\`\`bash
heroku create
git push heroku main
\`\`\`

**Option 2: AWS Lambda**
Package your app and deploy as a serverless function.

**Option 3: Traditional Server**
1. Copy files to server
2. Set up Python virtual environment
3. Install dependencies: \`pip install -r requirements.txt\`
4. Run with systemd or supervisor`;
    } else {
      return `### Deploy Static Web App

**Option 1: Netlify**
- Drag and drop your project folder to Netlify

**Option 2: GitHub Pages**
\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`
Then enable GitHub Pages in repository settings.

**Option 3: Vercel**
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

**Option 4: Any Web Server**
Upload files to your web hosting via FTP or cPanel.`;
    }
  }
  
  /**
   * Get environment variables instructions
   */
  private getEnvironmentInstructions(spec: any): string {
    if (spec.projectType === 'node_api' || spec.projectType === 'python_script') {
      return `### Setup Environment Variables

1. Copy the example file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Edit \`.env\` and fill in your values

3. Never commit \`.env\` to version control (already in .gitignore)

### Required Variables

Check \`.env.example\` for all required environment variables.`;
    } else {
      return `### Environment Variables

This project doesn't require environment variables for basic functionality.

If you add API integrations, create a \`.env\` file for sensitive data.`;
    }
  }
  
  /**
   * Get testing instructions
   */
  private getTestingInstructions(spec: any): string {
    if (spec.scripts?.test && spec.scripts.test !== 'echo "No tests yet"') {
      return `### Run Tests

\`\`\`bash
npm test
\`\`\`

### Writing Tests

Add tests in the \`__tests__/\` or \`test/\` directory.`;
    } else {
      return `### Testing

No automated tests are included yet. Consider adding:

- **Jest** for JavaScript testing
- **Pytest** for Python testing  
- **Cypress** for E2E testing

Add tests to ensure code quality and prevent regressions.`;
    }
  }
  
  /**
   * Get start script for package.json
   */
  private getStartScript(spec: any): string {
    if (spec.projectType === 'node_api') {
      return 'node app.js';
    } else if (spec.projectType === 'react_app') {
      return 'react-scripts start';
    }
    return 'node index.js';
  }
  
  /**
   * Convert dependency array to package.json format
   */
  private convertDependencies(deps: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Common version mappings
    const versionMap: Record<string, string> = {
      'express': '^4.18.2',
      'cors': '^2.8.5',
      'body-parser': '^1.20.2',
      'axios': '^1.6.0',
      'dotenv': '^16.3.1',
      'mongoose': '^8.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'react-scripts': '^5.0.1',
      'socket.io': '^4.6.0',
      'ws': '^8.14.0'
    };
    
    for (const dep of deps) {
      result[dep] = versionMap[dep] || 'latest';
    }
    
    return result;
  }
  
  /**
   * Extract text content from LLM response
   */
  private extractContent(result: any): string {
    if (typeof result === 'string') {
      return result;
    }
    
    if (result.content && Array.isArray(result.content)) {
      for (const block of result.content) {
        if (block.type === 'text' && block.text) {
          return block.text;
        }
      }
    }
    
    if (result.content && typeof result.content === 'string') {
      return result.content;
    }
    
    return JSON.stringify(result);
  }
  
  /**
   * Get reliable project path that avoids OneDrive
   */
  private getReliableProjectPath(projectName: string): string {
    const possiblePaths = [
      path.join(os.homedir(), 'AI-Projects', projectName),
      path.join(os.homedir(), 'Desktop', 'AI-Projects', projectName),
      path.join(process.env.LOCALAPPDATA || os.homedir(), 'AI-Projects', projectName),
      path.join(os.tmpdir(), 'AI-Projects', projectName)
    ];
    
    for (const testPath of possiblePaths) {
      if (!testPath.toLowerCase().includes('onedrive')) {
        return testPath;
      }
    }
    
    return possiblePaths[0];
  }
  
  /**
   * Sanitize project name for file system
   */
  private sanitizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  /**
   * Convert file path to file:// URL
   */
  private getFileUrl(directory: string, filename: string): string {
    const fullPath = path.join(directory, filename);
    const normalized = fullPath.replace(/\\/g, '/');
    
    if (normalized.startsWith('/')) {
      return `file://${normalized}`;
    } else {
      return `file:///${normalized}`;
    }
  }
}

