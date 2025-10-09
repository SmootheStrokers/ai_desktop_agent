export type TaskType = 
  | 'simple_tool_call'        // Single tool execution
  | 'multi_step_tool_chain'   // Multiple tool calls
  | 'code_generation'         // Generate and execute code
  | 'project_generation'      // Build entire project
  | 'research'                // Web research and analysis
  | 'file_manipulation'       // Complex file operations
  | 'system_automation'       // System-level automation
  | 'creative_work'           // Writing, design, etc.
  | 'conversation';           // Just chatting

export interface TaskIntent {
  type: TaskType;
  description: string;
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  estimatedSteps: number;
  requiredTools: string[];
  requiresApproval: boolean;
  confidence: number; // 0-1
}

export interface ExecutionPlan {
  id: string;
  intent: TaskIntent;
  steps: PlanStep[];
  estimatedDuration: number; // seconds
  estimatedTokens: number;
  createdAt: number;
}

export interface PlanStep {
  id: string;
  description: string;
  action: StepAction;
  dependencies: string[]; // step IDs that must complete first
  estimatedDuration: number;
  retryable: boolean;
}

export type StepAction = 
  | { type: 'tool_call'; tool: string; params: any }
  | { type: 'code_gen'; language: string; purpose: string }
  | { type: 'llm_query'; prompt: string; context?: any }
  | { type: 'user_input'; question: string }
  | { type: 'file_operation'; operation: string; params: any }
  | { type: 'wait'; duration: number };

export interface ExecutionResult {
  success: boolean;
  planId: string;
  stepsCompleted: number;
  totalSteps: number;
  output: any;
  artifacts: Artifact[];
  error?: string;
  duration: number;
}

export interface Artifact {
  type: 'file' | 'code' | 'data' | 'project' | 'url';
  path?: string;
  content?: string;
  metadata: Record<string, any>;
}

export interface ConversationContext {
  recentMessages: Array<{ role: string; content: string }>;
  workingMemory: {
    facts: Record<string, any>;
    files: string[];
    urls: string[];
    currentTask?: string;
  };
  userPreferences: {
    approvalLevel: 'always' | 'sensitive_only' | 'never';
    verbosity: 'minimal' | 'normal' | 'detailed';
    autoExecute: boolean;
  };
}

