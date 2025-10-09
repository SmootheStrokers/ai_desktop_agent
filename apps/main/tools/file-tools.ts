import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from './types';

const MAX_READ_SIZE = 10 * 1024; // 10KB
const MAX_WRITE_SIZE = 100 * 1024; // 100KB

function validatePath(filePath: string): void {
  const normalized = path.normalize(filePath);
  if (normalized.includes('..')) {
    throw new Error('Path traversal detected');
  }
}

export const fileReadTool: Tool = {
  name: 'file_read',
  description: 'Read the contents of a file. Maximum file size is 10KB.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the file to read (relative or absolute)'
      }
    },
    required: ['path']
  },
  handler: async ({ path: filePath }) => {
    try {
      validatePath(filePath);
      
      const stats = await fs.stat(filePath);
      if (stats.size > MAX_READ_SIZE) {
        return {
          success: false,
          error: `File size (${stats.size} bytes) exceeds maximum (${MAX_READ_SIZE} bytes)`
        };
      }

      const content = await fs.readFile(filePath, 'utf-8');
      return {
        success: true,
        data: { content, size: stats.size },
        message: `Successfully read ${stats.size} bytes from ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file'
      };
    }
  }
};

export const fileWriteTool: Tool = {
  name: 'file_write',
  description: 'Write content to a file, creating it if it doesn\'t exist. Maximum content size is 100KB.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the file to write'
      },
      content: {
        type: 'string',
        description: 'The content to write to the file'
      }
    },
    required: ['path', 'content']
  },
  handler: async ({ path: filePath, content }) => {
    try {
      validatePath(filePath);
      
      const contentSize = Buffer.byteLength(content, 'utf-8');
      if (contentSize > MAX_WRITE_SIZE) {
        return {
          success: false,
          error: `Content size (${contentSize} bytes) exceeds maximum (${MAX_WRITE_SIZE} bytes)`
        };
      }

      await fs.writeFile(filePath, content, 'utf-8');
      return {
        success: true,
        data: { path: filePath, size: contentSize },
        message: `Successfully wrote ${contentSize} bytes to ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file'
      };
    }
  }
};

export const fileAppendTool: Tool = {
  name: 'file_append',
  description: 'Append content to the end of a file',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the file to append to'
      },
      content: {
        type: 'string',
        description: 'The content to append'
      }
    },
    required: ['path', 'content']
  },
  handler: async ({ path: filePath, content }) => {
    try {
      validatePath(filePath);
      
      const contentSize = Buffer.byteLength(content, 'utf-8');
      if (contentSize > MAX_WRITE_SIZE) {
        return {
          success: false,
          error: `Content size exceeds maximum`
        };
      }

      await fs.appendFile(filePath, content, 'utf-8');
      return {
        success: true,
        message: `Successfully appended ${contentSize} bytes to ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to append to file'
      };
    }
  }
};

export const fileListTool: Tool = {
  name: 'file_list',
  description: 'List files and directories in a given path',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The directory path to list',
        default: '.'
      },
      recursive: {
        type: 'boolean',
        description: 'Whether to list recursively',
        default: false
      }
    },
    required: ['path']
  },
  handler: async ({ path: dirPath, recursive = false }) => {
    try {
      validatePath(dirPath);
      
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const items = await Promise.all(
        entries.map(async entry => {
          const fullPath = path.join(dirPath, entry.name);
          const stats = await fs.stat(fullPath);
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime
          };
        })
      );

      return {
        success: true,
        data: { items, path: dirPath },
        message: `Found ${items.length} items in ${dirPath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list directory'
      };
    }
  }
};

