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
      const result = JSON.parse(response.choices[0].message.content);
      
      // Return grammar check results
      return res.json({
        issues: result.issues || [],
        score: result.score || 100
      });
    } catch (error) {
      console.error("Grammar check error:", error);
      return res.status(500).json({ 
        message: "Failed to check grammar",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
