/**
 * Context Builder
 * Builds minimal context from guides and current document
 */

import type { DocumentType } from './types';

interface BuildContextOptions {
  docType: DocumentType;
  currentContent: string;
  projectName?: string;
}

/**
 * Build context string for Gemini CLI
 */
export function buildContext(options: BuildContextOptions): string {
  const parts: string[] = [];
  parts.push(`You're helping refine a ${options.docType === 'vision' ? 'vision document' : options.docType === 'userProfile' ? 'user profile' : 'success metrics'} using DH guide structure.`);
  
  if (options.projectName) {
    parts.push(`\nProject: ${options.projectName}`);
  }
  
  const contentPreview = options.currentContent.length > 500 
    ? options.currentContent.substring(0, 500) + '...'
    : options.currentContent;
  parts.push(`\nCurrent content:\n${contentPreview}`);
  parts.push(`\nTask: Ask clarifying multiple-choice questions to improve specificity. Use DH structure. Be token-efficient.`);
  
  return parts.join('\n');
}

