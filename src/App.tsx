import React, { useState, useEffect } from 'react';
import { TreeView } from './components/TreeView';
import { GraphView } from './components/GraphView';
import { TextView } from './components/TextView';
import { ComprehensionView } from './components/ComprehensionView';
import { PathInput } from './components/PathInput';
import { SettingsModal } from './components/SettingsModal';
import { ProgressBar } from './components/ProgressBar';
import { FileNode, VisualizationOptions, DirectoryInput, DEFAULT_FILE_FORMATS, ProcessingStatus } from './types/FileSystem';
import { FolderTree, GitBranch, Settings, Download, FileText, Github, Coffee, RotateCcw, BookOpen } from 'lucide-react';
import { fetchGitHubContents, parseLocalPath, saveOutput } from './utils/fileSystem';

const STORAGE_KEY = 'FolderFusionX-settings'; // ctz
const GITHUB_REPO = 'https://github.com/LaneZero/FolderFusionX'; // ctz

const DEFAULT_OPTIONS: VisualizationOptions = {
  maxDepth: 5,
  showHidden: false,
  fileTypes: [],
  excludePatterns: [], // Initialize with empty array, defaults will be added in UI
  customExtensions: [],
  comprehensionMode: false,
  enabledFormats: Object.keys(DEFAULT_FILE_FORMATS).reduce((acc, format) => ({
    ...acc,
    [format]: true
  }), {}),
  showProgressBar: false
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
  
  const [options, setOptions] = useState<VisualizationOptions>(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      return savedSettings ? JSON.parse(savedSettings) : DEFAULT_OPTIONS;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_OPTIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }, [options]);

  const resetSettings = () => {
    setOptions(DEFAULT_OPTIONS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handlePathSubmit = async (input: DirectoryInput) => {
    setIsLoading(true);
    setError(null);
    setProcessingStatus({ total: 0, processed: 0, status: 'processing' });
    
    try {
      let result: FileNode;
      
      if (input.type === 'github') {
        result = await fetchGitHubContents(input.value);
      } else {
        try {
          result = await parseLocalPath(input.value);
        } catch (error) {
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

  const filterNodesBySettings = (node: FileNode, options: VisualizationOptions): FileNode => {
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <FolderTree className="w-6 h-6" />
              Directory Visualizer
            </h1>
            <p className="text-blue-100 mt-1">
              Visualize and analyze directory structures with ease
            </p>
          </div>

          <div className="px-6 py-4">
            <PathInput onSubmit={handlePathSubmit} isLoading={isLoading} />
            <div className="mt-3">
              <ProgressBar status={processingStatus} />
            </div>
            {error && (
              <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                {error}
              </div>
            )}
          </div>

          <div className="border-b px-6 py-3 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'tree' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FolderTree className="w-4 h-4 inline-block mr-2" />
                Tree View
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'graph' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <GitBranch className="w-4 h-4 inline-block mr-2" />
                Graph View
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'text' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4 inline-block mr-2" />
                Text View
              </button>
              <button
                onClick={() => setViewMode('comprehension')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'comprehension' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4 inline-block mr-2" />
                Comprehension
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={resetSettings}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
                title="Reset Settings"
              >
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={handleSave}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
                title="Save Output"
                disabled={!data}
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {!data && !isLoading && (
              <div className="text-center py-12">
                <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-900 mb-2">
                  Ready to Visualize
                </h2>
                <p className="text-gray-500">
                  Select a local directory or enter a GitHub URL to start exploring
                </p>
              </div>
            )}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Processing directory structure...</p>
              </div>
            )}
            {data && (
              <div className="border rounded-lg overflow-hidden">
                {viewMode === 'tree' && <TreeView data={data} />}
                {viewMode === 'graph' && <GraphView data={data} />}
                {viewMode === 'text' && <TextView data={data} />}
                {viewMode === 'comprehension' && <ComprehensionView data={data} />}
              </div>
            )}
          </div>

			<div className="border-t px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500"> 
                © 2025 Folder Fusion X (FFX). All rights reserved. 
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.coffeete.ir/AhmadR3zA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-amber-500 transition-colors"
                >
                  <Coffee className="w-4 h-4" />
                  <span className="text-sm">Buy me a coffee</span>
                </a>
                <a
                  href={GITHUB_REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span className="text-sm">View on GitHub</span>                </a>
                <a
                  href={GITHUB_REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span className="text-sm">View on GitHub</span>
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