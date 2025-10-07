import { Page } from 'playwright';
import { Tool } from './types';

let currentPage: Page | null = null;
let currentBrowser: any = null;

export function setCurrentPage(page: Page | null) {
  currentPage = page;
}

export function setCurrentBrowser(browser: any) {
  currentBrowser = browser;
}

export const browserLaunchTool: Tool = {
  name: 'browser_launch',
  description: 'Launch a browser instance',
  parameters: {
    type: 'object',
    properties: {
      headless: {
        type: 'boolean',
        description: 'Whether to run in headless mode',
        default: false
      }
    },
    required: []
  },
  handler: async ({ headless = false }) => {
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ headless });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      setCurrentBrowser(browser);
      setCurrentPage(page);
      
      return {
        success: true,
        data: { headless },
        message: `Browser launched successfully (headless: ${headless})`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to launch browser'
      };
    }
  }
};

export const browserNavigateTool: Tool = {
  name: 'browser_navigate',
  description: 'Navigate to a URL in the browser',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to navigate to'
      }
    },
    required: ['url']
  },
  handler: async ({ url }) => {
    if (!currentPage) {
      return {
        success: false,
        error: 'Browser not initialized. Use browser_launch first.'
      };
    }

    try {
      await currentPage.goto(url, { waitUntil: 'networkidle' });
      const title = await currentPage.title();
      
      return {
        success: true,
        data: { url, title },
        message: `Navigated to ${url} - "${title}"`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Navigation failed'
      };
    }
  }
};

export const browserClickTool: Tool = {
  name: 'browser_click',
  description: 'Click an element on the page by text content or CSS selector',
  parameters: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'Text content or CSS selector of the element to click'
      }
    },
    required: ['selector']
  },
  handler: async ({ selector }) => {
    if (!currentPage) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      // Try clicking by text first
      try {
        await currentPage.click(`text=${selector}`, { timeout: 3000 });
      } catch {
        // Fall back to CSS selector
        await currentPage.click(selector);
      }

      return {
        success: true,
        message: `Clicked: ${selector}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to click '${selector}': ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export const browserScreenshotTool: Tool = {
  name: 'browser_screenshot',
  description: 'Take a screenshot of the current page',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path where to save the screenshot',
        default: 'screenshot.png'
      },
      fullPage: {
        type: 'boolean',
        description: 'Whether to take a full page screenshot',
        default: false
      }
    },
    required: []
  },
  handler: async ({ path: screenshotPath = 'screenshot.png', fullPage = false }) => {
    if (!currentPage) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      await currentPage.screenshot({ path: screenshotPath, fullPage });
      
      return {
        success: true,
        data: { path: screenshotPath },
        message: `Screenshot saved to ${screenshotPath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Screenshot failed'
      };
    }
  }
};

export const browserExtractTextTool: Tool = {
  name: 'browser_extract_text',
  description: 'Extract all visible text from the current page',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async () => {
    if (!currentPage) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      const text = await currentPage.textContent('body');
      const cleanedText = text?.replace(/\s+/g, ' ').trim() || '';
      
      return {
        success: true,
        data: { text: cleanedText, length: cleanedText.length },
        message: `Extracted ${cleanedText.length} characters of text`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Text extraction failed'
      };
    }
  }
};

export const browserFillFormTool: Tool = {
  name: 'browser_fill_form',
  description: 'Fill out a form field on the current page',
  parameters: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'CSS selector or label text of the input field'
      },
      value: {
        type: 'string',
        description: 'The value to fill into the field'
      }
    },
    required: ['selector', 'value']
  },
  handler: async ({ selector, value }) => {
    if (!currentPage) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      await currentPage.fill(selector, value);
      
      return {
        success: true,
        message: `Filled '${selector}' with value`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Form fill failed'
      };
    }
  }
};

export const browserExtractLinksTool: Tool = {
  name: 'browser_extract_links',
  description: 'Extract all links from the current page',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of links to return',
        default: 50
      }
    },
    required: []
  },
  handler: async ({ limit = 50 }) => {
    if (!currentPage) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      const links = await currentPage.$$eval('a', (anchors, maxLinks) => 
        anchors
          .slice(0, maxLinks)
          .map(a => ({
            text: a.textContent?.trim() || '',
            href: a.href,
            title: a.title || ''
          }))
          .filter(link => link.href && link.href.startsWith('http')),
        limit
      );
      
      return {
        success: true,
        data: { links, count: links.length },
        message: `Extracted ${links.length} links from page`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Link extraction failed'
      };
    }
  }
};

export const browserWaitForElementTool: Tool = {
  name: 'browser_wait_for_element',
  description: 'Wait for an element to appear on the page',
  parameters: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'CSS selector of the element to wait for'
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds',
        default: 5000
      },
      state: {
        type: 'string',
        description: 'State to wait for: visible, hidden, attached, detached',
        enum: ['visible', 'hidden', 'attached', 'detached'],
        default: 'visible'
      }
    },
    required: ['selector']
  },
  handler: async ({ selector, timeout = 5000, state = 'visible' }) => {
    if (!currentPage) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      await currentPage.waitForSelector(selector, { 
        timeout, 
        state: state as any 
      });
      
      return {
        success: true,
        message: `Element '${selector}' is now ${state}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Element '${selector}' did not become ${state} within ${timeout}ms`
      };
    }
  }
};

export const browserExtractFormsTool: Tool = {
  name: 'browser_extract_forms',
  description: 'Extract form fields and their properties from the current page',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async () => {
    if (!currentPage) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      const forms = await currentPage.$$eval('form', (formElements) => 
        formElements.map((form, idx) => ({
          index: idx,
          id: form.id || '',
          name: form.name || '',
          action: form.action || '',
          method: form.method || 'get',
          fields: Array.from(form.querySelectorAll('input, textarea, select')).map(field => {
            const input = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            return {
              name: input.name || '',
              id: input.id || '',
              type: input.type || 'text',
              placeholder: (input as HTMLInputElement).placeholder || '',
              required: input.required
            };
          })
        }))
      );
      
      return {
        success: true,
        data: { forms, count: forms.length },
        message: `Extracted ${forms.length} forms from page`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Form extraction failed'
      };
    }
  }
};

export const browserEvaluateTool: Tool = {
  name: 'browser_evaluate',
  description: 'Execute JavaScript code in the browser context',
  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'JavaScript code to execute'
      }
    },
    required: ['code']
  },
  handler: async ({ code }) => {
    if (!currentPage) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      const result = await currentPage.evaluate((codeToRun) => {
        try {
          // Use Function constructor instead of direct eval for better bundler compatibility
          const func = new Function('return ' + codeToRun);
          return { success: true, result: func() };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      }, code);
      
      if (result.success) {
        return {
          success: true,
          data: { result: result.result },
          message: 'Code executed successfully'
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Evaluation failed'
      };
    }
  }
};

