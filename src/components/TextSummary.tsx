import React from 'react';
import { IoClose, IoSettingsSharp } from 'react-icons/io5';
import Progress from './Progress';

interface TextSummaryProps {
  summary: string | null;
  isLoading: boolean;
  progress: { status: string; progress?: number } | null;
  onClose: () => void;
  // ninja focus touch <
  model: 't5-small' | 't5-base';
  onModelChange: (model: 't5-small' | 't5-base') => void;
  // ninja focus touch >
}

export default function TextSummary({
  summary,
  isLoading,
  progress,
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
          {/* ninja focus touch < */}
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value as 't5-small' | 't5-base')}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="t5-small">t5-small (faster)</option>
            <option value="t5-base">t5-base (better quality)</option>
          </select>
          {/* ninja focus touch > */}
        </div>
      )}

      {isLoading && progress && (
        <div className="mb-4">
          <Progress 
            text={progress.status} 
            percentage={progress.progress || 0} 
          />
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
