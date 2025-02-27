import React, { useState, useEffect } from 'react';
import { Tag, Info } from 'lucide-react';

interface VersionInfoProps {
  darkMode?: boolean;
}

export const VersionInfo: React.FC<VersionInfoProps> = ({ darkMode = false }) => {
  const [version, setVersion] = useState<string>('v1.1.0');
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [versionDetails, setVersionDetails] = useState<string[]>([]);

  useEffect(() => {
    // In a real app, this would fetch from version.txt
    // For now, we'll hardcode the version info
    setVersion('v1.1.0');
    setVersionDetails([
      'Fixed "Excluded Folders" functionality',
      'Added reload button for refreshing with new settings',
      'Improved dark mode support for all UI elements',
      'Fixed icon references and styling issues',
      'Enhanced error handling for directory access'
    ]);
  }, []);

  return (
    <div className={`relative ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
          darkMode 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-gray-100 hover:bg-gray-200'
        } transition-colors`}
        title="Version Information"
      >
        <Tag className="w-3 h-3" />
        <span>{version}</span>
      </button>
      
      {showDetails && (
        <div 
          className={`absolute bottom-full mb-2 right-0 w-64 p-3 rounded-lg shadow-lg z-10 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center gap-1">
              <Info className="w-4 h-4" />
              <span>FolderFusionX {version}</span>
            </h3>
            <button 
              onClick={() => setShowDetails(false)}
              className={`text-xs ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Close
            </button>
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p className="mb-1">Release Date: October 25, 2025</p>
            <p className="font-medium mt-2 mb-1">What's New:</p>
            <ul className="list-disc pl-4 space-y-1">
              {versionDetails.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              <a 
                href="https://github.com/LaneZero/FolderFusionX/releases" 
                target="_blank"
                rel="noopener noreferrer"
                className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'}`}
              >
                View full changelog
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};