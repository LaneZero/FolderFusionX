import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { VisualizationOptions, DEFAULT_FILE_FORMATS } from '../types/FileSystem';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: VisualizationOptions;
  onOptionsChange: (options: VisualizationOptions) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  onOptionsChange,
}) => {
  const [newExtension, setNewExtension] = useState('');

  if (!isOpen) return null;

  const handleFormatToggle = (format: string) => {
    onOptionsChange({
      ...options,
      enabledFormats: {
        ...options.enabledFormats,
        [format]: !options.enabledFormats[format],
      },
    });
  };

  const handleMaxDepthChange = (depth: number) => {
    onOptionsChange({
      ...options,
      maxDepth: depth,
    });
  };

  const handleHiddenToggle = () => {
    onOptionsChange({
      ...options,
      showHidden: !options.showHidden,
    });
  };

  const handleAddCustomExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExtension && !options.customExtensions.includes(newExtension)) {
      const extension = newExtension.startsWith('.') ? newExtension : `.${newExtension}`;
      onOptionsChange({
        ...options,
        customExtensions: [...options.customExtensions, extension],
      });
      setNewExtension('');
    }
  };

  const handleRemoveCustomExtension = (extension: string) => {
    onOptionsChange({
      ...options,
      customExtensions: options.customExtensions.filter(ext => ext !== extension),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Visualization Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Depth Control */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Maximum Depth</h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={options.maxDepth}
                  onChange={(e) => handleMaxDepthChange(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600 min-w-[2.5rem]">
                  {options.maxDepth}
                </span>
              </div>
            </div>

            {/* Hidden Files Toggle */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.showHidden}
                  onChange={handleHiddenToggle}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  Show Hidden Files
                </span>
              </label>
            </div>

            {/* Custom Extensions */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Custom Extensions</h3>
              <form onSubmit={handleAddCustomExtension} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newExtension}
                  onChange={(e) => setNewExtension(e.target.value)}
                  placeholder=".custom"
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
              <div className="flex flex-wrap gap-2">
                {options.customExtensions.map((ext) => (
                  <div
                    key={ext}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
                  >
                    <span className="text-sm">{ext}</span>
                    <button
                      onClick={() => handleRemoveCustomExtension(ext)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* File Format Sections */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">File Formats</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(DEFAULT_FILE_FORMATS).map(([category, extensions]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={options.enabledFormats[category] ?? true}
                        onChange={() => handleFormatToggle(category)}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {category}
                      </span>
                    </label>
                    <div className="text-xs text-gray-500 pl-6">
                      {extensions.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};