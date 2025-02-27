import React, { useEffect } from 'react';
import { ProcessingStatus } from '../types/FileSystem';
import { XCircle, RefreshCw } from 'lucide-react';

interface ProgressBarProps {
  status: ProcessingStatus;
  onCancel?: () => void;
  darkMode?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ status, onCancel, darkMode }) => {
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
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>
            {status.status === 'processing' ? 'Processing Files...' : 
             status.status === 'complete' ? 'Complete!' : 
             status.status === 'timeout' ? 'Request Timed Out' : 
             status.status === 'error' ? 'Error' : ''}
          </span>
          {status.status === 'processing' && onCancel && (
            <button
              onClick={onCancel}
              className={`p-1 rounded-md transition-colors ${
                darkMode
                  ? 'hover:bg-red-900/50 text-red-400'
                  : 'hover:bg-red-100 text-red-500'
              }`}
              title="Cancel Operation"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          {(status.status === 'timeout' || status.status === 'error') && (
            <button
              onClick={() => window.location.reload()}
              className={`p-1 rounded-md transition-colors ${
                darkMode
                  ? 'hover:bg-blue-900/50 text-blue-400'
                  : 'hover:bg-blue-100 text-blue-500'
              }`}
              title="Try Again"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>
          {Math.round(progress)}%
        </span>
      </div>
      <div className={`w-full rounded-full h-2.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            status.status === 'error' || status.status === 'timeout'
              ? darkMode ? 'bg-red-500' : 'bg-red-500'
              : darkMode ? 'bg-blue-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {status.status === 'error' && (
        <div className={`mt-2 text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
          {status.error}
        </div>
      )}
      {status.status === 'timeout' && (
        <div className={`mt-2 text-sm ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
          Request timed out. This could be due to a large repository or network issues.
        </div>
      )}
    </div>
  );
};