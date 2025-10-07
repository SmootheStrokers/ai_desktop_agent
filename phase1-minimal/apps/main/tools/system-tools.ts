import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from './types';

const execAsync = promisify(exec);

const BLOCKED_COMMANDS = [
  'rm -rf',
  'format',
  'del /f',
  'dd if=',
  ':(){:|:&};:',  // fork bomb
  'sudo',
  'shutdown',
  'reboot'
];

function isCommandSafe(command: string): boolean {
  const lowerCommand = command.toLowerCase();
  return !BLOCKED_COMMANDS.some(blocked => 
    lowerCommand.includes(blocked.toLowerCase())
  );
}

export const shellExecuteTool: Tool = {
  name: 'shell_execute',
  description: 'Execute a shell command. Dangerous commands are blocked for security.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute'
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds',
        default: 30000
      }
    },
    required: ['command']
  },
  handler: async ({ command, timeout = 30000 }) => {
    if (!isCommandSafe(command)) {
      return {
        success: false,
        error: 'Command blocked for security reasons'
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        maxBuffer: 1024 * 1024 // 1MB
      });

      return {
        success: true,
        data: {
          stdout: stdout.trim(),
          stderr: stderr.trim()
        },
        message: `Command executed: ${command}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command execution failed'
      };
    }
  }
};

export const clipboardReadTool: Tool = {
  name: 'clipboard_read',
  description: 'Read the current contents of the system clipboard',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async () => {
    try {
      const { clipboard } = await import('electron');
      const text = clipboard.readText();
      
      return {
        success: true,
        data: { text },
        message: `Read ${text.length} characters from clipboard`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read clipboard'
      };
    }
  }
};

export const clipboardWriteTool: Tool = {
  name: 'clipboard_write',
  description: 'Write text to the system clipboard',
  parameters: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to write to the clipboard'
      }
    },
    required: ['text']
  },
  handler: async ({ text }) => {
    try {
      const { clipboard } = await import('electron');
      clipboard.writeText(text);
      
      return {
        success: true,
        message: `Wrote ${text.length} characters to clipboard`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write to clipboard'
      };
    }
  }
};

