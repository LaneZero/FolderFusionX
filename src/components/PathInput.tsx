import React, { useState } from 'react';
import { PathType, DirectoryInput } from '../types/FileSystem';
import { Github, AlertCircle, FolderOpen, Search, Info } from 'lucide-react';

interface PathInputProps {
  onSubmit: (input: DirectoryInput) => void;
  isLoading: boolean;
  darkMode?: boolean;
}

export const PathInput: React.FC<PathInputProps> = ({ onSubmit, isLoading, darkMode = false }) => {
  const [pathType, setPathType] = useState<PathType>('local');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!inputValue.trim() && pathType === 'github') {
      setError('Please enter a GitHub repository URL');
      return;
    }

    if (pathType === 'github' && !inputValue.includes('github.com')) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    onSubmit({ type: pathType, value: inputValue.trim() });
  };

  const handlePathTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPathType = e.target.value as PathType;
    setPathType(newPathType);
    setInputValue('');
    setError(null);
  };
  
  return (
    <div className="mb-6">
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Visualize Directory Structure
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Source Type
              </label>
              <select
                value={pathType}
                onChange={handlePathTypeChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="local">Local Directory</option>
                <option value="github">GitHub Repository</option>
              </select>
            </div>
            
            <div className="flex-1">
              <div className="relative">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {pathType === 'github' ? 'Repository URL' : 'Directory Path'}
                </label>
                
                {pathType === 'github' && (
                  <div className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Enter GitHub repository URL"
                      className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Github className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    </div>
                  </div>
                )}
                
                {pathType === 'local' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        darkMode 
                          ? 'text-white bg-blue-600 hover:bg-blue-700' 
                          : 'text-white bg-blue-500 hover:bg-blue-600'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isLoading}
                    >
                      <FolderOpen className="w-5 h-5" />
                      Select Directory
                    </button>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Click to choose a local directory
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {pathType === 'github' && (
              <div className="flex items-end">
                <button
                  type="submit"
                  className={`px-6 py-2 text-white rounded-md transition-colors ${
                    darkMode 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Visualize
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {error && (
            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </form>
        
        <div className="mt-4 flex items-center gap-1">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`text-sm flex items-center gap-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
          >
            <Info className="w-4 h-4" />
            <span>{showInfo ? 'Hide info' : 'Show info'}</span>
          </button>
        </div>
        
        {showInfo && (
          <div className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className="font-medium mb-2">Required Permissions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Local Path:</strong> Browser must support File System Access API (Chrome, Edge, Opera)
              </li>
              <li>
                <strong>GitHub:</strong> Public repository access (no authentication required)
              </li>
              <li>
                For private repositories or higher rate limits, add a GitHub token in Settings
              </li>
            </ul>
            <p className="mt-2">
              <strong>Examples:</strong> For GitHub repositories, use formats like <code>https://github.com/username/repo</code> or <code>https://github.com/username/repo/tree/branch/folder</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};