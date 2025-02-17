/**
 * File system utility functions for handling local and GitHub paths
 * This module provides functionality for:
 * - Parsing and fetching GitHub repository contents
 * - Handling local directory access via File System Access API
 * - Saving visualization outputs in different formats
 */

import { Octokit } from 'octokit';
import { FileNode } from '../types/FileSystem';
import html2canvas from 'html2canvas';

/**
 * Parses a GitHub URL to extract owner, repo, and path information
 * @param url - GitHub repository URL
 * @returns Object containing owner, repo, and path
 * @throws Error if URL format is invalid
 */
export async function parseGitHubUrl(url: string): Promise<{ owner: string; repo: string; path: string }> {
  const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/[^\/]+)?(?:\/(.*))?/;
  const match = url.match(githubRegex);
  
  if (!match) {
    throw new Error('Invalid GitHub URL format. Please provide a valid GitHub repository URL.');
  }
  
  return {
    owner: match[1],
    repo: match[2],
    path: match[3] || ''
  };
}

/**
 * Fetches repository contents from GitHub
 * @param url - GitHub repository URL
 * @returns FileNode representing the directory structure
 * @throws Error if GitHub API request fails
 */
export async function fetchGitHubContents(url: string): Promise<FileNode> {
  try {
    const octokit = new Octokit();
    const { owner, repo, path } = await parseGitHubUrl(url);
    
    async function fetchDirectory(path: string): Promise<FileNode> {
      try {
        const response = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: path || undefined
        });
        
        if (!Array.isArray(response.data)) {
          throw new Error('Not a directory');
        }
        
        const children = await Promise.all(
          response.data.map(async (item) => {
            const node: FileNode = {
              name: item.name,
              path: item.path,
              type: item.type === 'dir' ? 'directory' : 'file',
              size: item.size
            };
            
            if (item.type === 'file') {
              node.extension = item.name.includes('.') ? item.name.split('.').pop() : undefined;
              try {
                const fileContent = await octokit.rest.repos.getContent({
                  owner,
                  repo,
                  path: item.path
                });
                if ('content' in fileContent.data) {
                  node.content = Buffer.from(fileContent.data.content, 'base64').toString();
                }
              } catch (error) {
                console.warn(`Could not fetch content for ${item.path}`);
              }
            } else if (item.type === 'dir') {
              const subDir = await fetchDirectory(item.path);
              node.children = subDir.children;
            }
            
            return node;
          })
        );
        
        return {
          name: path.split('/').pop() || repo,
          path,
          type: 'directory',
          children
        };
      } catch (error) {
        if (error.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }
        throw error;
      }
    }
    
    return fetchDirectory(path);
  } catch (error) {
    throw new Error(`GitHub Error: ${error.message}`);
  }
}

/**
 * Recursively processes a directory handle to build the file tree
 * @param dirHandle - Directory handle from File System Access API
 * @param path - Current path in the tree
 * @returns Promise<FileNode> representing the directory structure
 */
async function processDirectory(dirHandle: FileSystemDirectoryHandle, path: string): Promise<FileNode> {
  const children: FileNode[] = [];
  
  for await (const entry of dirHandle.values()) {
    const entryPath = `${path}/${entry.name}`;
    
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      let content: string | undefined;
      
      // Only read content for text files under 1MB
      if (file.size < 1024 * 1024 && file.type.startsWith('text/')) {
        try {
          content = await file.text();
        } catch (error) {
          console.warn(`Could not read content for ${entryPath}`);
        }
      }
      
      children.push({
        name: entry.name,
        path: entryPath,
        type: 'file',
        size: file.size,
        extension: entry.name.includes('.') ? entry.name.split('.').pop() : undefined,
        content
      });
    } else if (entry.kind === 'directory') {
      try {
        const subDir = await processDirectory(entry, entryPath);
        children.push(subDir);
      } catch (error) {
        console.warn(`Could not process directory ${entryPath}`);
      }
    }
  }
  
  return {
    name: dirHandle.name,
    path,
    type: 'directory',
    children
  };
}

/**
 * Parses a local directory path using the File System Access API
 * @param path - Local directory path (ignored as we'll use the directory picker)
 * @returns Promise<FileNode> representing the directory structure
 * @throws Error if unable to access the directory or if API is not supported
 */
export async function parseLocalPath(path: string): Promise<FileNode> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error(
      'Your browser does not support the File System Access API. ' +
      'Please use a modern browser like Chrome, Edge, or Opera.'
    );
  }
  
  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read'
    });
    
    return processDirectory(dirHandle, dirHandle.name);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Directory selection was cancelled.');
    }
    if (error.name === 'SecurityError') {
      throw new Error('Permission denied. Please grant access to the directory.');
    }
    throw new Error('Unable to read local directory. Please check permissions and try again.');
  }
}

/**
 * Saves the visualization output based on the view type
 * @param data - FileNode to save
 * @param type - View type used to generate the file
 * @param element - Optional DOM element for graph view screenshot
 */
export async function saveOutput(
  data: FileNode,
  type: 'tree' | 'graph' | 'text' | 'comprehension',
  element?: HTMLElement
): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const filename = `directory-structure-${type}-${date}`;

  try {
    switch (type) {
      case 'graph':
        if (element) {
          const canvas = await html2canvas(element);
          const imageUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;

      case 'text':
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
        
        const textBlob = new Blob([textContent], { type: 'text/plain' });
        const textUrl = URL.createObjectURL(textBlob);
        const textLink = document.createElement('a');
        textLink.href = textUrl;
        textLink.download = `${filename}.txt`;
        document.body.appendChild(textLink);
        textLink.click();
        document.body.removeChild(textLink);
        URL.revokeObjectURL(textUrl);
        break;

      case 'comprehension':
        // Generate detailed JSON with analysis
        const analysisData = {
          structure: data,
          analysis: {
            totalFiles: 0,
            totalDirectories: 0,
            fileTypes: {} as Record<string, number>,
            averageFileSize: 0,
            maxDepth: 0
          }
        };

        let totalSize = 0;
        const analyzeNode = (node: FileNode, depth = 0) => {
          if (node.type === 'file') {
            analysisData.analysis.totalFiles++;
            if (node.size) totalSize += node.size;
            if (node.extension) {
              analysisData.analysis.fileTypes[node.extension] = 
                (analysisData.analysis.fileTypes[node.extension] || 0) + 1;
            }
          } else {
            analysisData.analysis.totalDirectories++;
          }
          analysisData.analysis.maxDepth = Math.max(analysisData.analysis.maxDepth, depth);
          if (node.children) {
            node.children.forEach(child => analyzeNode(child, depth + 1));
          }
        };
        analyzeNode(data);
        
        if (analysisData.analysis.totalFiles > 0) {
          analysisData.analysis.averageFileSize = totalSize / analysisData.analysis.totalFiles;
        }

        const jsonContent = JSON.stringify(analysisData, null, 2);
        const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `${filename}.json`;
        document.body.appendChild(jsonLink);
        jsonLink.click();
        document.body.removeChild(jsonLink);
        URL.revokeObjectURL(jsonUrl);
        break;

      case 'tree':
      default:
        // Save as JSON
        const content = JSON.stringify(data, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to save output:', error);
    throw new Error('Failed to save output. Please try again.');
  }
}