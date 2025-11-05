import React from 'react';
import { IoClose, IoSettingsSharp } from 'react-icons/io5';
import Progress from './Progress';
import { summarizationModels, SummarizationModel } from '../hooks/useSummarizer';
import type { ProgressItem } from '../types/model';

interface TextSummaryProps {
  summary: string | null;
  isLoading: boolean;
  progressItems: ProgressItem[];
  onClose: () => void;
  model: SummarizationModel;
  onModelChange: (model: SummarizationModel) => void;
}

export default function TextSummary({
  summary,
  isLoading,
  progressItems,
  onClose,
  model,
  onModelChange,
}: TextSummaryProps) {
  const [showSettings, setShowSettings] = React.useState(false);

  if (!isLoading && !summary) return null;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg relative">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">AI Summary</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-600 hover:text-gray-800"
          >
            <IoSettingsSharp size={20} />
          </button>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <IoClose size={20} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-4 p-2 bg-white rounded border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Selection
          </label>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value as SummarizationModel)}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {summarizationModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      )}

      {progressItems.length > 0 && (
        <div className="space-y-2">
          {progressItems.map(item => (
            <Progress key={item.file} text={item.file} percentage={item.progress} />
          ))}
        </div>
      )}

      {summary && (
        <div className="prose max-w-none">
          <p className="text-gray-700">{summary}</p>
        </div>
      )}
    </div>
  );
};
