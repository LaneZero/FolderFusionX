import React from 'react';
import { FileNode } from '../types/FileSystem';
import { File, Folder, ChevronRight, ChevronDown, BookOpen } from 'lucide-react';

interface ComprehensionViewProps {
  data: FileNode;
}

export const ComprehensionView: React.FC<ComprehensionViewProps> = ({ data }) => {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: FileNode, level = 0) => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path} className="font-mono">
        <div
          className={`flex items-center py-2 px-4 hover:bg-blue-50 cursor-pointer transition-colors ${
            isExpanded ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 16}px` }}
          onClick={() => toggleNode(node.path)}
        >
          <span className="mr-2">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-blue-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-blue-500" />
              )
            ) : (
              <span className="w-4" />
            )}
          </span>
          {node.type === 'directory' ? (
            <Folder className="w-4 h-4 text-blue-500 mr-2" />
          ) : (
            <File className="w-4 h-4 text-gray-500 mr-2" />
          )}
          <span className="text-sm">
            {node.name}
            {node.type === 'file' && node.extension && (
              <span className="text-gray-500 ml-2">.{node.extension}</span>
            )}
          </span>
          {node.size && (
            <span className="text-xs text-gray-500 ml-2">
              ({(node.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div className="border-l-2 border-blue-100 ml-6">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
        {isExpanded && node.type === 'file' && (
          <div className="ml-12 mr-4 my-2 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-700">File Analysis</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Type:</span> {node.extension || 'Unknown'} file
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Size:</span>{' '}
                {node.size ? `${(node.size / 1024).toFixed(1)} KB` : 'Unknown'}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Path:</span> {node.path}
              </p>
              {node.content && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                    {node.content.slice(0, 500)}
                    {node.content.length > 500 && '...'}
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="border-b bg-gradient-to-r from-blue-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-800">Comprehension View</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Analyze and understand your project structure
        </p>
      </div>
      <div className="divide-y">{renderNode(data)}</div>
    </div>
  );
};