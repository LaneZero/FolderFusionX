import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Github, Key, CheckCircle, XCircle, Loader } from 'lucide-react';
import { VisualizationOptions, DEFAULT_FILE_FORMATS, INITIAL_DEFAULT_FOLDERS } from '../types/FileSystem';
import { validateGitHubToken } from '../utils/fileSystem';

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
  // State for managing input values and validation
  const [newExtension, setNewExtension] = useState('');
  const [newExcludePath, setNewExcludePath] = useState('');
  const [excludeError, setExcludeError] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState(options.githubToken || '');
  const [showToken, setShowToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [tokenInfo, setTokenInfo] = useState<{
    username?: string;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: Date;
    }
  }>({});

  useEffect(() => {
    // Reset token status when modal opens
    if (isOpen) {
      setTokenStatus('idle');
      setGithubToken(options.githubToken || '');
    }
  }, [isOpen, options.githubToken]);

  if (!isOpen) return null;

  // Handler for validating GitHub token
  const handleValidateToken = async () => {
    if (!githubToken.trim()) {
      setTokenStatus('invalid');
      return;
    }

    setTokenStatus('validating');
    try {
      const result = await validateGitHubToken(githubToken);
      if (result.valid) {
        setTokenStatus('valid');
        setTokenInfo({
          username: result.username,
          rateLimit: result.rateLimit
        });
      } else {
        setTokenStatus('invalid');
      }
    } catch (error) {
      setTokenStatus('invalid');
    }
  };

  // Handler for adding new excluded paths
  const handleAddExcludePath = (e: React.FormEvent) => {
    e.preventDefault();
    setExcludeError(null);

    // Validate the input
    if (!newExcludePath.trim()) {
      setExcludeError('Please enter a folder name');
      return;
    }

    // Check if the folder is already excluded
    if (options.excludePatterns.includes(newExcludePath)) {
      setExcludeError('This folder is already excluded');
      return;
    }

    // Add the new exclusion pattern
    onOptionsChange({
      ...options,
      excludePatterns: [...options.excludePatterns, newExcludePath.trim()],
    });
    setNewExcludePath('');
  };

  // Handler for removing excluded paths
  const handleRemoveExcludePath = (path: string) => {
    onOptionsChange({
      ...options,
      excludePatterns: options.excludePatterns.filter(p => p !== path),
    });
  };

  // Handler for updating GitHub token
  const handleGithubTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    setGithubToken(newToken);
    setTokenStatus('idle');
  };

  // Handler for saving GitHub token
  const handleSaveToken = () => {
    onOptionsChange({
      ...options,
      githubToken: githubToken,
    });
    setTokenStatus('idle');
  };

  // Handler for toggling file formats
  const handleFormatToggle = (format: string) => {
    onOptionsChange({
      ...options,
      enabledFormats: {
        ...options.enabledFormats,
        [format]: !options.enabledFormats[format],
      },
    });
  };

  // Handler for updating max depth
  const handleMaxDepthChange = (depth: number) => {
    onOptionsChange({
      ...options,
      maxDepth: depth,
    });
  };

  // Handler for toggling hidden files
  const handleHiddenToggle = () => {
    onOptionsChange({
      ...options,
      showHidden: !options.showHidden,
    });
  };

  // Handler for adding custom file extensions
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

  // Handler for removing custom file extensions
  const handleRemoveCustomExtension = (extension: string) => {
    onOptionsChange({
      ...options,
      customExtensions: options.customExtensions.filter(ext => ext !== extension),
    });
  };

  // Format date for rate limit display
  const formatRateLimitReset = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString();
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
            {/* GitHub API Settings Section */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Github className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-medium text-blue-900">GitHub API Settings</h3>
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-blue-800">Personal Access Token</label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={githubToken}
                    onChange={handleGithubTokenChange}
                    placeholder="Enter GitHub token (optional)"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleValidateToken}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    disabled={tokenStatus === 'validating'}
                  >
                    {tokenStatus === 'validating' ? (
                      <span className="flex items-center gap-1">
                        <Loader className="w-3 h-3 animate-spin" />
                        Validating...
                      </span>
                    ) : (
                      'Validate Token'
                    )}
                  </button>
                  <button
                    onClick={handleSaveToken}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    disabled={tokenStatus === 'validating'}
                  >
                    Save Token
                  </button>
                </div>
                {tokenStatus === 'valid' && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <div className="flex items-center gap-1 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Token valid for user: {tokenInfo.username}</span>
                    </div>
                    {tokenInfo.rateLimit && (
                      <div className="mt-1 text-xs text-green-600">
                        Rate limit: {tokenInfo.rateLimit.remaining} / {tokenInfo.rateLimit.limit} requests remaining
                        (resets at {formatRateLimitReset(tokenInfo.rateLimit.reset)})
                      </div>
                    )}
                  </div>
                )}
                {tokenStatus === 'invalid' && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                    <div className="flex items-center gap-1 text-red-700">
                      <XCircle className="w-4 h-4" />
                      <span>Invalid token. Please check and try again.</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-blue-700 mt-2">
                  A GitHub token increases API rate limits and allows access to private repositories.
                </p>
              </div>
            </div>

            {/* File Format Settings */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">File Format Settings</h3>
              <div className="space-y-2">
                {Object.keys(DEFAULT_FILE_FORMATS).map((format) => (
                  <div key={format} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`format-${format}`}
                      checked={options.enabledFormats[format] || false}
                      onChange={() => handleFormatToggle(format)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`format-${format}`} className="ml-2 block text-sm text-gray-900">
                      {format}
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Custom Extensions</h4>
                <form onSubmit={handleAddCustomExtension} className="flex gap-2">
                  <input
                    type="text"
                    value={newExtension}
                    onChange={(e) => setNewExtension(e.target.value)}
                    placeholder=".ext"
                    className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.customExtensions.map((ext) => (
                    <div
                      key={ext}
                      className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      <span>{ext}</span>
                      <button
                        onClick={() => handleRemoveCustomExtension(ext)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Excluded Folders */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Excluded Folders</h3>
              <form onSubmit={handleAddExcludePath} className="flex gap-2">
                <input
                  type="text"
                  value={newExcludePath}
                  onChange={(e) => setNewExcludePath(e.target.value)}
                  placeholder="Folder name to exclude"
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
              {excludeError && (
                <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{excludeError}</span>
                </div>
              )}
              <div className="mt-3 space-y-2">
                {options.excludePatterns.map((path) => (
                  <div
                    key={path}
                    className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded"
                  >
                    <span className="text-sm">{path}</span>
                    <button
                      onClick={() => handleRemoveExcludePath(path)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {options.excludePatterns.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No folders excluded</p>
                )}
              </div>
            </div>

            {/* General Settings */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="max-depth" className="block text-sm font-medium text-gray-700">
                    Maximum Depth: {options.maxDepth}
                  </label>
                  <input
                    type="range"
                    id="max-depth"
                    min="1"
                    max="10"
                    value={options.maxDepth}
                    onChange={(e) => handleMaxDepthChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show-hidden"
                    checked={options.showHidden}
                    onChange={handleHiddenToggle}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show-hidden" className="ml-2 block text-sm text-gray-900">
                    Show Hidden Files (starting with .)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="dark-mode"
                    checked={options.darkMode || false}
                    onChange={() => onOptionsChange({
                      ...options,
                      darkMode: !options.darkMode
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="dark-mode" className="ml-2 block text-sm text-gray-900">
                    Dark Mode
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show-progress"
                    checked={options.showProgressBar}
                    onChange={() => onOptionsChange({
                      ...options,
                      showProgressBar: !options.showProgressBar
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show-progress" className="ml-2 block text-sm text-gray-900">
                    Always Show Progress Bar
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};