export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
  extension?: string;
}

export interface VisualizationOptions {
  maxDepth: number;
  showHidden: boolean;
  fileTypes: string[];
  excludePatterns: string[];
  enabledFormats: {
    [key: string]: boolean;
  };
}

export const DEFAULT_FILE_FORMATS = {
  'Source Code': ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.scss', '.html'],
  'Documents': ['.md', '.txt', '.pdf', '.doc', '.docx'],
  'Images': ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
  'Data': ['.json', '.xml', '.csv', '.yml', '.yaml'],
  'Configuration': ['.env', '.config', '.ini', '.conf'],
} as const;

export type PathType = 'local' | 'github';

export interface DirectoryInput {
  type: PathType;
  value: string;
}