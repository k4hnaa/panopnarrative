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
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check grammar';
      setError(errorMessage);
      toast({
        title: "Grammar check failed",
        description: errorMessage,
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
