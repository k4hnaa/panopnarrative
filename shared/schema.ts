import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const grammarIssueSchema = z.object({
  original: z.string(),
  suggestion: z.string(),
  explanation: z.string().optional(),
  position: z.object({
    start: z.number(),
    end: z.number()
  }).optional()
});

export const grammarCheckResponseSchema = z.object({
  issues: z.array(grammarIssueSchema),
  score: z.number().min(0).max(100)
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GrammarIssue = z.infer<typeof grammarIssueSchema>;
export type GrammarCheckResponse = z.infer<typeof grammarCheckResponseSchema>;
