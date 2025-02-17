import React, { useState } from 'react';
import { PathType, DirectoryInput } from '../types/FileSystem';
import { Github, AlertCircle, FolderOpen } from 'lucide-react';

interface PathInputProps {
  onSubmit: (input: DirectoryInput) => void;
  isLoading: boolean;
}

export const PathInput: React.FC<PathInputProps> = ({ onSubmit, isLoading }) => {
  const [pathType, setPathType] = useState<PathType>('local');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              {pathType === 'github' && (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter GitHub repository URL"
                  className="w-full px-4 py-2 pr-24 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isLoading}
                />
              )}
              {pathType === 'local' && (
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 border rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    disabled={isLoading}
                  >
                    <FolderOpen className="w-5 h-5" />
                    Select Directory
                  </button>
                  <span className="text-sm text-gray-500">
                    Click to choose a local directory
                  </span>
                </div>
              )}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {pathType === 'github' && (
                  <Github className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          <select
            value={pathType}
            onChange={handlePathTypeChange}
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            disabled={isLoading}
          >
            <option value="local">Local Path</option>
            <option value="github">GitHub URL</option>
          </select>
          {pathType === 'github' && (
            <button
              type="submit"
              className={`px-6 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Visualize'}
            </button>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </form>
      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Required Permissions:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Local Path:</strong> Browser must support File System Access API (Chrome, Edge, Opera)
          </li>
          <li>
            <strong>GitHub:</strong> Public repository access (no authentication required)
          </li>
        </ul>
      </div>
    </div>
  );
};