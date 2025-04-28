export interface GrammarIssue {
  original: string;
  suggestion: string;
  explanation?: string;
  position?: {
    start: number;
    end: number;
  };
}

/**
 * Apply a single grammar suggestion to the text
 */
export function applyGrammarSuggestion(text: string, issue: GrammarIssue): string {
  if (!text || !issue) return text;
  
  // If we have position information, use that for precise replacement
  if (issue.position) {
    const before = text.substring(0, issue.position.start);
    const after = text.substring(issue.position.end);
    return before + issue.suggestion + after;
  }
  
  // Otherwise, do a simple string replacement
  return text.replace(issue.original, issue.suggestion);
}

/**
 * Apply all grammar suggestions to the text
 */
export function applyAllGrammarSuggestions(text: string, issues: GrammarIssue[]): string {
  if (!text || !issues || issues.length === 0) return text;
  
  // Sort issues by position in reverse order to avoid affecting indices
  // when making replacements
  const sortedIssues = [...issues];
  
  if (sortedIssues[0].position) {
    sortedIssues.sort((a, b) => {
      // Both have position info
      if (a.position && b.position) {
        return b.position.start - a.position.start;
      }
      // One has position info
      if (a.position) return -1;
      if (b.position) return 1;
      return 0;
    });
  }
  
  let result = text;
  
  // Apply each suggestion
  for (const issue of sortedIssues) {
    result = applyGrammarSuggestion(result, issue);
  }
  
  return result;
}

/**
 * Calculate a grammar score based on the number of issues and text length
 */
export function calculateGrammarScore(text: string, issues: GrammarIssue[]): number {
  if (!text || text.length === 0) return 0;
  if (!issues || issues.length === 0) return 100;
  
  // Simple formula: 100 - (issues / (words * 0.1) * 100)
  // This gives roughly how many issues per 10 words, subtracted from 100
  const wordCount = text.split(/\s+/).length;
  const issueRatio = issues.length / (wordCount * 0.1);
  const score = 100 - (issueRatio * 100);
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}
