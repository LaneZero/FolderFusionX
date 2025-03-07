import { Octokit } from 'octokit';
import { FileNode, VisualizationOptions, INITIAL_DEFAULT_FOLDERS, ProcessingStatus } from '../types/FileSystem';
import html2canvas from 'html2canvas';
import { logger } from './logger';

// Default options for file processing
const DEFAULT_OPTIONS: VisualizationOptions = {
  maxDepth: 5,
  showHidden: false,
  fileTypes: [],
  excludePatterns: [...INITIAL_DEFAULT_FOLDERS],
  customExtensions: [],
  comprehensionMode: false,
  enabledFormats: {},
  showProgressBar: false
};

// Timeout and retry configuration
const GITHUB_TIMEOUT = 30000; // Reduced from 60000 to 30000 (30 seconds)
const MAX_RETRIES = 2; // Reduced from 3 to 2
const RETRY_DELAY = 1000; // Reduced from 2000 to 1000 (1 second)

// Cache for GitHub API responses
const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Delay function for retry mechanism
 * @param ms Milliseconds to delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates a promise that rejects after a specified timeout
 * @param ms Timeout duration in milliseconds
 */
function timeout(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Operation timed out'));
    }, ms);
  });
}

/**
 * Get cached response or null if not found or expired
 * @param key Cache key
 */
function getCachedResponse(key: string) {
  if (!apiCache.has(key)) return null;
  
  const { data, timestamp } = apiCache.get(key);
  const now = Date.now();
  
  if (now - timestamp > CACHE_TTL) {
    apiCache.delete(key);
    return null;
  }
  
  return data;
}

/**
 * Set response in cache
 * @param key Cache key
 * @param data Response data
 */
function setCachedResponse(key: string, data: any) {
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Retry mechanism for API calls with exponential backoff
 * @param fn Function to retry
 * @param retries Number of retries remaining
 * @param onRetry Callback function called on each retry
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  onRetry?: (attempt: number) => void
): Promise<T> {
  try {
    return await Promise.race([
      fn(),
      timeout(GITHUB_TIMEOUT)
    ]);
  } catch (error) {
    if (retries === 0) {
      logger.error('API retry limit exceeded', { error });
      throw error;
    }
    
    if (onRetry) {
      onRetry(MAX_RETRIES - retries + 1);
    }
    
    logger.warn('API call failed, retrying', {
      retriesLeft: retries - 1,
      error: error.message
    });
    
    // Exponential backoff: increase delay with each retry
    const backoffDelay = RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
    await delay(backoffDelay);
    return withRetry(fn, retries - 1, onRetry);
  }
}

/**
 * Checks if a path should be excluded based on the exclude patterns
 * @param path - Path to check
 * @param excludePatterns - List of patterns to exclude
 * @returns boolean indicating if the path should be excluded
 */
function shouldExcludePath(path: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => 
    path.split('/').some(part => part === pattern)
  );
}

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
    logger.error('Invalid GitHub URL format', { url });
    throw new Error('Invalid GitHub URL format. Please provide a valid GitHub repository URL.');
  }
  
  return {
    owner: match[1],
    repo: match[2],
    path: match[3] || ''
  };
}

/**
 * Validates a GitHub token by making a test API call
 * @param token - GitHub personal access token to validate
 * @returns Object containing validity status and user information if valid
 */
export async function validateGitHubToken(token: string): Promise<{ 
  valid: boolean; 
  username?: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: Date;
  }
}> {
  if (!token) {
    return { valid: false };
  }

  try {
    const octokit = new Octokit({
      auth: token,
      request: {
        timeout: 10000 // shorter timeout for validation
      }
    });

    // Get user information to validate token
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    // Check rate limit information
    const { data: rateLimitData } = await octokit.rest.rateLimit.get();
    
    return {
      valid: true,
      username: user.login,
      rateLimit: {
        limit: rateLimitData.rate.limit,
        remaining: rateLimitData.rate.remaining,
        reset: new Date(rateLimitData.rate.reset * 1000)
      }
    };
  } catch (error) {
    logger.error('GitHub token validation failed', { error });
    return { valid: false };
  }
}

/**
 * Fetches repository contents from GitHub with improved timeout and retry handling
 * @param url - GitHub repository URL
 * @param options - Visualization options including GitHub token
 * @param signal - AbortController signal for cancellation
 * @returns FileNode representing the directory structure
 * @throws Error if GitHub API request fails or times out after all retries
 */
