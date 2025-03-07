import React, { useState } from 'react';
import { FileNode } from '../types/FileSystem';
import { ChevronRight, ChevronDown, Folder, File, FolderOpen, Download, Copy, Check } from 'lucide-react';
import { saveOutput } from '../utils/fileSystem';

interface TreeViewProps {
  data: FileNode;
  level?: number;
  darkMode?: boolean;
}

export const TreeView: React.FC<TreeViewProps> = ({ data, level = 0, darkMode = false }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(level < 2);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

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
      await saveOutput(data, 'tree');
      // Show a success message
    } catch (error) {
      console.error('Failed to save tree view:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      // Generate plain text representation
      let textContent = '';
      const generateText = (node: FileNode, level = 0) => {
        const indent = '  '.repeat(level);
        textContent += `${indent}${node.name}${node.type === 'file' ? ` (${node.extension || 'file'})` : ''}\n`;
        if (node.children) {
          node.children.forEach(child => generateText(child, level + 1));
        }
      };
      generateText(data);
      
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('خطا در کپی متن:', err);
    }
  };

  const renderIcon = () => {
    if (data.type === 'directory') {
      return isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />;
    }
    return null;
  };

  // If this is the root node, render a container with controls
  if (level === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
        <div className="border-b p-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Folder className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <span>Tree View</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Copy as text"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>Copy</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              title="Save as JSON"
            >
              <Download className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
        <div className="p-2 overflow-auto max-h-[70vh]">
          <TreeNodeContent data={data} level={0} darkMode={darkMode} />
        </div>
      </div>
    );
  }

  return (
    <TreeNodeContent data={data} level={level} darkMode={darkMode} />
  );
};

// Extracted the node content to a separate component
const TreeNodeContent: React.FC<TreeViewProps> = ({ data, level = 0, darkMode = false }) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  
  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="select-none">
      <div
        className={`flex items-center space-x-1 rounded px-2 py-1.5 cursor-pointer transition-colors ${
          darkMode 
            ? 'hover:bg-gray-700' 
            : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={toggleOpen}
      >
        {data.type === 'directory' && (
          isOpen 
            ? <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            : <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        )}
        {data.type === 'directory' ? (
          isOpen 
            ? <FolderOpen className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            : <Folder className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
        ) : (
          <File className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        )}
        <span className={`text-sm ${data.type === 'directory' ? 'font-medium' : ''}`}>
          {data.name}
          {data.type === 'file' && data.extension && (
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>.{data.extension}</span>
          )}
        </span>
        {data.size && (
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} ml-2`}>
            ({(data.size / 1024).toFixed(1)} KB)
          </span>
        )}
      </div>
      {isOpen && data.children && (
        <div>
          {data.children.map((child, index) => (
            <TreeNodeContent key={`${child.path}-${index}`} data={child} level={level + 1} darkMode={darkMode} />
          ))}
        </div>
      )}
    </div>
  );
};