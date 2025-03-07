import React, { useState } from 'react';
import { FileNode } from '../types/FileSystem';
import { File, Folder, ChevronRight, ChevronDown, BookOpen, Search, X, FolderOpen, Download } from 'lucide-react';
import { saveOutput } from '../utils/fileSystem';

interface ComprehensionViewProps {
  data: FileNode;
  darkMode?: boolean;
}

export const ComprehensionView: React.FC<ComprehensionViewProps> = ({ data, darkMode = false }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSave = async () => {
    try {
      await saveOutput(data, 'comprehension');
    } catch (error) {
      console.error('Failed to save comprehension view:', error);
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchTerm('');
    }
  };

  // Collect all unique file extensions for filtering
  const collectFileExtensions = (node: FileNode): Set<string> => {
    const extensions = new Set<string>();
    
    if (node.type === 'file' && node.extension) {
      extensions.add(node.extension);
    }
    
    if (node.children) {
      node.children.forEach(child => {
        const childExtensions = collectFileExtensions(child);
        childExtensions.forEach(ext => extensions.add(ext));
      });
    }
    
    return extensions;
  };
  
  const fileExtensions = Array.from(collectFileExtensions(data)).sort();

  // Filter nodes based on search term and file type
  const filterNode = (node: FileNode): boolean => {
    // If no filters are applied, show all nodes
    if (!searchTerm && fileTypeFilter === 'all') {
      return true;
    }
    
    // Check if the node matches the search term
    const matchesSearch = !searchTerm || 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.path && node.path.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Check if the node matches the file type filter
    const matchesFileType = fileTypeFilter === 'all' || 
      (node.type === 'file' && node.extension === fileTypeFilter) ||
      node.type === 'directory';
    
    // If this is a directory, check if any children match the filters
    if (node.type === 'directory' && node.children) {
      const hasMatchingChild = node.children.some(child => filterNode(child));
      return (matchesSearch && matchesFileType) || hasMatchingChild;
    }
    
    return matchesSearch && matchesFileType;
  };

  const renderNode = (node: FileNode, level = 0) => {
    // Skip nodes that don't match the filters
    if (!filterNode(node)) {
      return null;
    }
    
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const hasMatchingChildren = hasChildren && node.children!.some(child => filterNode(child));

    // Highlight matching text
    const highlightText = (text: string) => {
      if (!searchTerm) return text;
      
      const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
      
      return (
        <>
          {parts.map((part, i) => 
            part.toLowerCase() === searchTerm.toLowerCase() ? 
              <mark key={i} className={`bg-yellow-300 ${darkMode ? 'text-gray-900' : ''}`}>{part}</mark> : 
              part
          )}
        </>
      );
    };

    return (
      <div key={node.path} className={`font-mono ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        <div
          className={`flex items-center py-2 px-4 cursor-pointer transition-colors ${
            isExpanded 
              ? darkMode ? 'bg-gray-700' : 'bg-blue-50' 
              : darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50'
          }`}
          style={{ paddingLeft: `${level * 20 + 16}px` }}
          onClick={() => toggleNode(node.path)}
        >
          <span className="mr-2">
            {hasChildren && hasMatchingChildren ? (
              isExpanded ? (
                <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              )
            ) : (
              <span className="w-4" />
            )}
          </span>
          {node.type === 'directory' ? (
            isExpanded ? (
              <FolderOpen className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'} mr-2`} />
            ) : (
              <Folder className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'} mr-2`} />
            )
          ) : (
            <File className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`} />
          )}
          <span className="text-sm">
            {highlightText(node.name)}
            {node.type === 'file' && node.extension && (
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                .{highlightText(node.extension)}
              </span>
            )}
          </span>
          {node.size && (
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
              ({(node.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
        {isExpanded && hasChildren && hasMatchingChildren && (
          <div className={`border-l-2 ${darkMode ? 'border-gray-700' : 'border-blue-100'} ml-6`}>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
        {isExpanded && node.type === 'file' && (
          <div className={`ml-12 mr-4 my-2 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              <span className={`text-sm font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>File Analysis</span>
            </div>
            <div className="space-y-2">
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-semibold">Type:</span> {node.extension || 'Unknown'} file
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-semibold">Size:</span>{' '}
                {node.size ? `${(node.size / 1024).toFixed(1)} KB` : 'Unknown'}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-semibold">Path:</span> {highlightText(node.path)}
              </p>
              {node.content && (
                <div className="mt-4">
                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Preview:</p>
                  <pre className={`text-xs ${darkMode ? 'bg-gray-800' : 'bg-white'} p-3 rounded border ${darkMode ? 'border-gray-600' : 'border-gray-200'} overflow-x-auto`}>
                    {searchTerm 
                      ? highlightText(node.content.slice(0, 500) + (node.content.length > 500 ? '...' : ''))
                      : node.content.slice(0, 500) + (node.content.length > 500 ? '...' : '')}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-4 py-3`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <h2 className="text-lg font-semibold">Comprehension View</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleSearch}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
                darkMode 
                  ? `${showSearch ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-700 text-white` 
                  : `${showSearch ? 'bg-blue-500' : 'bg-gray-100'} hover:bg-blue-600 ${showSearch ? 'text-white' : 'text-gray-700'}`
              }`}
              title="Search files"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              title="Save analysis"
            >
              <Download className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
          Analyze and understand your project structure
        </p>
      </div>
      
      {showSearch && (
        <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search files and folders..."
                className={`w-full px-3 py-2 pr-8 rounded-md border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              {searchTerm && (
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <X className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              )}
            </div>
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className={`px-3 py-2 rounded-md border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All File Types</option>
              {fileExtensions.map(ext => (
                <option key={ext} value={ext}>.{ext}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'} max-h-[70vh] overflow-auto`}>
        {renderNode(data)}
      </div>
    </div>
  );
};