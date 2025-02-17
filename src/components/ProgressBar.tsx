import React, { useEffect } from 'react';
import { ProcessingStatus } from '../types/FileSystem';

interface ProgressBarProps {
  status: ProcessingStatus;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ status }) => {
  // Hide progress bar when idle or complete after a delay
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    if (status.status === 'processing') {
      setVisible(true);
    } else if (status.status === 'complete') {
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [status.status]);

  if (!visible || status.status === 'idle') return null;

  const progress = status.total > 0 ? (status.processed / status.total) * 100 : 0;

  return (
    <div className="w-full transition-opacity duration-300">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-blue-500">
          {status.status === 'processing' ? 'Processing Files...' : 'Complete!'}
        </span>
        <span className="text-sm font-medium text-blue-500">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {status.status === 'error' && (
        <div className="mt-2 text-red-500 text-sm">
          {status.error}
        </div>
      )}
    </div>
  );
};