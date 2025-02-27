import React, { useState, useEffect } from 'react';
import { TreeView } from './components/TreeView';
import { GraphView } from './components/GraphView';
import { TextView } from './components/TextView';
import { ComprehensionView } from './components/ComprehensionView';
import { PathInput } from './components/PathInput';
import { SettingsModal } from './components/SettingsModal';
import { ProgressBar } from './components/ProgressBar';
import { VersionInfo } from './components/VersionInfo';
import { FileNode, VisualizationOptions, DirectoryInput, DEFAULT_FILE_FORMATS, ProcessingStatus } from './types/FileSystem';
import { FolderTree, GitBranch, Settings, Download, FileText, Github, Coffee, RotateCcw, BookOpen, Sun, Moon, Link, RefreshCw } from 'lucide-react';
import { fetchGitHubContents, parseLocalPath, saveOutput, validateGitHubToken } from './utils/fileSystem';
import { logger } from './utils/logger';

const STORAGE_KEY = 'FolderFusionX-settings'; // ctz
const GITHUB_REPO = 'https://github.com/LaneZero/FolderFusionX'; // ctz

const DEFAULT_OPTIONS: VisualizationOptions = {
  maxDepth: 5,
  showHidden: false,
  fileTypes: [],
  excludePatterns: [],
  customExtensions: [],
  comprehensionMode: false,
  enabledFormats: Object.keys(DEFAULT_FILE_FORMATS).reduce((acc, format) => ({
    ...acc,
    [format]: true
  }), {}),
  showProgressBar: false,
  darkMode: false
};

