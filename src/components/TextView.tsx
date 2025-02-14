import React from 'react';
import { FileNode } from '../types/FileSystem';
import { Copy, Check } from 'lucide-react';

interface TextViewProps {
  data: FileNode;
}

export const TextView: React.FC<TextViewProps> = ({ data }) => {
  const [copied, setCopied] = React.useState(false);
  
  const generateTextTree = (node: FileNode, level = 0, isLast = true, prefix = ''): string => {
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
  };

  const textContent = generateTextTree(data);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={copyToClipboard}
        className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-5 h-5 text-green-500" />
        ) : (
          <Copy className="w-5 h-5 text-gray-500" />
        )}
      </button>
      <pre className="font-mono text-sm bg-gray-50 p-6 rounded-lg whitespace-pre overflow-x-auto">
        {textContent}
      </pre>
    </div>
  );
};