export async function fetchGitHubContents(
  url: string,
  options?: VisualizationOptions,
  signal?: AbortSignal
): Promise<FileNode> {
  try {
    const octokit = new Octokit({
      auth: options?.githubToken,
      request: {
        timeout: GITHUB_TIMEOUT,
        signal
      }
    });

    const { owner, repo, path } = await parseGitHubUrl(url);
    
    // Check rate limit before proceeding
    const { data: rateLimit } = await octokit.rest.rateLimit.get();
    logger.info('GitHub API rate limit status', {
      remaining: rateLimit.rate.remaining,
      reset: new Date(rateLimit.rate.reset * 1000).toISOString()
    });

    if (rateLimit.rate.remaining === 0) {
      const resetTime = new Date(rateLimit.rate.reset * 1000);
      throw new Error(`The GitHub API rate limit has been exceeded. Reset in ${resetTime.toLocaleString()}`);
    }
    
    // Track progress for the progress bar
    let totalFiles = 0;
    let processedFiles = 0;
    let updateProgressCallback: ((status: Partial<ProcessingStatus>) => void) | null = null;
    
    // Set up progress tracking
    const setProgressCallback = (callback: (status: Partial<ProcessingStatus>) => void) => {
      updateProgressCallback = callback;
    };
    
    // Update progress
    const updateProgress = (increment = 1) => {
      processedFiles += increment;
      if (updateProgressCallback) {
        updateProgressCallback({
          total: totalFiles,
          processed: processedFiles
        });
      }
    };
    
    // First pass to count total files for progress tracking - now with caching
    async function countFiles(path: string): Promise<number> {
      const cacheKey = `count:${owner}/${repo}/${path}`;
      const cachedCount = getCachedResponse(cacheKey);
      
      if (cachedCount !== null) {
        return cachedCount;
      }
      
      try {
        const response = await withRetry(
          () => octokit.rest.repos.getContent({
            owner,
            repo,
            path: path || undefined,
            request: { signal }
          })
        );
        
        if (!Array.isArray(response.data)) {
          return 1; // Single file
        }
        
        let count = 0;
        const promises = [];
        
        for (const item of response.data) {
          if (item.type === 'file') {
            count++;
          } else if (item.type === 'dir') {
            promises.push(countFiles(item.path));
          }
        }
        
        // Process directory counts in parallel
        const dirCounts = await Promise.all(promises);
        count += dirCounts.reduce((sum, c) => sum + c, 0);
        
        setCachedResponse(cacheKey, count);
        return count;
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        logger.warn(`Could not count files in ${path}`, { error });
        return 0;
      }
    }
    
    async function fetchDirectory(path: string): Promise<FileNode> {
      const cacheKey = `dir:${owner}/${repo}/${path}`;
      const cachedDir = getCachedResponse(cacheKey);
      
      if (cachedDir !== null) {
        return cachedDir;
      }
      
      try {
        const response = await withRetry(
          () => octokit.rest.repos.getContent({
            owner,
            repo,
            path: path || undefined,
            request: { signal }
          }),
          MAX_RETRIES,
          (attempt) => {
            logger.warn('Retrying GitHub API request', {
              attempt,
              path
            });
          }
        );
        
        if (!Array.isArray(response.data)) {
          throw new Error('Not a directory');
        }
        
        // Process children in batches to avoid overwhelming the API
        const batchSize = 5;
        const children = [];
        
        for (let i = 0; i < response.data.length; i += batchSize) {
          const batch = response.data.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (item) => {
              // Skip excluded directories early
              if (item.type === 'dir' && options?.excludePatterns?.includes(item.name)) {
                return null;
              }
              
              const node: FileNode = {
                name: item.name,
                path: item.path,
                type: item.type === 'dir' ? 'directory' : 'file',
                size: item.size
              };
              
              if (item.type === 'file') {
                updateProgress();
                node.extension = item.name.includes('.') ? item.name.split('.').pop() : undefined;
                
                // Only fetch content for small text files
                if (item.size < 100000 && isTextFile(item.name)) {
                  try {
                    const contentCacheKey = `content:${owner}/${repo}/${item.path}`;
                    const cachedContent = getCachedResponse(contentCacheKey);
                    
                    if (cachedContent !== null) {
                      node.content = cachedContent;
                    } else {
                      const fileContent = await withRetry(
                        () => octokit.rest.repos.getContent({
                          owner,
                          repo,
                          path: item.path,
                          request: { signal }
                        })
                      );
                      if ('content' in fileContent.data) {
                        node.content = Buffer.from(fileContent.data.content, 'base64').toString();
                        setCachedResponse(contentCacheKey, node.content);
                      }
                    }
                  } catch (error) {
                    logger.warn(`Could not fetch content for ${item.path}`, { error });
                  }
                }
              } else if (item.type === 'dir') {
                const subDir = await fetchDirectory(item.path);
                node.children = subDir.children;
              }
              
              return node;
            })
          );
          
          // Filter out null values (excluded directories)
          children.push(...batchResults.filter(Boolean));
        }
        
        const result = {
          name: path.split('/').pop() || repo,
          path,
          type: 'directory',
          children
        };
        
        setCachedResponse(cacheKey, result);
        return result;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw error;
        }
        if (error.message === 'Operation timed out') {
          logger.error('GitHub API request timed out', {
            path,
            timeout: GITHUB_TIMEOUT
          });
          throw new Error(`GitHub API request timed out after ${MAX_RETRIES} retries. Please try again later.`);
        }
        if (error.status === 403) {
          logger.error('GitHub API rate limit exceeded', {
            hasToken: !!options?.githubToken
          });
          const rateLimitError = options?.githubToken
            ? 'The GitHub API rate limit has been exceeded. Please try again later.'
            : 'The GitHub API rate limit has been exceeded. Please add a personal access token in the settings.';
          throw new Error(rateLimitError);
        }
        throw error;
      }
    }
    
    // Helper to determine if a file is likely a text file
    function isTextFile(filename: string): boolean {
      const textExtensions = [
        'txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss',
        'xml', 'yaml', 'yml', 'csv', 'py', 'java', 'c', 'cpp', 'h', 'sh', 'bat'
      ];
      const extension = filename.split('.').pop()?.toLowerCase();
      return extension ? textExtensions.includes(extension) : false;
    }
    
    // Count total files first for progress tracking
    totalFiles = await countFiles(path);
    logger.info('Total files to process', { count: totalFiles });
    
    if (updateProgressCallback) {
      updateProgressCallback({
        total: totalFiles,
        processed: 0,
        status: 'processing'
      });
    }
    
    return fetchDirectory(path);
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.info('GitHub API request cancelled by user');
      throw error;
    }
    if (error.message.includes('timed out')) {
      logger.error('GitHub API request timed out', {
        url,
        timeout: GITHUB_TIMEOUT
      });
      throw new Error(`The request failed after ${MAX_RETRIES} attempts. Please try again later.`);

    }
    if (error.status === 403) {
      logger.error('GitHub API rate limit exceeded', {
        hasToken: !!options?.githubToken
      });
      const rateLimitError = options?.githubToken
        ? 'The GitHub API rate limit has been exceeded. Please try again later.'
        : 'The GitHub API rate limit has been exceeded. Please add a personal access token in the settings.';

      throw new Error(rateLimitError);
    }
    logger.error('GitHub API error', { error });
    throw new Error(`GitHub error: ${error.message}`);
  }
}

