import { useState, useCallback } from 'react';
// ninja focus touch <
import { useWorker } from './useWorker';
// ninja focus touch >

import type { ProgressItem } from '../types/model';

export const summarizationModels = ['t5-small', 't5-base', 'distilbart-cnn-6-6', 'bart-large-cnn'] as const;
export type SummarizationModel = typeof summarizationModels[number];

// ninja focus touch <
interface SummarizerCompleteData {
    data: string;
}
// ninja focus touch >

export const useSummarizer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [model, setModel] = useState<SummarizationModel>(summarizationModels[0]);
  const [summary, setSummary] = useState<string | null>(null);

  // ninja focus touch <
  const webWorker = useWorker("summarization", (event) => {
    const message = event.data;
    // Update the state with the result
    switch (message.status) {
      case "progress":
        // Model file progress: update one of the progress items.
        setProgressItems((prev) =>
          prev.map((item) => {
            if (item.file === message.file) {
              return { ...item, progress: message.progress };
            }
            return item;
          }),
        );
        break;
      case "complete":
        // Received complete summary
        const completeMessage = message as SummarizerCompleteData;
        setSummary(completeMessage.data);
        setIsLoading(false);
        setProgressItems([]);
        break;
      case "initiate":
        // Model file start load: add a new progress item to the list.
        setProgressItems((prev) => [...prev, message]);
        break;
      case "error":
        setIsLoading(false);
        setProgressItems([]);
        console.error('Summarization error:', message.data);
        const errorMessage = message.data?.message || message.data?.toString() || 'An error occurred during summarization.';
        alert(
          `${errorMessage} Please try again.\n\nIf this persists, please file a bug report.`,
        );
        break;
      case "done":
        // Model file loaded: remove the progress item from the list.
        setProgressItems((prev) =>
          prev.filter((item) => item.file !== message.file),
        );
        break;
      default:
        break;
    }
  });
  // ninja focus touch >

  // ninja focus touch <
  const summarize = useCallback(async (text: string) => {
    try {
      setIsLoading(true);
      setSummary(null);
      
      webWorker.postMessage({
        text,
        model
      });
    } catch (error) {
      console.error('Summarization error:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setProgressItems([]);
    }
  }, [model, webWorker]);
  // ninja focus touch >

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
