import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Github, Key, CheckCircle, XCircle, Loader, Lock, Shield, Info } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'github' | 'files' | 'folders' | 'general'>('general');

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
    // Store token in sessionStorage instead of localStorage for better security
    if (githubToken) {
      try {
        // Encrypt token before storing (simple encoding for demo)
        // In a real app, use a proper encryption library
        const encodedToken = btoa(githubToken);
        sessionStorage.setItem('github-token', encodedToken);
      } catch (error) {
        console.error('Failed to store token securely', error);
      }
    } else {
      sessionStorage.removeItem('github-token');
    }
    
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

  const isDarkMode = options.darkMode;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className={`text-gray-400 hover:text-gray-500 focus:outline-none ${isDarkMode ? 'hover:text-gray-300' : ''}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className={`w-48 border-r ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
            <nav className="p-4">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'general'
                        ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    General
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('github')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'github'
                        ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    GitHub API
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('files')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'files'
                        ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    File Formats
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('folders')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'folders'
                        ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Excluded Folders
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* GitHub API Settings */}
            {activeTab === 'github' && (
              <div className="space-y-6">
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Github className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`} />
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}>GitHub API Settings</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`} />
                      <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-800'} font-medium`}>Security Notice: Tokens are stored in your browser's session storage and are not shared.</p>
                    </div>
                    <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-800'}`}>Personal Access Token</label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={githubToken}
                        onChange={handleGithubTokenChange}
                        placeholder="Enter GitHub token (optional)"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          isDarkMode ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray- 700'}`}
                      >
                        {showToken ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Key className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={handleValidateToken}
                        className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                          isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
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
                        className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                          isDarkMode 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        disabled={tokenStatus === 'validating'}
                      >
                        Save Token
                      </button>
                    </div>
                    {tokenStatus === 'valid' && (
                      <div className={`mt-2 p-2 border rounded text-sm ${
                        isDarkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'
                      }`}>
                        <div className={`flex items-center gap-1 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                          <CheckCircle className="w-4 h-4" />
                          <span>Token valid for user: {tokenInfo.username}</span>
                        </div>
                        {tokenInfo.rateLimit && (
                          <div className={`mt-1 text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            Rate limit: {tokenInfo.rateLimit.remaining} / {tokenInfo.rateLimit.limit} requests remaining
                            (resets at {formatRateLimitReset(tokenInfo.rateLimit.reset)})
                          </div>
                        )}
                      </div>
                    )}
                    {tokenStatus === 'invalid' && (
                      <div className={`mt-2 p-2 border rounded text-sm ${
                        isDarkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className={`flex items-center gap-1 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                          <XCircle className="w-4 h-4" />
                          <span>Invalid token. Please check and try again.</span>
                        </div>
                      </div>
                    )}
                    <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} mt-2`}>
                      A GitHub token increases API rate limits and allows access to private repositories.
                    </p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>GitHub API Usage Tips</h3>
                  <ul className={`list-disc pl-5 space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>Create a token with <strong>read-only</strong> permissions for security</li>
                    <li>For public repositories, the <code>public_repo</code> scope is sufficient</li>
                    <li>Without a token, GitHub limits to 60 requests per hour</li>
                    <li>With a token, this increases to 5,000 requests per hour</li>
                    <li>Large repositories may require multiple API calls</li>
                  </ul>
                </div>
              </div>
            )}
            
            {/* File Format Settings */}
            {activeTab === 'files' && (
              <div className="space-y-6">
                <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>File Format Settings</h3>
                  <div className="space-y-2">
                    {Object.keys(DEFAULT_FILE_FORMATS).map((format) => (
                      <div key={format} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`format-${format}`}
                          checked={options.enabledFormats[format] || false}
                          onChange={() => handleFormatToggle(format)}
                          className={`h-4 w-4 rounded ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600 focus:ring-offset-gray-800' 
                              : 'text-blue-600 focus:ring-blue-500 border-gray-300'
                          }`}
                        />
                        <label htmlFor={`format-${format}`} className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {format}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Custom Extensions</h4>
                    <form onSubmit={handleAddCustomExtension} className="flex gap-2">
                      <input
                        type="text"
                        value={newExtension}
                        onChange={(e) => setNewExtension(e.target.value)}
                        placeholder=".ext"
                        className={`flex-1 px-3 py-2 border rounded-md ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'border-gray-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <button
                        type="submit"
                        className={`px-3 py-2 text-white rounded-md transition-colors ${
                          isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {options.customExtensions.map((ext) => (
                        <div
                          key={ext}
                          className={`flex items-center px-2 py-1 rounded text-sm ${
                            isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <span>{ext}</span>
                          <button
                            onClick={() => handleRemoveCustomExtension(ext)}
                            className={`ml-1 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {options.customExtensions.length === 0 && (
                        <p className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          No custom extensions added
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>About File Formats</h3>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    File formats determine how files are categorized and displayed in the visualization. 
                    Enabling or disabling formats affects the coloring and grouping in Graph View.
                  </p>
                </div>
              </div>
            )}
            
            {/* Excluded Folders */}
            {activeTab === 'folders' && (
              <div className="space-y-6">
                <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Excluded Folders</h3>
                  <form onSubmit={handleAddExcludePath} className="flex gap-2">
                    <input
                      type="text"
                      value={newExcludePath}
                      onChange={(e) => setNewExcludePath(e.target.value)}
                      placeholder="Folder name to exclude"
                      className={`flex-1 px-3 py-2 border rounded-md ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'border-gray-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    <button
                      type="submit"
                      className={`px-3 py-2 text-white rounded-md transition-colors ${
                        isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                  {excludeError && (
                    <div className={`mt-2 text-sm flex items-center gap-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      <AlertCircle className="w-4 h-4" />
                      <span>{excludeError}</span>
                    </div>
                  )}
                  <div className="mt-3 space-y-2">
                    {options.excludePatterns.map((path) => (
                      <div
                        key={path}
                        className={`flex items-center justify-between px-3 py-2 rounded ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{path}</span>
                        <button
                          onClick={() => handleRemoveExcludePath(path)}
                          className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {options.excludePatterns.length === 0 && (
                      <p className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No folders excluded</p>
                    )}
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>About Excluded Folders</h3>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Excluding folders can significantly improve performance when visualizing large repositories.
                    Common folders to exclude include <code>node_modules</code>, <code>.git</code>, and build directories.
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        // Add common folders to exclude
                        const commonFolders = ['node_modules', '.git', 'dist', 'build', 'coverage', '.cache'];
                        const newExcludes = [...options.excludePatterns];
                        
                        commonFolders.forEach(folder => {
                          if (!newExcludes.includes(folder)) {
                            newExcludes.push(folder);
                          }
                        });
                        
                        onOptionsChange({
                          ...options,
                          excludePatterns: newExcludes
                        });
                      }}
                      className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                    >
                      + Add common excluded folders
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>General Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="max-depth" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Maximum Depth: {options.maxDepth}
                      </label>
                      <input
                        type="range"
                        id="max-depth"
                        min="1"
                        max="10"
                        value={options.maxDepth}
                        onChange={(e) => handleMaxDepthChange(parseInt(e.target.value))}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer mt-2 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}
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
                        className={`h-4 w-4 rounded ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600 focus:ring-offset-gray-800' 
                            : 'text-blue-600 focus:ring-blue-500 border-gray-300'
                        }`}
                      />
                      <label htmlFor="show-hidden" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
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
                        className={`h-4 w-4 rounded ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600 focus:ring-offset-gray-800' 
                            : 'text-blue-600 focus:ring-blue-500 border-gray-300'
                        }`}
                      />
                      <label htmlFor="dark-mode" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
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
                        className={`h-4 w-4 rounded ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600 focus:ring-offset-gray-800' 
                            : 'text-blue-600 focus:ring-blue-500 border-gray-300'
                        }`}
                      />
                      <label htmlFor="show-progress" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        Always Show Progress Bar
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>About Settings</h3>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Settings are automatically saved to your browser's local storage and will be remembered the next time you visit.
                    GitHub tokens are stored securely in session storage and are cleared when you close your browser.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        // Reset to default settings
                        onOptionsChange({
                          ...DEFAULT_OPTIONS,
                          darkMode: options.darkMode // Keep current dark mode setting
                        });
                      }}
                      className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                    >
                      Reset to default settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`border-t px-6 py-4 flex justify-end ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};