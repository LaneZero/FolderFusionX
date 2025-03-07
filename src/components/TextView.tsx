import React, { useState } from 'react';
import { FileNode } from '../types/FileSystem';
import { Copy, Check, Download, Search, X } from 'lucide-react';
import { saveOutput } from '../utils/fileSystem';
import { useTranslation } from 'react-i18next';

interface TextViewProps {
  data: FileNode;
  darkMode?: boolean;
}

export const TextView: React.FC<TextViewProps> = ({ data, darkMode = false }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [textContent, setTextContent] = useState(() => generateTextTree(data));
  
  function generateTextTree(node: FileNode, level = 0, isLast = true, prefix = ''): string {
    const indent = level === 0 ? '' : prefix + (isLast ? '└── ' : '├── ');
    const newPrefix = level === 0 ? '' : prefix + (isLast ? '    ' : '│   ');
    
    let result = `${indent}${node.name}${node.type === 'file' ? ` (${node.extension || 'file'})` : ''}\n`;
    
    if (node.children) {
      node.children.forEach((child, index) => {
        result += generateTextTree(
          child,
          level + 1,
          index === node.children!.length - 1,
          newPrefix
        );
      });
    }
    
    return result;
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('خطا در کپی متن:', err);
    }
  };

  const handleSave = async () => {
    try {
      await saveOutput(data, 'text');
    } catch (error) {
      console.error('Failed to save text view:', error);
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchTerm('');
    }
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? 
        <mark key={i} className={`bg-yellow-300 ${darkMode ? 'text-gray-900' : ''}`}>{part}</mark> : 
        part
    );
  };

  return (
    <div className={`relative ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      <div className={`border-b p-3 flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-lg font-semibold">Text View</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleSearch}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
              darkMode 
                ? `${showSearch ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-700 text-white` 
                : `${showSearch ? 'bg-blue-500' : 'bg-gray-100'} hover:bg-blue-600 ${showSearch ? 'text-white' : 'text-gray-700'}`
            }`}
            title="Search text"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          <button
            onClick={copyToClipboard}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Copy to clipboard"
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
            title="Save as text file"
          >
            <Download className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
      
      {showSearch && (
        <div className={`p-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in text..."
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
          {searchTerm && (
            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {textContent.toLowerCase().includes(searchTerm.toLowerCase()) 
                ? `Found matches for "${searchTerm}"`
                : `No matches found for "${searchTerm}"`}
            </div>
          )}
        </div>
      )}
      
      <div className={`overflow-auto max-h-[70vh] ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <pre className={`font-mono text-sm p-6 whitespace-pre ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
          {searchTerm ? highlightSearchTerm(textContent) : textContent}
        </pre>
      </div>
    </div>
  );
};