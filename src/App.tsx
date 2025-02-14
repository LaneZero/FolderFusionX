import React, { useState, useEffect } from 'react';
import { TreeView } from './components/TreeView';
import { GraphView } from './components/GraphView';
import { TextView } from './components/TextView';
import { PathInput } from './components/PathInput';
import { SettingsModal } from './components/SettingsModal';
import { FileNode, VisualizationOptions, DirectoryInput, DEFAULT_FILE_FORMATS } from './types/FileSystem';
import { FolderTree, GitBranch, Settings, Download, FileText } from 'lucide-react';
import { fetchGitHubContents, parseWindowsPath } from './utils/fileSystem';

const STORAGE_KEY = 'directory-visualizer-settings';

function App() {
  const [viewMode, setViewMode] = useState<'tree' | 'graph' | 'text'>('tree');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FileNode | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [options, setOptions] = useState<VisualizationOptions>(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      maxDepth: 5,
      showHidden: false,
      fileTypes: [],
      excludePatterns: [],
      enabledFormats: Object.keys(DEFAULT_FILE_FORMATS).reduce((acc, format) => ({
        ...acc,
        [format]: true
      }), {})
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }, [options]);

  const handlePathSubmit = async (input: DirectoryInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result: FileNode;
      
      if (input.type === 'github') {
        result = await fetchGitHubContents(input.value);
      } else {
        result = parseWindowsPath(input.value);
      }
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <FolderTree className="w-6 h-6 text-blue-500" />
              Directory Visualizer
            </h1>
          </div>

          {/* Path Input */}
          <div className="px-6 py-4">
            <PathInput onSubmit={handlePathSubmit} isLoading={isLoading} />
            {error && (
              <div className="mt-2 text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="border-b px-6 py-3 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'tree' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                }`}
              >
                <FolderTree className="w-4 h-4 inline-block mr-2" />
                Tree View
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'graph' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                }`}
              >
                <GitBranch className="w-4 h-4 inline-block mr-2" />
                Graph View
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'text' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 inline-block mr-2" />
                Text View
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-md" 
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-md" title="Export">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {!data && !isLoading && (
              <div className="text-center text-gray-500 py-12">
                Enter a path or GitHub URL to visualize
              </div>
            )}
            {isLoading && (
              <div className="text-center text-gray-500 py-12">
                Loading...
              </div>
            )}
            {data && (
              <>
                {viewMode === 'tree' && <TreeView data={data} />}
                {viewMode === 'graph' && <GraphView data={data} />}
                {viewMode === 'text' && <TextView data={data} />}
              </>
            )}
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