import { ExecutionPlan, PlanStep, ExecutionResult, Artifact, StepAction } from './types';
import { toolRegistry } from '../tools';
import { getProvider } from '../llm-providers-enhanced';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export class AgentExecutor extends EventEmitter {
  private currentPlan: ExecutionPlan | null = null;
  private completedSteps: Set<string> = new Set();
  private stepResults: Map<string, any> = new Map();
  private startTime: number = 0;
  
  /**
   * Execute a plan
   */
  async executePlan(plan: ExecutionPlan): Promise<ExecutionResult> {
    this.currentPlan = plan;
    this.completedSteps.clear();
    this.stepResults.clear();
    this.startTime = Date.now();
    
    const artifacts: Artifact[] = [];
    
    try {
      this.emit('plan-start', { plan });
      
      // Execute steps in dependency order
      const sortedSteps = this.topologicalSort(plan.steps);
      
      for (let i = 0; i < sortedSteps.length; i++) {
        const step = sortedSteps[i];
        
        this.emit('step-start', {
          step,
          progress: (i / sortedSteps.length) * 100,
          stepNumber: i + 1,
          totalSteps: sortedSteps.length
        });
        
        try {
          const result = await this.executeStep(step, plan);
          this.completedSteps.add(step.id);
          this.stepResults.set(step.id, result);
          
          // Collect artifacts
          if (result?.artifact) {
            artifacts.push(result.artifact);
          }
          
          this.emit('step-complete', {
            step,
            result,
            progress: ((i + 1) / sortedSteps.length) * 100
          });
          
        } catch (error) {
          this.emit('step-error', {
            step,
            error: (error as Error).message
          });
          
          // Retry if step is retryable
          if (step.retryable) {
            this.emit('step-retry', { step });
            try {
              const retryResult = await this.executeStep(step, plan);
              this.completedSteps.add(step.id);
              this.stepResults.set(step.id, retryResult);
              
              if (retryResult?.artifact) {
                artifacts.push(retryResult.artifact);
              }
            } catch (retryError) {
              throw retryError;
            }
          } else {
            throw error;
          }
        }
      }
      
      const duration = Date.now() - this.startTime;
      const output = this.synthesizeOutput(plan, this.stepResults);
      
      this.emit('plan-complete', { plan, output, artifacts, duration });
      
      return {
        success: true,
        planId: plan.id,
        stepsCompleted: sortedSteps.length,
        totalSteps: sortedSteps.length,
        output,
        artifacts,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      
      this.emit('plan-error', {
        plan,
        error: (error as Error).message,
        duration
      });
      
      return {
        success: false,
        planId: plan.id,
        stepsCompleted: this.completedSteps.size,
        totalSteps: plan.steps.length,
        output: null,
        artifacts,
        error: (error as Error).message,
        duration
      };
    }
  }
  
  /**
   * Execute a single step
   */
  private async executeStep(step: PlanStep, plan: ExecutionPlan): Promise<any> {
    const action = step.action;
    
    switch (action.type) {
      case 'tool_call':
        return await this.executeToolCall(action.tool, action.params);
        
      case 'code_gen':
        return await this.executeCodeGeneration(action.language, action.purpose, step, plan);
        
      case 'llm_query':
        return await this.executeLLMQuery(action.prompt, action.context);
        
      case 'file_operation':
        return await this.executeFileOperation(action.operation, action.params);
        
      case 'wait':
        return await this.executeWait(action.duration);
        
      default:
        throw new Error(`Unknown action type: ${(action as any).type}`);
    }
  }
  
  /**
   * Execute tool call
   */
  private async executeToolCall(toolName: string, params: any): Promise<any> {
    const tool = toolRegistry.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    const result = await tool.handler(params);
    return result;
  }
  
  /**
   * Generate and execute code
   */
  private async executeCodeGeneration(
    language: string,
    purpose: string,
    step: PlanStep,
    plan: ExecutionPlan
  ): Promise<any> {
    const provider = getProvider('claude');
    
    // Get context from previous steps
    const context = this.buildContextForCodeGen(plan);
    
    const prompt = `Generate ${language} code for this purpose: ${purpose}

Context from previous steps:
${context}

Requirements:
1. Write production-quality code
2. Include error handling
3. Add comments explaining key parts
4. Make it executable as-is
5. Output results to stdout or return them

Respond with ONLY the code, no markdown formatting or explanations.`;

    try {
      const result = await provider.chat([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.2,
        max_tokens: 4000
      });
      
      const code = result.content[0].type === 'text' ? result.content[0].text : '';
      
      // Clean up code (remove markdown if present)
      const cleanCode = code.replace(/```[\w]*\n/g, '').replace(/```/g, '').trim();
      
      // Save code to temp file
      const tempDir = path.join(app.getPath('temp'), 'ai-agent-code');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const ext = language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'txt';
      const filename = `generated_${Date.now()}.${ext}`;
      const filepath = path.join(tempDir, filename);
      
      fs.writeFileSync(filepath, cleanCode);
      
      // Execute code
      const execResult = await this.executeGeneratedCode(filepath, language);
      
      return {
        code: cleanCode,
        filepath,
        output: execResult,
        artifact: {
          type: 'code' as const,
          path: filepath,
          content: cleanCode,
          metadata: { language, purpose }
        }
      };
    } catch (error) {
      console.error('Code generation error:', error);
      throw new Error(`Code generation failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Execute generated code file
   */
  private async executeGeneratedCode(filepath: string, language: string): Promise<string> {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    let command: string;
    
    switch (language) {
      case 'python':
        command = `python "${filepath}"`;
        break;
      case 'javascript':
        command = `node "${filepath}"`;
        break;
      default:
        return `Code saved to ${filepath} (execution not supported for ${language})`;
    }
    
    try {
      const { stdout, stderr } = await execPromise(command, {
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      
      return stdout || stderr || 'Execution completed successfully';
    } catch (error: any) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }
  
  /**
   * Execute LLM query
   */
  private async executeLLMQuery(prompt: string, context?: any): Promise<any> {
    const provider = getProvider('claude');
    
    const fullPrompt = context 
      ? `${prompt}\n\nContext:\n${JSON.stringify(context, null, 2)}`
      : prompt;
    
    try {
      const result = await provider.chat([
        { role: 'user', content: fullPrompt }
      ], {
        temperature: 0.7,
        max_tokens: 2000
      });
      
      return result.content[0].type === 'text' ? result.content[0].text : '';
    } catch (error) {
      console.error('LLM query error:', error);
      throw new Error(`LLM query failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Execute file operation
   */
  private async executeFileOperation(operation: string, params: any): Promise<any> {
    try {
      // Implement various file operations
      switch (operation) {
        case 'read':
          return fs.readFileSync(params.path, 'utf-8');
          
        case 'write':
          fs.writeFileSync(params.path, params.content);
          return { success: true, path: params.path };
          
        case 'delete':
          fs.unlinkSync(params.path);
          return { success: true };
          
        case 'list':
          return fs.readdirSync(params.path);
          
        default:
          throw new Error(`Unknown file operation: ${operation}`);
      }
    } catch (error) {
      console.error('File operation error:', error);
      throw new Error(`File operation failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Wait for specified duration
   */
  private async executeWait(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration * 1000));
  }
  
  /**
   * Topological sort of steps based on dependencies
   */
  private topologicalSort(steps: PlanStep[]): PlanStep[] {
    const sorted: PlanStep[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (step: PlanStep) => {
      if (visited.has(step.id)) return;
      if (visiting.has(step.id)) {
        throw new Error('Circular dependency detected in plan');
      }
      
      visiting.add(step.id);
      
      // Visit dependencies first
      for (const depId of step.dependencies) {
        const depStep = steps.find(s => s.id === depId);
        if (depStep) {
          visit(depStep);
        }
      }
      
      visiting.delete(step.id);
      visited.add(step.id);
      sorted.push(step);
    };
    
    for (const step of steps) {
      visit(step);
    }
    
    return sorted;
  }
  
  /**
   * Build context string for code generation
   */
  private buildContextForCodeGen(plan: ExecutionPlan): string {
    const contextParts: string[] = [];
    
    // Add completed step results
    this.stepResults.forEach((result, stepId) => {
      const step = plan.steps.find(s => s.id === stepId);
      if (step) {
        contextParts.push(`${step.description}: ${JSON.stringify(result)}`);
      }
    });
    
    return contextParts.join('\n');
  }
  
  /**
   * Synthesize final output from step results
   */
  private synthesizeOutput(plan: ExecutionPlan, stepResults: Map<string, any>): any {
    // Get result from last step
    const lastStep = plan.steps[plan.steps.length - 1];
    const lastResult = stepResults.get(lastStep.id);
    
    // If it's a simple result, return it directly
    if (typeof lastResult === 'string' || typeof lastResult === 'number') {
      return lastResult;
    }
    
    // Otherwise, compile all results
    return {
      summary: `Completed ${plan.intent.description}`,
      steps: Array.from(stepResults.entries()).map(([id, result]) => ({
        id,
        description: plan.steps.find(s => s.id === id)?.description,
        result
      })),
      finalResult: lastResult
    };
  }
}

