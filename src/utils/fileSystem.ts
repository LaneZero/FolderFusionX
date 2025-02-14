import { Octokit } from 'octokit';
import { FileNode } from '../types/FileSystem';

export async function parseGitHubUrl(url: string): Promise<{ owner: string; repo: string; path: string }> {
  const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/[^\/]+)?(?:\/(.*))?/;
  const match = url.match(githubRegex);
  
  if (!match) {
    throw new Error('Invalid GitHub URL');
  }
  
  return {
    owner: match[1],
    repo: match[2],
    path: match[3] || ''
  };
}

export async function fetchGitHubContents(url: string): Promise<FileNode> {
  const octokit = new Octokit();
  const { owner, repo, path } = await parseGitHubUrl(url);
  
  async function fetchDirectory(path: string): Promise<FileNode> {
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
        };
        
        if (item.type === 'file') {
          node.extension = item.name.split('.').pop();
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
  }
  
  return fetchDirectory(path);
}

export function parseWindowsPath(path: string): FileNode {
  // This is a mock implementation since we can't access the file system directly
  // In a real implementation, this would use Node.js fs module or similar
  const mockData: FileNode = {
    name: path.split('\\').pop() || path,
    path: path,
    type: 'directory',
    children: [
      {
        name: 'example.txt',
        path: `${path}\\example.txt`,
        type: 'file',
        extension: 'txt'
      }
    ]
  };
  
  return mockData;
}