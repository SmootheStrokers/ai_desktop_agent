/**
 * Validate that AI-generated projects match user requests
 */
export class RequestValidator {
  /**
   * Check if project analysis matches user intent
   */
  static validateMatch(userRequest: string, projectName: string, projectDesc: string): {
    matches: boolean;
    confidence: number;
    reason: string;
  } {
    const requestLower = userRequest.toLowerCase();
    const nameLower = projectName.toLowerCase();
    const descLower = projectDesc.toLowerCase();
    
    // Extract meaningful keywords from request
    const keywords = this.extractKeywords(requestLower);
    
    console.log('[RequestValidator] User keywords:', keywords);
    console.log('[RequestValidator] Project name:', nameLower);
    console.log('[RequestValidator] Project desc:', descLower);
    
    // Check for keyword matches
    let matchCount = 0;
    const matchedKeywords: string[] = [];
    
    for (const keyword of keywords) {
      if (nameLower.includes(keyword) || descLower.includes(keyword)) {
        matchCount++;
        matchedKeywords.push(keyword);
      }
    }
    
    const confidence = keywords.length > 0 ? matchCount / keywords.length : 0;
    const matches = confidence >= 0.5; // At least 50% of keywords should match
    
    const reason = matches
      ? `Matched keywords: ${matchedKeywords.join(', ')}`
      : `Expected keywords: ${keywords.join(', ')} but found different project`;
    
    console.log('[RequestValidator] Match result:', { matches, confidence, reason });
    
    return { matches, confidence, reason };
  }
  
  /**
   * Extract meaningful keywords from user request
   */
  private static extractKeywords(request: string): string[] {
    // Remove common words
    const stopWords = new Set([
      'build', 'create', 'make', 'generate', 'develop',
      'me', 'a', 'an', 'the', 'for', 'with', 'using',
      'in', 'on', 'at', 'to', 'from', 'of', 'and', 'or',
      'fully', 'executable', 'grade', 'app', 'application'
    ]);
    
    // Extract words
    const words = request
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
    
    // Keep unique words
    return Array.from(new Set(words));
  }
  
  /**
   * Suggest corrections if mismatch detected
   */
  static suggestCorrection(userRequest: string, projectName: string): string {
    const keywords = this.extractKeywords(userRequest);
    
    return `It looks like you wanted a project about: ${keywords.join(', ')}\n` +
           `But I generated: ${projectName}\n\n` +
           `Please try rephrasing your request to be more specific.`;
  }
}

