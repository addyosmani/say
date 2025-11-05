import { useState, useCallback } from 'react';
import { pipeline } from '@xenova/transformers';

export const summarizationModels = ['t5-small', 't5-base', 'distilbart-cnn-6-6', 'bart-large-cnn'] as const;
export type SummarizationModel = typeof summarizationModels[number];

export const useSummarizer = () => {
  const [isLoading, setIsLoading] = useState(false);
  // ninja focus touch <
  const [progress, setProgress] = useState<{ status: string; progress?: number } | null>(null);
  // ninja focus touch >
  const [model, setModel] = useState<SummarizationModel>(summarizationModels[0]);
  const [summary, setSummary] = useState<string | null>(null);

  const summarize = useCallback(async (text: string) => {
    try {
      setIsLoading(true);
      setSummary(null);
      
      const summarizer = await pipeline('summarization', `Xenova/${model}`, {
        // ninja focus touch <
        progress_callback: (data: { status: string; progress?: number }) => {
          setProgress(data);
        }
        // ninja focus touch >
      });

      const output = await summarizer(text, {
        max_length: 150,
        min_length: 40,
      });

      setSummary(output[0].summary_text);
    } catch (error) {
      console.error('Summarization error:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [model]);

  const clearSummary = useCallback(() => {
    setSummary(null);
  }, []);

  const changeModel = useCallback((newModel: SummarizationModel) => {
    setModel(newModel);
  }, []);

  return {
    isLoading,
    // ninja focus touch <
    progress,
    // ninja focus touch >
    summary,
    model,
    summarize,
    clearSummary,
    changeModel,
  };
};
