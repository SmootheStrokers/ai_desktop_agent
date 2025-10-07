import { toolRegistry } from './registry';
import {
  fileReadTool,
  fileWriteTool,
  fileAppendTool,
  fileListTool
} from './file-tools';
import {
  browserNavigateTool,
  browserClickTool,
  browserScreenshotTool,
  browserExtractTextTool,
  browserFillFormTool,
  browserExtractLinksTool,
  browserWaitForElementTool,
  browserExtractFormsTool,
  browserEvaluateTool
} from './browser-tools';
import {
  shellExecuteTool,
  clipboardReadTool,
  clipboardWriteTool
} from './system-tools';

/**
 * Initialize and register all built-in tools
 */
export function initializeTools() {
  // File operations
  toolRegistry.register(fileReadTool);
  toolRegistry.register(fileWriteTool);
  toolRegistry.register(fileAppendTool);
  toolRegistry.register(fileListTool);

  // Browser automation
  toolRegistry.register(browserNavigateTool);
  toolRegistry.register(browserClickTool);
  toolRegistry.register(browserScreenshotTool);
  toolRegistry.register(browserExtractTextTool);
  toolRegistry.register(browserFillFormTool);
  toolRegistry.register(browserExtractLinksTool);
  toolRegistry.register(browserWaitForElementTool);
  toolRegistry.register(browserExtractFormsTool);
  toolRegistry.register(browserEvaluateTool);

  // System tools
  toolRegistry.register(shellExecuteTool);
  toolRegistry.register(clipboardReadTool);
  toolRegistry.register(clipboardWriteTool);

  console.log(`✓ Initialized ${toolRegistry.getAll().length} tools`);
}

export { toolRegistry } from './registry';
export { setCurrentPage } from './browser-tools';
export * from './types';

