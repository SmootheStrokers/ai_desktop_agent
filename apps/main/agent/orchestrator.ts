import { EventEmitter } from 'events';
import { IntentAnalyzer } from './intent-analyzer';
import { AgentPlanner } from './planner';
import { AgentExecutor } from './executor';
import { ConversationContext, TaskIntent, ExecutionPlan, ExecutionResult } from './types';
import { getGlobalConversationStore, getGlobalWorkingMemory } from '../memory';
import { getProvider } from '../llm-providers-enhanced';
import { VisualProjectBuilder } from '../desktop-control/visual-builder';
import { ProjectTemplates } from '../desktop-control/templates';
import { DynamicProjectGenerator } from '../desktop-control/dynamic-project-generator';
import { ProjectScaffold } from '../desktop-control/types';
import { ProjectAnalyzer } from './project-analyzer';
import { DynamicProjectBuilder } from '../desktop-control/dynamic-builder';
import { RequestValidator } from './request-validator';

export class ConversationalAgent extends EventEmitter {
  private intentAnalyzer: IntentAnalyzer;
  private planner: AgentPlanner;
  private executor: AgentExecutor;
  private visualBuilder: VisualProjectBuilder;
  private dynamicGenerator: DynamicProjectGenerator;
  private projectAnalyzer: ProjectAnalyzer;
  private dynamicBuilder: DynamicProjectBuilder;
  private conversationStore = getGlobalConversationStore();
  private workingMemory = getGlobalWorkingMemory();
  
  constructor() {
    super();
    console.log('[ConversationalAgent] Initializing...');
    
    this.intentAnalyzer = new IntentAnalyzer();
    console.log('[ConversationalAgent] ✓ IntentAnalyzer created');
    
    this.planner = new AgentPlanner();
    console.log('[ConversationalAgent] ✓ Planner created');
    
    this.executor = new AgentExecutor();
    console.log('[ConversationalAgent] ✓ Executor created');
    
    this.visualBuilder = new VisualProjectBuilder();
    console.log('[ConversationalAgent] ✓ VisualBuilder created');
    
    this.dynamicGenerator = new DynamicProjectGenerator();
    console.log('[ConversationalAgent] ✓ DynamicGenerator created');
    
    this.projectAnalyzer = new ProjectAnalyzer();
    console.log('[ConversationalAgent] ✓ ProjectAnalyzer created');
    
    this.dynamicBuilder = new DynamicProjectBuilder();
    console.log('[ConversationalAgent] ✓ DynamicBuilder created');
    
    // Forward executor events
    this.executor.on('plan-start', (data) => this.emit('execution:plan-start', data));
    this.executor.on('step-start', (data) => this.emit('execution:step-start', data));
    this.executor.on('step-complete', (data) => this.emit('execution:step-complete', data));
    this.executor.on('step-error', (data) => this.emit('execution:step-error', data));
    this.executor.on('step-retry', (data) => this.emit('execution:step-retry', data));
    this.executor.on('plan-complete', (data) => this.emit('execution:plan-complete', data));
    this.executor.on('plan-error', (data) => this.emit('execution:plan-error', data));
    
    // Forward visual builder events
    this.visualBuilder.on('progress', (progress) => {
      console.log('[ConversationalAgent] Visual build progress:', progress.currentAction);
      this.emit('visual-build:progress', progress);
    });
    
    this.visualBuilder.on('build-complete', (data) => {
      console.log('[ConversationalAgent] Visual build complete');
      this.emit('visual-build:complete', data);
    });
    
    this.visualBuilder.on('build-error', (data) => {
      console.error('[ConversationalAgent] Visual build error:', data);
      this.emit('visual-build:error', data);
    });
    
    // Forward live code writing events from visual builder
    this.visualBuilder.on('code-writing-progress', (progress) => {
      console.log('[Agent] Code writing:', progress.file, `${progress.percentComplete}%`);
      this.emit('code-writing-progress', progress);
    });

    this.visualBuilder.on('code-writing-status', (status) => {
      console.log('[Agent] Status:', status.message);
      this.emit('code-writing-status', status);
    });
    
    // Forward dynamic builder events
    this.dynamicBuilder.on('progress', (progress) => {
      console.log('[ConversationalAgent] Dynamic build progress:', progress.currentAction);
      this.emit('visual-build:progress', progress);
    });
    
    console.log('[ConversationalAgent] Initialization complete ✓');
  }
  
