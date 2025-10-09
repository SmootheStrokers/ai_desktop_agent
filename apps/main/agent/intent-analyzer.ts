import { TaskIntent, TaskType, ConversationContext } from './types';
import { getProvider } from '../llm-providers-enhanced';
import { toolRegistry } from '../tools';

export class IntentAnalyzer {
  /**
   * Analyze user input and determine intent
   */
  async analyzeIntent(
    userInput: string,
    context: ConversationContext
  ): Promise<TaskIntent> {
    console.log('[IntentAnalyzer] Analyzing input:', userInput);
    
    // Quick pattern matching for common cases (BEFORE conversation check)
    const quickIntent = this.quickIntentDetection(userInput);
    if (quickIntent) {
      console.log('[IntentAnalyzer] ✓ Quick match:', quickIntent.type);
      return quickIntent;
    }
    
    // Quick check for simple conversation
    if (this.isConversational(userInput)) {
      console.log('[IntentAnalyzer] ✓ Conversational pattern matched');
      return {
        type: 'conversation',
        description: userInput,
        complexity: 'low',
        estimatedSteps: 1,
        requiredTools: [],
        requiresApproval: false,
        confidence: 0.9
      };
    }

    console.log('[IntentAnalyzer] Using LLM analysis...');
    const provider = getProvider('claude');
    
    // Get available tools
    const availableTools = toolRegistry.getAll();
    const toolDescriptions = availableTools.map(t => 
      `- ${t.name}: ${t.description}`
    ).join('\n');
    
    const prompt = `You are an intelligent task analyzer. Analyze the user's request and determine:
1. What type of task this is
2. How complex it is
3. What tools or capabilities are needed
4. Whether it requires user approval

USER REQUEST: "${userInput}"

RECENT CONVERSATION:
${context.recentMessages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

AVAILABLE TOOLS:
${toolDescriptions}

WORKING MEMORY:
${JSON.stringify(context.workingMemory, null, 2)}

Respond with a JSON object:
{
  "type": "simple_tool_call" | "multi_step_tool_chain" | "code_generation" | "project_generation" | "research" | "file_manipulation" | "system_automation" | "creative_work" | "conversation",
  "description": "Clear description of what needs to be done",
  "complexity": "low" | "medium" | "high" | "very_high",
  "estimatedSteps": <number>,
  "requiredTools": ["tool1", "tool2"],
  "requiresApproval": true | false,
  "confidence": 0.0 to 1.0,
  "reasoning": "Why you chose this classification"
}

CLASSIFICATION GUIDELINES:
- simple_tool_call: Single tool execution (e.g., "read file.txt", "what time is it")
- multi_step_tool_chain: 2-10 tool calls in sequence (e.g., "read file, extract emails, save to CSV")
- code_generation: Need to write and execute custom code (e.g., "write a script that...", "create a function that...")
- project_generation: Build entire project structure (e.g., "build me a chatbot", "create an API service")
- research: Web research and analysis (e.g., "research the best...", "compare...")
- file_manipulation: Complex file operations (e.g., "organize my downloads", "rename all...")
- system_automation: System-level tasks (e.g., "schedule a task", "monitor folder")
- creative_work: Writing, content generation (e.g., "write an essay", "create a story")
- conversation: Just chatting, no action needed (e.g., "how are you?", "tell me about...")

Respond with ONLY the JSON, no other text.`;

    try {
      const result = await provider.chat([
        { role: 'user', content: prompt }
      ]);
      
      const content = result.content || '';
      
      // Extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Default to conversation if can't parse
        return {
          type: 'conversation',
          description: userInput,
          complexity: 'low',
          estimatedSteps: 1,
          requiredTools: [],
          requiresApproval: false,
          confidence: 0.5
        };
      }
      
      const intent = JSON.parse(jsonMatch[0]) as TaskIntent;
      return intent;
    } catch (error) {
      console.error('Intent analysis error:', error);
      // Default fallback
      return {
        type: 'conversation',
        description: userInput,
        complexity: 'low',
        estimatedSteps: 1,
        requiredTools: [],
        requiresApproval: false,
        confidence: 0.3
      };
    }
  }
  
  /**
   * Quick pattern-based intent detection (faster than LLM)
   */
  private quickIntentDetection(input: string): TaskIntent | null {
    const lower = input.toLowerCase().trim();
    
    console.log('[IntentAnalyzer] Quick detection for:', lower);
    
    // Project generation patterns - CHECK THESE FIRST
    const buildPatterns = [
      /^build\s+(me\s+)?(a\s+|an\s+)?(.+)/i,
      /^create\s+(me\s+)?(a\s+|an\s+)?(.+)\s+(app|application|project|website|tool)/i,
      /^make\s+(me\s+)?(a\s+|an\s+)?(.+)\s+(app|application|project|website|tool|that)/i,
      /^generate\s+(a\s+|an\s+)?(.+)\s+(app|application|project)/i,
      /^i want\s+(a\s+|an\s+)?(.+)\s+(app|that)/i
    ];
    
    for (const pattern of buildPatterns) {
      if (pattern.test(lower)) {
        console.log('[IntentAnalyzer] ✓ Matched build pattern:', pattern);
        return {
          type: 'project_generation',
          description: input,
          complexity: 'high',
          estimatedSteps: 10,
          requiredTools: [],
          requiresApproval: false,
          confidence: 0.95
        };
      }
    }
    
    // Voice/TTS specific patterns
    console.log('[IntentAnalyzer] Testing voice patterns...');
    const voicePatterns = [
      /voice/i,
      /speak/i,
      /say\s+/i,
      /tts/i,
      /text.to.speech/i,
      /talk/i
    ];
    
    const hasVoiceKeyword = voicePatterns.some(p => p.test(lower));
    const hasBuildKeyword = /build|create|make|generate/.test(lower);
    
    console.log('[IntentAnalyzer] Has voice keyword:', hasVoiceKeyword);
    console.log('[IntentAnalyzer] Has build keyword:', hasBuildKeyword);
    
    if (hasVoiceKeyword && hasBuildKeyword) {
      console.log('[IntentAnalyzer] ✓ Matched voice build pattern');
      return {
        type: 'project_generation',
        description: input,
        complexity: 'high',
        estimatedSteps: 10,
        requiredTools: [],
        requiresApproval: false,
        confidence: 0.95
      };
    }
    
    // Simple conversational patterns
    const conversationPatterns = [
      /^(hi|hello|hey|greetings)/i,
      /how are you/i,
      /what('?s| is) (up|new)/i,
      /^thanks|thank you/i,
      /^(bye|goodbye)/i,
      /^stop$/i,
      /^ok$/i,
      /^yes$/i,
      /^no$/i
    ];
    
    for (const pattern of conversationPatterns) {
      if (pattern.test(lower)) {
        console.log('[IntentAnalyzer] ✓ Matched conversation pattern');
        return {
          type: 'conversation',
          description: input,
          complexity: 'low',
          estimatedSteps: 1,
          requiredTools: [],
          requiresApproval: false,
          confidence: 0.95
        };
      }
    }
    
    return null; // No quick match, continue to LLM
  }
  
  /**
   * Quick check if input is just conversation
   */
  isConversational(input: string): boolean {
    const conversationalPatterns = [
      /^(hi|hello|hey|greetings)/i,
      /how are you/i,
      /what('?s| is) (up|new)/i,
      /tell me (about|a joke)/i,
      /^thanks|thank you/i,
      /^(bye|goodbye|see you)/i,
    ];
    
    return conversationalPatterns.some(pattern => pattern.test(input));
  }
}

