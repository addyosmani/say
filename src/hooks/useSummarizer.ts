import { useState, useCallback } from 'react';
import { pipeline } from '@xenova/transformers';

import type { ProgressItem } from '../types/model';

export const summarizationModels = ['t5-small', 't5-base', 'distilbart-cnn-6-6', 'bart-large-cnn'] as const;
export type SummarizationModel = typeof summarizationModels[number];

export const useSummarizer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [model, setModel] = useState<SummarizationModel>(summarizationModels[0]);
  const [summary, setSummary] = useState<string | null>(null);

  const summarize = useCallback(async (text: string) => {
    try {
      setIsLoading(true);
      setSummary(null);
      
      const summarizer = await pipeline('summarization', `Xenova/${model}`, {
        progress_callback: (data: ProgressItem) => {
          switch (data.status) {
            case "initiate": {
              setProgressItems((prev) => [...prev, data]);
              break;
            }
            case "progress": {
              setProgressItems(prev =>
                prev.map(item => {
                  if (item.file === data.file) {
                      return { ...item, progress: data.progress };
                  }
                  return item;
                })
              );
              break;
            }
            case "done": {
              setProgressItems(prev =>
                prev.filter(item => item.file !== data.file)
              );
              break;
            }
          }
        }
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
      setProgressItems([]);
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
    progressItems,
    summary,
    model,
    summarize,
    clearSummary,
    changeModel,
  };
};
