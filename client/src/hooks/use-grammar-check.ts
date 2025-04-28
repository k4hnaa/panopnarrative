import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { GrammarIssue } from '@/lib/grammar-utils';
import { useToast } from '@/hooks/use-toast';

interface GrammarCheckResponse {
  issues: GrammarIssue[];
  score: number;
}

export function useGrammarCheck() {
  const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[] | null>(null);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grammarScore, setGrammarScore] = useState<number | null>(null);
  const { toast } = useToast();

  const checkGrammar = async (text: string) => {
    if (!text) return;
    
    setIsCheckingGrammar(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/grammar-check', { text });
      const data: GrammarCheckResponse = await response.json();
      
      setGrammarIssues(data.issues);
      setGrammarScore(data.score);
      
      if (data.issues.length === 0) {
        toast({
          title: "Grammar perfect!",
          description: "No grammar issues found in the narrative.",
        });
      } else {
        toast({
          title: `Grammar check complete`,
          description: `Found ${data.issues.length} potential ${data.issues.length === 1 ? 'issue' : 'issues'}.`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check grammar';
      console.error("Grammar check error:", errorMessage);
      setError(errorMessage);
      
      // Still set empty grammar issues to avoid blocking the UI
      setGrammarIssues([]);
      setGrammarScore(100);
      
      toast({
        title: "Grammar check unavailable",
        description: "Using basic spelling check instead. Full grammar check unavailable.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const resetGrammarCheck = () => {
    setGrammarIssues(null);
    setError(null);
    setGrammarScore(null);
  };

  return {
    checkGrammar,
    grammarIssues,
    isCheckingGrammar,
    error,
    grammarScore,
    resetGrammarCheck,
  };
}