  /**
   * Main entry point: Handle any user message
   */
  async handleMessage(userMessage: string): Promise<string> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 AI DESKTOP AGENT - NEW MESSAGE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User message:', userMessage);
    console.log('Timestamp:', new Date().toISOString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Add user message to conversation
    this.conversationStore.add({
      role: 'user',
      content: userMessage
    });
    
    try {
      // Build context
      const context = this.buildContext();
      
      // Analyze intent
      this.emit('thinking', { status: 'Analyzing your request...' });
      console.log('[Agent] Starting intent analysis...');
      
      const intent = await this.intentAnalyzer.analyzeIntent(userMessage, context);
      
      console.log('[Agent] ✓ Intent detected:');
      console.log('[Agent]   Type:', intent.type);
      console.log('[Agent]   Confidence:', intent.confidence);
      console.log('[Agent]   Description:', intent.description);
      
      this.emit('intent-detected', { intent });
      
      // Handle based on intent type
      let response: string;
      
      if (intent.type === 'conversation') {
        console.log('[Agent] → Routing to CONVERSATION handler');
        response = await this.handleConversation(userMessage, context);
      } else if (intent.type === 'project_generation') {
        console.log('[Agent] → Routing to PROJECT GENERATION handler');
        response = await this.handleProjectGeneration(userMessage, intent, context);
      } else {
        console.log('[Agent] → Routing to TASK EXECUTION handler');
        response = await this.handleTaskExecution(userMessage, intent, context);
      }
      
      console.log('[Agent] ✓ Response generated');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Add assistant response to conversation
      this.conversationStore.add({
        role: 'assistant',
        content: response
      });
      
      return response;
      
    } catch (error) {
      console.error('[Agent] ❌ ERROR in handleMessage:');
      console.error('[Agent] Message:', (error as Error).message);
      console.error('[Agent] Stack:', (error as Error).stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      const errorMsg = `I encountered an error: ${(error as Error).message}`;
      this.conversationStore.add({
        role: 'assistant',
        content: errorMsg
      });
      return errorMsg;
    }
  }
  
  /**
   * Handle simple conversation (no task execution)
   */
  private async handleConversation(
    userMessage: string,
    context: ConversationContext
  ): Promise<string> {
    const provider = getProvider('claude');
    
    // Build conversation context
    const messages = this.conversationStore.getContext();
    
    try {
      const result = await provider.chat(messages);
      
      if (result.content && result.content.length > 0) {
        const firstContent = result.content[0] as any;
        if (firstContent && firstContent.type === 'text' && firstContent.text) {
          return firstContent.text;
        }
      }
      return 'I understand.';
    } catch (error) {
      console.error('Conversation error:', error);
      return "I'm having trouble processing that right now. Could you try rephrasing?";
    }
  }
  
  /**
   * Handle project generation with DYNAMIC AI analysis (NO hardcoded templates)
   */
  private async handleProjectGeneration(
    userMessage: string,
    intent: TaskIntent,
    context: ConversationContext
  ): Promise<string> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Agent] DYNAMIC PROJECT GENERATION');
    console.log('[Agent] User request:', userMessage);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    this.emit('thinking', { status: 'Analyzing your project requirements with AI...' });
    
