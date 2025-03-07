import React, { useEffect } from 'react';
import { ProcessingStatus } from '../types/FileSystem';
import { XCircle, RefreshCw, AlertCircle, CheckCircle, Loader } from 'lucide-react';

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
    } else if (status.status === 'error' || status.status === 'timeout') {
      setVisible(true);
    }
  }, [status.status]);

  if (!visible || status.status === 'idle') return null;

  const progress = status.total > 0 ? (status.processed / status.total) * 100 : 0;

  return (
    <div className={`w-full transition-opacity duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      <div className={`p-4 rounded-lg ${
        status.status === 'error' || status.status === 'timeout'
          ? darkMode ? 'bg-red-900/20' : 'bg-red-50'
          : status.status === 'complete'
          ? darkMode ? 'bg-green-900/20' : 'bg-green-50'
          : darkMode ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <div className="flex justify-between mb-2">
          <div className="flex items-center gap-2">
            {status.status === 'processing' && (
              <Loader className={`w-4 h-4 animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            )}
            {status.status === 'complete' && (
              <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
            )}
            {(status.status === 'error' || status.status === 'timeout') && (
              <AlertCircle className={`w-4 h-4 ${
                status.status === 'error' 
                  ? darkMode ? 'text-red-400' : 'text-red-500'
                  : darkMode ? 'text-amber-400' : 'text-amber-500'
              }`} />
            )}
            <span className={`text-sm font-medium ${
              status.status === 'processing' 
                ? darkMode ? 'text-blue-400' : 'text-blue-500'
                : status.status === 'complete'
                ? darkMode ? 'text-green-400' : 'text-green-500'
                : status.status === 'error'
                ? darkMode ? 'text-red-400' : 'text-red-500'
                : darkMode ? 'text-amber-400' : 'text-amber-500'
            }`}>
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
          </div>
          {status.status === 'processing' && (
            <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
        
        {status.status === 'processing' && (
          <div className={`w-full rounded-full h-2.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                darkMode ? 'bg-blue-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {status.status === 'error' && (
          <div className={`mt-2 text-sm ${darkMode ? 'text-red-400' : 'text-red-500'} flex items-start gap-2`}>
            <div className="flex-1">
              {status.error || "Permission denied for directory access. Please grant access when prompted by the browser."}
              <div className="mt-2 flex">
                <button
                  onClick={() => window.location.reload()}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {status.status === 'timeout' && (
          <div className={`mt-2 text-sm ${darkMode ? 'text-amber-400' : 'text-amber-600'} flex items-start gap-2`}>
            <div className="flex-1">
              Request timed out. This could be due to a large repository or network issues.
              <div className="mt-2 flex">
                <button
                  onClick={() => window.location.reload()}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};