/**
 * Processes a directory handle to build a file tree
 * @param dirHandle - Directory handle from File System Access API
 * @param name - Name of the directory
 * @param path - Path of the directory
 * @returns Promise<FileNode> representing the directory structure
 */
async function processDirectory(
  dirHandle: FileSystemDirectoryHandle,
  name: string,
  path: string = name,
  options?: VisualizationOptions
): Promise<FileNode> {
  const children: FileNode[] = [];
  
  // Skip excluded directories early
  if (options?.excludePatterns?.includes(name)) {
    return {
      name,
      path,
      type: 'directory',
      children: []
    };
  }
  
  try {
    // Process in batches to avoid UI freezing
    const entries = [];
    for await (const entry of dirHandle.values()) {
      entries.push(entry);
    }
    
    const batchSize = 20;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      
      // Process each batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (entry) => {
          const entryPath = `${path}/${entry.name}`;
          
          // Skip excluded directories early
          if (entry.kind === 'directory' && options?.excludePatterns?.includes(entry.name)) {
            return null;
          }
          
          if (entry.kind === 'file') {
            try {
              const fileHandle = await dirHandle.getFileHandle(entry.name);
              const file = await fileHandle.getFile();
              
              const node: FileNode = {
                name: entry.name,
                path: entryPath,
                type: 'file',
                size: file.size,
                extension: entry.name.includes('.') ? entry.name.split('.').pop() : undefined
              };
              
              return node;
            } catch (error) {
              logger.warn(`Could not process file ${entry.name}`, { error });
              return null;
            }
          } else if (entry.kind === 'directory') {
            try {
              const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
              const subDir = await processDirectory(subDirHandle, entry.name, entryPath, options);
              return subDir;
            } catch (error) {
              logger.warn(`Could not process directory ${entry.name}`, { error });
              return null;
            }
          }
          
          return null;
        })
      );
      
      // Filter out null values and add to children
      children.push(...batchResults.filter(Boolean));
      
      // Allow UI to update between batches
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return {
      name,
      path,
      type: 'directory',
      children
    };
  } catch (error) {
    logger.error('Failed to process directory', { error });
    throw error;
  }
}

/**
 * Parses a local directory path using the File System Access API
 * @param path - Local directory path (ignored as we'll use the directory picker)
 * @returns Promise<FileNode> representing the directory structure
 * @throws Error if unable to access the directory or if API is not supported
 */
export async function parseLocalPath(path: string, options?: VisualizationOptions): Promise<FileNode> {
  if (!('showDirectoryPicker' in window)) {
    logger.error('File System Access API not supported');
    throw new Error(
  'Your browser does not support the File System Access API. ' +
  'Please use a modern browser such as Chrome, Edge, or Opera.'
    );
  }
  
  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read'
    });
    
    return processDirectory(dirHandle, dirHandle.name, dirHandle.name, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.info('Directory selection cancelled by user');
      throw new Error('Folder selection was canceled.');
    }
    if (error.name === 'SecurityError' || error.message?.includes('permission')) {
      logger.error('Permission denied for directory access', { error });
      throw new Error('Access denied. Please allow folder access when prompted by the browser.');
    }
    logger.error('Failed to read local directory', { error });
    throw new Error('Error reading the local folder. Please check the permissions and try again.');
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

    logger.info('Output saved successfully', { type, filename });
  } catch (error) {
    logger.error('Failed to save output', { error, type });
    throw new Error('Failed to save output. Please try again.');
  }
}