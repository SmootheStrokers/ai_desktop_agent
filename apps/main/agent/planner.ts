import { ExecutionPlan, TaskIntent, PlanStep, ConversationContext } from './types';
import { getProvider } from '../llm-providers-enhanced';
import { toolRegistry } from '../tools';

export class AgentPlanner {
  /**
   * Create detailed execution plan from intent
   */
  async createPlan(
    intent: TaskIntent,
    userInput: string,
    context: ConversationContext
  ): Promise<ExecutionPlan> {
    // For simple tasks, create plan directly
    if (intent.type === 'simple_tool_call') {
      return this.createSimplePlan(intent, userInput);
    }
    
    // For complex tasks, use LLM to plan
    return this.createComplexPlan(intent, userInput, context);
  }
  
  /**
   * Create plan for simple single-tool tasks
   */
  private async createSimplePlan(
    intent: TaskIntent,
    userInput: string
  ): Promise<ExecutionPlan> {
    const tool = intent.requiredTools[0];
    
    // Extract parameters from user input
    const params = await this.extractToolParams(tool, userInput);
    
    const step: PlanStep = {
      id: 'step_1',
      description: intent.description,
      action: {
        type: 'tool_call',
        tool,
        params
      },
      dependencies: [],
      estimatedDuration: 5,
      retryable: true
    };
    
    return {
      id: `plan_${Date.now()}`,
      intent,
      steps: [step],
      estimatedDuration: 5,
      estimatedTokens: 100,
      createdAt: Date.now()
    };
  }
  
  /**
   * Create plan for complex multi-step tasks
   */
  private async createComplexPlan(
    intent: TaskIntent,
    userInput: string,
    context: ConversationContext
  ): Promise<ExecutionPlan> {
    const provider = getProvider('claude');
    
    const availableTools = toolRegistry.getAll();
    const toolDescriptions = availableTools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }));
    
    const prompt = `You are an expert task planner. Create a detailed execution plan for this request.

USER REQUEST: "${userInput}"

INTENT ANALYSIS:
${JSON.stringify(intent, null, 2)}

CONTEXT:
${JSON.stringify(context.workingMemory, null, 2)}

AVAILABLE TOOLS:
${JSON.stringify(toolDescriptions, null, 2)}

Create a step-by-step execution plan. Each step should be atomic and clearly defined.

Respond with JSON:
{
  "steps": [
    {
      "id": "step_1",
      "description": "What this step does",
      "action": {
        "type": "tool_call" | "code_gen" | "llm_query" | "file_operation",
        "tool": "tool_name" (if tool_call),
        "params": { "param1": "value1" } (if tool_call),
        "language": "python" (if code_gen),
        "purpose": "what the code does" (if code_gen),
        "prompt": "question to ask" (if llm_query)
      },
      "dependencies": ["step_id1"], // steps that must complete first
      "estimatedDuration": 10,
      "retryable": true
    }
  ],
  "estimatedTotalDuration": 60,
  "estimatedTokens": 1000
}

IMPORTANT RULES:
1. Break complex tasks into clear, atomic steps
2. Use available tools whenever possible
3. Only use code_gen when no tool exists for the task
4. Specify dependencies correctly (topological order)
5. Be realistic about time estimates
6. Make steps retryable when possible

Respond with ONLY the JSON, no other text.`;

    try {
      const result = await provider.chat([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.4,
        max_tokens: 4000
      });
      
      const content = result.content[0].type === 'text' ? result.content[0].text : '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Failed to generate execution plan');
      }
      
      const planData = JSON.parse(jsonMatch[0]);
      
      return {
        id: `plan_${Date.now()}`,
        intent,
        steps: planData.steps,
        estimatedDuration: planData.estimatedTotalDuration || 60,
        estimatedTokens: planData.estimatedTokens || 1000,
        createdAt: Date.now()
      };
    } catch (error) {
      console.error('Plan creation error:', error);
      throw new Error(`Failed to create execution plan: ${(error as Error).message}`);
    }
  }
  
  /**
   * Extract tool parameters from natural language
   */
  private async extractToolParams(
    toolName: string,
    userInput: string
  ): Promise<any> {
    const tool = toolRegistry.get(toolName);
    if (!tool) return {};
    
    const provider = getProvider('claude');
    
    const prompt = `Extract parameters for the "${toolName}" tool from this user input:
"${userInput}"

Tool parameters schema:
${JSON.stringify(tool.parameters, null, 2)}

Respond with a JSON object containing only the parameter values. Example:
{"path": "/path/to/file", "content": "text to write"}

Respond with ONLY the JSON, no other text.`;

    try {
      const result = await provider.chat([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.2,
        max_tokens: 500
      });
      
      const content = result.content[0].type === 'text' ? result.content[0].text : '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
      console.error('Parameter extraction error:', error);
      return {};
    }
  }
}

