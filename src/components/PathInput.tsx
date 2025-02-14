import React, { useState } from 'react';
import { PathType, DirectoryInput } from '../types/FileSystem';
import { FolderOpen, Github } from 'lucide-react';

interface PathInputProps {
  onSubmit: (input: DirectoryInput) => void;
  isLoading: boolean;
}

export const PathInput: React.FC<PathInputProps> = ({ onSubmit, isLoading }) => {
  const [pathType, setPathType] = useState<PathType>('local');
  const [inputValue, setInputValue] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit({ type: pathType, value: inputValue.trim() });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={pathType === 'local' ? 'C:\\Users\\YourName\\Documents' : 'https://github.com/user/repo/tree/main/path'}
              className="w-full px-4 py-2 pr-12 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {pathType === 'local' ? (
                <FolderOpen className="w-5 h-5 text-gray-400" />
              ) : (
                <Github className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        <select
          value={pathType}
          onChange={(e) => setPathType(e.target.value as PathType)}
          className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          <option value="local">Local Path</option>
          <option value="github">GitHub URL</option>
        </select>
        <button
          type="submit"
          className={`px-6 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Visualize'}
        </button>
      </div>
    </form>
  );
};