    try {
      // ALWAYS use AI to analyze the request - NEVER use hardcoded templates
      console.log('[Agent] Sending request to AI for analysis...');
      
      const analysis = await this.projectAnalyzer.analyzeProjectRequestWithRetry(userMessage, 2);
      
      console.log('[Agent] ✓ AI Analysis Complete:');
      console.log('[Agent]   - Project Name:', analysis.name);
      console.log('[Agent]   - Project Type:', analysis.type);
      console.log('[Agent]   - Description:', analysis.description);
      console.log('[Agent]   - Files to create:', analysis.files.length);
      console.log('[Agent]   - Dependencies:', analysis.dependencies.packages.length);
      
      // CRITICAL: Validate that AI generated what user asked for
      const validation = RequestValidator.validateMatch(
        userMessage,
        analysis.name,
        analysis.description
      );
      
      if (!validation.matches) {
        console.error('[Agent] ❌ Project mismatch detected!');
        console.error('[Agent] Confidence:', validation.confidence);
        console.error('[Agent] Reason:', validation.reason);
        
        // Throw error to trigger retry with more specific prompt
        throw new Error(`Generated project doesn't match request: ${validation.reason}`);
      }
      
      console.log('[Agent] ✓ Validation passed:', validation.reason);
      console.log('[Agent] ✓ Confidence score:', validation.confidence);
      
      this.emit('thinking', { status: `Building ${analysis.name} on your desktop...` });
      
      // Build the project using dynamic builder
      await this.dynamicBuilder.buildFromAnalysis(analysis);
      
      const setupInfo = analysis.setupCommands.length > 0
        ? `\n📦 Setup: ${analysis.setupCommands.length} commands executed`
        : '';
      
      const portInfo = analysis.portNeeded
        ? `\n🌐 Running on: http://localhost:${analysis.portNeeded}`
        : '';
      
      const locationPath = `Desktop/AI-Projects/${analysis.name}`;
      
      return `✨ Your ${analysis.name} is ready!${setupInfo}${portInfo}\n\n` +
             `📁 Location: ${locationPath}\n` +
             `💻 VSCode: Opened with your code\n` +
             `⚡ PowerShell: Dependencies installed\n\n` +
             `Type "open folder" to see it in File Explorer!`;
      
    } catch (error) {
      console.error('[Agent] ❌ Project generation error:', error);
      console.error('[Agent] Stack:', (error as Error).stack);
      
      return `I had trouble building that project: ${(error as Error).message}\n\n` +
             `Please try being more specific about what you want to build.`;
    }
  }
  
  /**
   * Handle task execution
   */
  private async handleTaskExecution(
    userMessage: string,
    intent: TaskIntent,
    context: ConversationContext
  ): Promise<string> {
    // Create execution plan
    this.emit('thinking', { status: 'Creating execution plan...' });
    const plan = await this.planner.createPlan(intent, userMessage, context);
    
    this.emit('plan-created', { plan });
    
    // Ask for approval if needed
    if (intent.requiresApproval && context.userPreferences.approvalLevel !== 'never') {
      const approved = await this.requestApproval(plan);
      if (!approved) {
        return "Okay, I won't do that. Let me know if you'd like something else!";
      }
    }
    
    // Execute plan
    this.emit('thinking', { status: 'Executing plan...' });
    const result = await this.executor.executePlan(plan);
    
    // Generate natural language response
    return await this.generateResponse(result, plan);
  }
  
  /**
   * Request user approval for plan
   */
  private async requestApproval(plan: ExecutionPlan): Promise<boolean> {
    // Emit approval request event (UI will handle this)
    return new Promise((resolve) => {
      this.emit('approval-required', {
        plan,
        onResponse: (approved: boolean) => resolve(approved)
      });
      
      // Timeout after 5 minutes
      setTimeout(() => resolve(false), 5 * 60 * 1000);
    });
  }
  
  /**
   * Generate natural language response from execution result
   */
  private async generateResponse(
    result: ExecutionResult,
    plan: ExecutionPlan
  ): Promise<string> {
    if (!result.success) {
      return `I encountered an error while working on that: ${result.error}`;
    }
    
    const provider = getProvider('claude');
    
    const prompt = `Generate a natural, friendly response to the user about the task execution.

TASK: ${plan.intent.description}

RESULT:
${JSON.stringify(result, null, 2)}

Create a response that:
1. Confirms what was done
2. Highlights key results or artifacts
3. Is conversational and friendly
4. Mentions next steps if applicable
5. Is concise (2-3 sentences max)

Example good responses:
- "Done! I've created 3 files in your project folder. The main app is in app.js."
- "All set! I found 47 matching files and moved them to your organized folder."
- "I've analyzed the data and found the top 5 trends. Check out the report I generated."

Respond with just the message, no other text.`;

    try {
      const response = await provider.chat([
        { role: 'user', content: prompt }
      ]);
      
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0] as any;
        if (firstContent && firstContent.type === 'text' && firstContent.text) {
          return firstContent.text;
        }
      }
      return 'Task completed!';
    } catch (error) {
      console.error('Response generation error:', error);
      return 'Task completed successfully!';
    }
  }
  
  /**
   * Build conversation context
   */
  private buildContext(): ConversationContext {
    const history = this.conversationStore.getAllMessages();
    const recentMessages = history
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));
    
    const workingMemory = {
      facts: this.workingMemory.getAllFacts(),
      files: this.workingMemory.getAllFiles().map(f => f.path),
      urls: this.workingMemory.getAllURLs().map(u => u.url),
      currentTask: undefined
    };
    
    return {
      recentMessages,
      workingMemory,
      userPreferences: {
        approvalLevel: 'sensitive_only',
        verbosity: 'normal',
        autoExecute: true
      }
    };
  }
}

// Singleton
export const conversationalAgent = new ConversationalAgent();

