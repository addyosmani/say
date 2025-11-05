// ninja focus touch <
import React from "react";

interface ProgressProps {
  text?: string;
  percentage?: number;
}

export const Progress: React.FC<ProgressProps> = ({ text, percentage }) => {
  return (
    <div className="w-full max-w-full">
      {text && <div className="text-sm text-gray-600 mb-1">{text}</div>}
      <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.round((percentage || 0) * 100)}%` }}
        />
      </div>
    </div>
  );
};

export default Progress;
// ninja focus touch >