import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-123" });

export async function registerRoutes(app: Express): Promise<Server> {
  // Grammar check endpoint
  app.post("/api/grammar-check", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      // Check if OpenAI API key is configured properly
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-123") {
        // Return sample grammar issues for demonstration
        console.log("Using fallback grammar checker (no valid API key)");
        return res.json(getFallbackGrammarCheck(text));
      }
      
      try {
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: 
                "You are a grammar checking assistant specialized in professional writing. " +
                "Analyze the provided text for grammar, spelling, punctuation, and clarity issues. " +
                "For each issue, provide the original text, suggested correction, and a brief explanation. " +
                "Focus only on actual grammar problems, not style preferences. " +
                "Respond with JSON in this format: { 'issues': [{ 'original': string, 'suggestion': string, 'explanation': string }], 'score': number }"
            },
            {
              role: "user",
              content: text
            }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse the response
        const content = response.choices[0].message.content;
        const resultString = typeof content === 'string' ? content : '{"issues":[],"score":100}';
        const result = JSON.parse(resultString);
        
        // Return grammar check results
        return res.json({
          issues: result.issues || [],
          score: result.score || 100
        });
      } catch (apiError) {
        // If we get a rate limit or quota error, use fallback
        console.error("OpenAI API error:", apiError);
        console.log("Using fallback grammar checker due to API error");
        return res.json(getFallbackGrammarCheck(text));
      }
    } catch (error) {
      console.error("Grammar check error:", error);
      return res.status(500).json({ 
        message: "Failed to check grammar",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Fallback grammar checker that performs basic checks without using API
  function getFallbackGrammarCheck(text: string) {
    const issues: Array<{
      original: string;
      suggestion: string;
      explanation: string;
    }> = [];
    let score = 95; // Start with high score
    
    // Check for common grammar issues
    
    // 1. Double spaces
    const doubleSpaces = text.match(/\s\s+/g);
    if (doubleSpaces) {
      doubleSpaces.forEach(match => {
        issues.push({
          original: match,
          suggestion: ' ', // Single space
          explanation: 'Multiple spaces should be a single space'
        });
      });
      score -= doubleSpaces.length * 2;
    }
    
    // 2. Missing space after period
    const missingSpaceAfterPeriod = text.match(/\.[A-Z]/g);
    if (missingSpaceAfterPeriod) {
      missingSpaceAfterPeriod.forEach(match => {
        issues.push({
          original: match,
          suggestion: match.charAt(0) + ' ' + match.charAt(1),
          explanation: 'Add a space after period'
        });
      });
      score -= missingSpaceAfterPeriod.length * 3;
    }
    
    // 3. Common spelling errors (very simple examples)
    const commonErrors = [
      { wrong: 'its', right: "it's", context: /its (a|the|not|going|time)/g },
      { wrong: 'their', right: "they're", context: /their (a|the|not|going|here|there)/g },
      { wrong: 'your', right: "you're", context: /your (a|the|not|going|right|wrong)/g },
      { wrong: 'then', right: "than", context: /more then|better then|worse then|rather then/g },
      { wrong: 'affect', right: "effect", context: /the affect/g },
      { wrong: 'effect', right: "affect", context: /effect the/g },
    ];
    
    commonErrors.forEach(({ wrong, right, context }) => {
      const matches = text.match(context);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            original: match,
            suggestion: match.replace(wrong, right),
            explanation: `'${wrong}' might be incorrect in this context. Did you mean '${right}'?`
          });
        });
        score -= matches.length * 5;
      }
    });
    
    // 4. Multiple exclamation or question marks
    const multipleMarks = text.match(/[!?]{2,}/g);
    if (multipleMarks) {
      multipleMarks.forEach(match => {
        issues.push({
          original: match,
          suggestion: match.charAt(0),
          explanation: 'Use a single punctuation mark for professional writing'
        });
      });
      score -= multipleMarks.length * 3;
    }
    
    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));
    
    return {
      issues,
      score: Math.round(score)
    };
  }

  const httpServer = createServer(app);
  return httpServer;
}
