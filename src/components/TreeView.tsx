import React from 'react';
import { FileNode } from '../types/FileSystem';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';

interface TreeViewProps {
  data: FileNode;
  level?: number;
}

export const TreeView: React.FC<TreeViewProps> = ({ data, level = 0 }) => {
  const [isOpen, setIsOpen] = React.useState(level < 2);

  const toggleOpen = () => setIsOpen(!isOpen);

  const renderIcon = () => {
    if (data.type === 'directory') {
      return isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <div className="select-none">
      <div
        className="flex items-center space-x-1 hover:bg-gray-100 rounded px-2 py-1 cursor-pointer"
        style={{ paddingLeft: `${level * 20}px` }}
        onClick={toggleOpen}
      >
        {renderIcon()}
        {data.type === 'directory' ? (
          <Folder className="w-4 h-4 text-blue-500" />
        ) : (
          <File className="w-4 h-4 text-gray-500" />
        )}
        <span className="text-sm">{data.name}</span>
      </div>
      {isOpen && data.children && (
        <div>
          {data.children.map((child, index) => (
            <TreeView key={index} data={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};