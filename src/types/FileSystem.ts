/**
 * Types and interfaces for the file system visualization
 */

/**
 * Represents a node in the file system tree
 */
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
  extension?: string;
  content?: string;
}

/**
 * Configuration options for visualization
 */
export interface VisualizationOptions {
  maxDepth: number;
  showHidden: boolean;
  fileTypes: string[];
  excludePatterns: string[];  // List of folder names to exclude from scanning
  enabledFormats: {
    [key: string]: boolean;
  };
  customExtensions: string[];
  comprehensionMode: boolean;
  showProgressBar: boolean;
  githubToken?: string; // Optional GitHub personal access token
  darkMode?: boolean; // Dark mode preference
}

// Initial default folders that are excluded from scanning
export const INITIAL_DEFAULT_FOLDERS = ['.git', 'node_modules'];

// Default file format categories and their extensions
export const DEFAULT_FILE_FORMATS = {
  'Source Code': ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.scss', '.html'],
  'Documents': ['.md', '.txt', '.pdf', '.doc', '.docx'],
  'Images': ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
  'Data': ['.json', '.xml', '.csv', '.yml', '.yaml'],
  'Configuration': ['.env', '.config', '.ini', '.conf'],
} as const;

/**
 * Type of path input (local file system or GitHub repository)
 */
export type PathType = 'local' | 'github';

/**
 * Input configuration for directory visualization
 */
export interface DirectoryInput {
  type: PathType;
  value: string;
}

/**
 * Status of the directory processing operation
 */
export interface ProcessingStatus {
  total: number;
  processed: number;
  status: 'idle' | 'processing' | 'complete' | 'error' | 'timeout';
  error?: string;
  abortController?: AbortController;
}