function App() {
  const [viewMode, setViewMode] = useState<'tree' | 'graph' | 'text' | 'comprehension'>('tree');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FileNode | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    total: 0,
    processed: 0,
    status: 'idle'
  });
  const [lastInput, setLastInput] = useState<DirectoryInput | null>(null);
  
  const [options, setOptions] = useState<VisualizationOptions>(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      return savedSettings ? JSON.parse(savedSettings) : DEFAULT_OPTIONS;
    } catch (error) {
      logger.error('Failed to load settings', { error });
      return DEFAULT_OPTIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    // Apply dark mode to document
    document.documentElement.classList.toggle('dark', options.darkMode);
  }, [options]);

  const resetSettings = () => {
    setOptions(DEFAULT_OPTIONS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const toggleDarkMode = () => {
    setOptions(prev => ({
      ...prev,
      darkMode: !prev.darkMode
    }));
  };

  const handlePathSubmit = async (input: DirectoryInput) => {
    setIsLoading(true);
    setError(null);
    setProcessingStatus({ total: 0, processed: 0, status: 'processing' });
    setLastInput(input); // Store the input for potential reload
    
    // Create AbortController for cancellation
    const abortController = new AbortController();
    setProcessingStatus(prev => ({
      ...prev,
      abortController
    }));
    
    try {
      let result: FileNode;
      
      if (input.type === 'github') {
        try {
          // Validate GitHub token if provided
          if (options.githubToken) {
            const tokenValidation = await validateGitHubToken(options.githubToken);
            if (!tokenValidation.valid) {
              setError('Invalid GitHub token. Please check your token in settings.');
              setProcessingStatus(prev => ({ 
                ...prev, 
                status: 'error',
                error: 'Invalid GitHub token'
              }));
              setIsLoading(false);
              return;
            }
            
            logger.info('GitHub token validated', { 
              username: tokenValidation.username,
              rateLimit: tokenValidation.rateLimit
            });
            
            // Show rate limit information
            if (tokenValidation.rateLimit && tokenValidation.rateLimit.remaining < 10) {
              logger.warn('GitHub API rate limit low', { 
                remaining: tokenValidation.rateLimit.remaining,
                reset: tokenValidation.rateLimit.reset
              });
            }
          }
          
          result = await fetchGitHubContents(input.value, options, abortController.signal);
        } catch (error) {
          if (error.name === 'AbortError') {
            setError('Operation cancelled by user');
            return;
          }
          if (error.message.includes('timed out')) {
            setProcessingStatus(prev => ({ 
              ...prev, 
              status: 'timeout',
              error: 'Request timed out. Please try again.'
            }));
            setError('Request timed out. Please try again.');
          } else if (error.message.includes('rate limit')) {
            setError(
              options.githubToken
                ? 'GitHub API rate limit exceeded. Please try again later.'
                : 'GitHub API rate limit exceeded. Consider adding a personal access token in settings.'
            );
          } else {
            setError(error.message);
          }
          setProcessingStatus(prev => ({ 
            ...prev, 
            status: 'error',
            error: error.message
          }));
          setIsLoading(false);
          return;
        }
      } else {
        try {
          result = await parseLocalPath(input.value);
        } catch (error) {
          if (error.name === 'AbortError') {
            setError('Operation cancelled by user');
            return;
          }
          if (error.name === 'SecurityError' || error.message.includes('Permission denied')) {
            setError(
              'Permission denied. Please grant access to the directory. Note that some system directories may be restricted.'
            );
          } else if (error.name === 'AbortError' || error.message.includes('cancelled')) {
            setError('Directory selection was cancelled. Please try again.');
          } else if (error.message.includes('File System Access API')) {
            setError(
              'Your browser does not support directory access. Please use Chrome, Edge, or Opera.'
            );
          } else {
            setError('Failed to read directory. Please try again or choose a different directory.');
          }
          setProcessingStatus(prev => ({ 
            ...prev, 
            status: 'error',
            error: error.message
          }));
          setIsLoading(false);
          return;
        }
      }
      
      const filteredResult = filterNodesBySettings(result, options);
      setData(filteredResult);
      setProcessingStatus(prev => ({ ...prev, status: 'complete' }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setProcessingStatus(prev => ({ 
        ...prev, 
        status: 'error',
        error: errorMessage
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOperation = () => {
    if (processingStatus.abortController) {
      processingStatus.abortController.abort();
      setProcessingStatus(prev => ({
        ...prev,
        status: 'idle',
        abortController: undefined
      }));
    }
  };

  const handleReloadWithNewSettings = () => {
    if (lastInput) {
      handlePathSubmit(lastInput);
    }
  };

  const filterNodesBySettings = (node: FileNode, options: VisualizationOptions): FileNode | null => {
    // Check if the node should be excluded based on exclude patterns
    if (node.type === 'directory' && options.excludePatterns.includes(node.name)) {
      return null;
    }

    const isFileAllowed = (file: FileNode) => {
      if (!file.extension) return true;
      if (options.customExtensions.includes(`.${file.extension}`)) return true;
      
      return Object.entries(options.enabledFormats).some(([category, enabled]) => {
        return enabled && DEFAULT_FILE_FORMATS[category as keyof typeof DEFAULT_FILE_FORMATS]
          .some(ext => ext.endsWith(file.extension!));
      });
    };

    const isNodeVisible = (node: FileNode) => {
      if (node.type === 'directory') return true;
      if (!options.showHidden && node.name.startsWith('.')) return false;
      return isFileAllowed(node);
    };

    if (!isNodeVisible(node)) return null;

    if (node.children) {
      const filteredChildren = node.children
        .map(child => filterNodesBySettings(child, options))
        .filter(Boolean) as FileNode[];
      
      return { ...node, children: filteredChildren };
    }

    return node;
  };

  const handleSave = () => {
    if (data) {
      saveOutput(data, viewMode);
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${
      options.darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-b from-gray-50 to-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className={`rounded-lg shadow-lg ${
          options.darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`border-b px-6 py-4 ${
            options.darkMode
              ? 'bg-gradient-to-r from-blue-900 to-blue-800 border-gray-700'
              : 'bg-gradient-to-r from-blue-600 to-blue-700'
          }`}>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                <FolderTree className="w-6 h-6" />
                FolderFusionX (FFX)
              </h1>
              <div className="flex items-center gap-2">
                <VersionInfo darkMode={options.darkMode} />
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  title={options.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {options.darkMode ? (
                    <Sun className="w-5 h-5 text-yellow-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
            <p className={`mt-1 ${options.darkMode ? 'text-blue-200' : 'text-blue-100'}`}>
              Visualize and analyze directory structures with ease
            </p>
          </div>

          <div className="px-6 py-4">
            <PathInput onSubmit={handlePathSubmit} isLoading={isLoading} darkMode={options.darkMode} />
            <div className="mt-3">
              <ProgressBar
                status={processingStatus}
                onCancel={handleCancelOperation}
                darkMode={options.darkMode}
              />
            </div>
            {error && (
              <div className={`mt-2 p-3 rounded-md border ${
                options.darkMode
                  ? 'bg-red-900/50 text-red-200 border-red-800'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {error}
              </div>
            )}
          </div>

          <div className={`border-b px-6 py-3 flex items-center justify-between ${
            options.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'tree'
                    ? options.darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : options.darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FolderTree className="w-4 h-4 inline-block mr-2" />
                Tree View
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'graph'
                    ? options.darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : options.darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <GitBranch className="w-4 h-4 inline-block mr-2" />
                Graph View
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'text'
                    ? options.darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : options.darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4 inline-block mr-2" />
                Text View
              </button>
              <button
                onClick={() => setViewMode('comprehension')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'comprehension'
                    ? options.darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : options.darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4 inline-block mr-2" />
                Comprehension
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {lastInput && (
                <button 
                  onClick={handleReloadWithNewSettings}
                  className={`p-2 rounded-md transition-colors ${
                    options.darkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Reload with current settings"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={resetSettings}
                className={`p-2 rounded-md transition-colors ${
                  options.darkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Reset Settings"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-md transition-colors ${
                  options.darkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSave}
                className={`p-2 rounded-md transition-colors ${
                  options.darkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Save Output"
                disabled={!data}
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {!data && !isLoading && (
              <div className={`text-center py-12 ${
                options.darkMode ? 'text-gray-300' : ''
              }`}>
                <FolderTree className={`w-16 h-16 mx-auto mb-4 ${
                  options.darkMode ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <h2 className={`text-xl font-medium mb-2 ${
                  options.darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  Ready to Visualize
                </h2>
                <p className={options.darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Select a local directory or enter a GitHub URL to start exploring
                </p>
              </div>
            )}
            {isLoading && (
              <div className="text-center py-12">
                <div className={`animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4 ${
                  options.darkMode
                    ? 'border-blue-500 border-t-transparent'
                    : 'border-blue-500 border-t-transparent'
                }`}></div>
                <p className={options.darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Processing directory structure...
                </p>
              </div>
            )}
            {data && (
              <div className={`border rounded-lg overflow-hidden ${
                options.darkMode ? 'border-gray-700' : ''
              }`}>
                {viewMode === 'tree' && <TreeView data={data} darkMode={options.darkMode} />}
                {viewMode === 'graph' && <GraphView data={data} darkMode={options.darkMode} />}
                {viewMode === 'text' && <TextView data={data} darkMode={options.darkMode} />}
                {viewMode === 'comprehension' && (
                  <ComprehensionView data={data} darkMode={options.darkMode} />
                )}
              </div>
            )}
          </div>

          <div className={`border-t px-6 py-4 ${
            options.darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-gray-50'
          }`}>
            <div className="flex justify-between items-center">
              <p className={options.darkMode ? 'text-gray-400' : 'text-gray-500'}>
                © 2025 Folder Fusion X (FFX). All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.coffeete.ir/AhmadR3zA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 transition-colors ${
                    options.darkMode
                      ? 'text-gray-400 hover:text-amber-400'
                      : 'text-gray-600 hover:text-amber-500'
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                  <span className="text-sm">Buy me a coffee</span>
                </a>
                <a
                  href={GITHUB_REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 transition-colors ${
                    options.darkMode
                      ? 'text-gray-400 hover:text-blue-400'
                      : 'text-gray-600 hover:text-blue-500'
                  }`}
                >
                  <Github className="w-4 h-4" />
                  <span className="text-sm">View on GitHub</span>
                </a>
                <a
                  href="https://github.com/LaneZero/DirTreePhoria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 transition-colors ${
                    options.darkMode
                      ? 'text-gray-400 hover:text-amber-400'
                      : 'text-gray-600 hover:text-amber-500'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  <span className="text-sm">DirTreePhoria</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        onOptionsChange={setOptions}
      />
    </div>
  );
}

export default App;