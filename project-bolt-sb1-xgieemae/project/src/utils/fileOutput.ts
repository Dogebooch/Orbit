/**
 * File output utilities for download and WebSocket-based file writing
 */

import type { GeneratedFile } from '../config/fileTemplates';

export interface FileWriteResult {
  success: boolean;
  filename: string;
  error?: string;
}

export interface FileWriteOptions {
  workingDirectory: string;
  createDirectories?: boolean;
}

/**
 * Download a file to the user's browser downloads
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download multiple files with a delay between each
 */
export function downloadFiles(files: GeneratedFile[], delayMs = 100): void {
  files.forEach((file, index) => {
    setTimeout(() => {
      downloadFile(file.content, file.filename);
    }, index * delayMs);
  });
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Write a file via WebSocket to the terminal backend
 * The backend server needs to handle 'file:write' message type
 */
export function writeFileViaWebSocket(
  wsClient: { send: (data: unknown) => void; isConnected: () => boolean },
  filepath: string,
  content: string,
  options?: { createDirectories?: boolean }
): Promise<FileWriteResult> {
  return new Promise((resolve) => {
    if (!wsClient.isConnected()) {
      resolve({
        success: false,
        filename: filepath,
        error: 'WebSocket not connected',
      });
      return;
    }

    // Send file write request to backend
    wsClient.send({
      type: 'file:write',
      path: filepath,
      content,
      createDirectories: options?.createDirectories ?? true,
    });

    // Since WebSocket is async, we'll resolve immediately
    // The actual result would come back via the message handler
    // For now, we assume success if connected
    resolve({
      success: true,
      filename: filepath,
    });
  });
}

/**
 * Write multiple files via WebSocket
 */
export async function writeFilesViaWebSocket(
  wsClient: { send: (data: unknown) => void; isConnected: () => boolean },
  files: GeneratedFile[],
  workingDirectory: string
): Promise<FileWriteResult[]> {
  const results: FileWriteResult[] = [];

  for (const file of files) {
    // Handle nested paths like .github/copilot-instructions.md
    const fullPath = `${workingDirectory}/${file.filename}`;
    const result = await writeFileViaWebSocket(wsClient, fullPath, file.content);
    results.push(result);
  }

  return results;
}

/**
 * Determine the best output method based on available options
 */
export type OutputMethod = 'download' | 'websocket' | 'clipboard';

export function getBestOutputMethod(
  isBackendConnected: boolean,
  workingDirectory?: string
): OutputMethod {
  if (isBackendConnected && workingDirectory) {
    return 'websocket';
  }
  return 'download';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }
  return '';
}

/**
 * Get appropriate mime type for a file
 */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    md: 'text/markdown',
    json: 'application/json',
    js: 'text/javascript',
    ts: 'text/typescript',
    tsx: 'text/typescript-jsx',
    jsx: 'text/javascript-jsx',
    css: 'text/css',
    html: 'text/html',
    yml: 'text/yaml',
    yaml: 'text/yaml',
    txt: 'text/plain',
  };
  return mimeTypes[ext] || 'text/plain';
}

/**
 * Validate a filename for safety
 */
export function isValidFilename(filename: string): boolean {
  // Check for directory traversal attempts
  if (filename.includes('..')) return false;
  
  // Check for absolute paths (starts with / or drive letter on Windows)
  if (filename.startsWith('/') || /^[a-zA-Z]:/.test(filename)) return false;
  
  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(filename)) return false;
  
  return true;
}

/**
 * Sanitize a filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '')
    .replace(/^\/+/, '')
    .replace(/[<>:"|?*\x00-\x1f]/g, '_');
}

