/**
 * Foundation Context Builder
 * Builds minimal, token-efficient context for Gemini CLI based on DougHub guide
 */

export type DocumentType = 'vision' | 'userProfile' | 'metrics';

interface ProjectData {
  name?: string;
  description?: string;
  vision?: {
    problem?: string;
    target_user?: string;
    success_metrics?: string;
    why_software?: string;
    target_level?: string;
  };
  userProfile?: {
    primary_user?: string;
    goal?: string;
    context?: string;
    frustrations?: string;
    technical_comfort?: string;
    persona_name?: string;
    persona_role?: string;
    competitor_notes?: string;
  };
}

// Cached guide content
let guideCache: Record<string, string> = {};

/**
 * Extract a specific section from markdown guide
 */
function extractGuideSection(markdown: string, sectionId: string): string {
  // Look for section headers that match
  const lines = markdown.split('\n');
  let inSection = false;
  let sectionLines: string[] = [];
  let depth = 0;
  const targetDepth = sectionId.split('-').length;

  for (const line of lines) {
    const headerMatch = line.match(/^(#+)\s+(.+)/);
    if (headerMatch) {
      const headerDepth = headerMatch[1].length;
      const headerText = headerMatch[2].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      if (headerText.includes(sectionId.toLowerCase())) {
        inSection = true;
        depth = headerDepth;
        sectionLines = [line];
        continue;
      }
      
      // Stop if we hit a sibling or parent section
      if (inSection && headerDepth <= depth) {
        break;
      }
    }
    
    if (inSection) {
      sectionLines.push(line);
    }
  }

  return sectionLines.join('\n').trim();
}

/**
 * Get document template from DougHub guide
 */
export function getDocumentTemplate(docType: DocumentType): string {
  const cacheKey = `template-${docType}`;
  if (guideCache[cacheKey]) {
    return guideCache[cacheKey];
  }

  // Simplified templates based on DougHub guide structure
  const templates: Record<DocumentType, string> = {
    vision: `# Vision Template (DH)
## Problem
Specific problem, who has it, what makes it painful.

## Target User
Who exactly will use this? Role, experience, situation.

## Why Software?
Why custom software vs spreadsheet/existing tool?

## MVP Scope
3-5 concrete capabilities.

## Out of Scope
What you're NOT building yet.

## Technical Stack
Chosen technologies.

## Anti-Patterns
What to avoid.`,

    userProfile: `# User Profile Template (DH)
## Identity
- Name: [Give them a name]
- Role: [Specific role]
- One-liner: [Single sentence]

## Context
- When: [Time/frequency/triggers]
- Where: [Environment/device/location]
- State: [Mental/physical state]

## Goals & Motivations
What they're trying to accomplish.

## Frustrations & Pain Points
What slows them down.

## Technical Comfort
- Comfortable with: [What they handle]
- Uncomfortable with: [What causes friction]

## Behavioral Patterns
How they approach tasks.

## Core Conflict
Fundamental tension they face.`,

    metrics: `# Success Metrics Template (DH)
## Target Level
[Proof of concept / MVP / Polished demo / Production ready]

## Core Success Criteria
| Metric | Target | Why It Matters | How to Measure |
|--------|--------|----------------|----------------|
| [Metric] | [Number] | [Reason] | [Method] |

## Performance Requirements
- Response time: [target]
- Throughput: [target]
- Reliability: [target]

## User Experience Thresholds
- Time to complete: [target]
- Clicks/steps: [max]
- Error recovery: [target]`
  };

  const template = templates[docType];
  guideCache[cacheKey] = template;
  return template;
}

/**
 * Get examples from guides (simplified for token efficiency)
 */
export function getDocumentExamples(docType: DocumentType): string {
  const examples: Record<DocumentType, string> = {
    vision: `Example Problem: "Small business owners spend 15+ min per invoice manually entering client details, calculating totals, formatting in Word before emailing as PDFs."
Example Target User: "Solo consultants billing 5-20 clients monthly. Not accounting experts, work from laptops, frustrated with bloated software requiring tutorials."`,

    userProfile: `Example: "Sarah, freelance graphic designer billing 10-15 clients/month. Prefers quick, simple tools. Goal: Get paid faster by sending professional invoices immediately after completing work."`,

    metrics: `Example: "90% of users complete first invoice in <2 min. Users complete workflow without instructions. Works on mobile & desktop. Zero crashes with realistic data."`
  };

  return examples[docType];
}

/**
 * Build minimal context string for Gemini CLI
 */
export function buildMinimalContext(
  currentContent: string,
  docType: DocumentType,
  projectData?: ProjectData
): string {
  const parts: string[] = [];
  
  // Add role and task
  parts.push(`You're helping refine a ${docType === 'vision' ? 'vision document' : docType === 'userProfile' ? 'user profile' : 'success metrics'} using DH guide structure.`);
  
  // Add template (abbreviated)
  const template = getDocumentTemplate(docType);
  parts.push(`\nTemplate:\n${template}`);
  
  // Add examples (abbreviated)
  const examples = getDocumentExamples(docType);
  parts.push(`\nExamples:\n${examples}`);
  
  // Add current content (truncated if too long)
  const contentPreview = currentContent.length > 500 
    ? currentContent.substring(0, 500) + '...'
    : currentContent;
  parts.push(`\nCurrent content:\n${contentPreview}`);
  
  // Add project context if available (minimal)
  if (projectData?.name) {
    parts.push(`\nProject: ${projectData.name}`);
  }
  
  // Instructions
  parts.push(`\nTask: Ask clarifying multiple-choice questions to improve specificity. Use DH structure. Be token-efficient.`);
  
  return parts.join('\n');
}

/**
 * Count approximate tokens (rough estimate: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Clear guide cache (useful for testing)
 */
export function clearGuideCache(): void {
  guideCache = {};
}

