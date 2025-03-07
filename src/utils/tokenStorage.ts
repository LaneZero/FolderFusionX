/**
 * Secure token storage utility
 * 
 * This utility provides methods for securely storing and retrieving
 * sensitive tokens like GitHub personal access tokens.
 * 
 * It uses sessionStorage instead of localStorage for better security,
 * as sessionStorage is cleared when the browser session ends.
 */

// Key used for storing the GitHub token
const GITHUB_TOKEN_KEY = 'ffx-github-token';

/**
 * Simple encryption function (for demonstration purposes)
 * In a production app, use a proper encryption library
 */
function encryptToken(token: string): string {
  // Simple base64 encoding with a prefix to make it slightly harder to recognize
  return `FFX_${btoa(token)}_${Date.now()}`;
}

/**
 * Simple decryption function (for demonstration purposes)
 */
function decryptToken(encryptedToken: string): string {
  try {
    // Extract the base64 encoded part
    const base64Part = encryptedToken.split('_')[1];
    return base64Part ? atob(base64Part) : '';
  } catch (error) {
    console.error('Failed to decrypt token', error);
    return '';
  }
}

/**
 * Stores a GitHub token securely
 * @param token - The GitHub personal access token to store
 */
export function storeGitHubToken(token: string): void {
  if (!token) {
    sessionStorage.removeItem(GITHUB_TOKEN_KEY);
    return;
  }
  
  try {
    const encryptedToken = encryptToken(token);
    sessionStorage.setItem(GITHUB_TOKEN_KEY, encryptedToken);
  } catch (error) {
    console.error('Failed to store GitHub token', error);
    throw new Error('Failed to securely store the token');
  }
}

/**
 * Retrieves the stored GitHub token
 * @returns The stored GitHub token or empty string if not found
 */
export function getGitHubToken(): string {
  try {
    const encryptedToken = sessionStorage.getItem(GITHUB_TOKEN_KEY);
    if (!encryptedToken) return '';
    
    return decryptToken(encryptedToken);
  } catch (error) {
    console.error('Failed to retrieve GitHub token', error);
    return '';
  }
}

/**
 * Clears the stored GitHub token
 */
export function clearGitHubToken(): void {
  sessionStorage.removeItem(GITHUB_TOKEN_KEY);
}

/**
 * Checks if a GitHub token is stored
 * @returns Boolean indicating if a token is stored
 */
export function hasGitHubToken(): boolean {
  return !!sessionStorage.getItem(GITHUB_TOKEN_KEY);
}