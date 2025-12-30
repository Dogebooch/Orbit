/**
 * Complexity Scoring for Tasks
 * 
 * Based on TaskMaster AI's complexity analysis methodology,
 * calculates a complexity score to help prioritize and break down tasks.
 */

import type { Task } from './taskUtils';

export interface ComplexityFactors {
  descriptionLength: number;      // 0-2 points: length and detail of description
  acceptanceCriteriaCount: number; // 0-2 points: number of acceptance criteria
  hasIntegration: boolean;        // 0-1 point: involves integration with external systems
  hasDependencies: boolean;       // 0-1 point: depends on other tasks
  subtaskCount: number;           // 0-2 points: number of subtasks
}

export type ComplexityLevel = 'low' | 'medium' | 'high';

export interface ComplexityResult {
  level: ComplexityLevel;
  score: number;
  maxScore: number;
  factors: ComplexityFactors;
  suggestions: string[];
}

// Keywords that indicate integration complexity
const INTEGRATION_KEYWORDS = [
  'api', 'database', 'supabase', 'auth', 'authentication', 'oauth',
  'webhook', 'websocket', 'third-party', 'external', 'integration',
  'payment', 'stripe', 'email', 'smtp', 'notification', 'push',
  'realtime', 'sync', 'upload', 'download', 's3', 'storage',
];

// Keywords that suggest high complexity
const HIGH_COMPLEXITY_KEYWORDS = [
  'migrate', 'refactor', 'architecture', 'security', 'performance',
  'optimization', 'caching', 'encryption', 'compliance', 'gdpr',
  'scale', 'distributed', 'concurrent', 'parallel', 'async',
];

/**
 * Calculate complexity score for a task
 */
export function calculateComplexity(task: Task, allTasks?: Task[]): ComplexityResult {
  const factors: ComplexityFactors = {
    descriptionLength: 0,
    acceptanceCriteriaCount: 0,
    hasIntegration: false,
    hasDependencies: false,
    subtaskCount: 0,
  };

  const suggestions: string[] = [];
  const text = `${task.title} ${task.description} ${task.acceptance_criteria || ''}`.toLowerCase();

  // 1. Description Length Score (0-2)
  const descLength = (task.description || '').length;
  if (descLength > 500) {
    factors.descriptionLength = 2;
    suggestions.push('Long description suggests complex requirements - consider breaking into subtasks');
  } else if (descLength > 200) {
    factors.descriptionLength = 1;
  }

  // 2. Acceptance Criteria Count (0-2)
  const criteriaLines = (task.acceptance_criteria || '')
    .split('\n')
    .filter(line => line.trim().length > 0 && (
      line.includes('-') || line.includes('•') || line.includes('*') || /^\d+\./.test(line.trim())
    ));
  
  factors.acceptanceCriteriaCount = Math.min(2, Math.floor(criteriaLines.length / 3));
  
  if (criteriaLines.length > 6) {
    suggestions.push(`${criteriaLines.length} acceptance criteria - consider splitting into smaller tasks`);
  }

  // 3. Integration Check (0-1)
  factors.hasIntegration = INTEGRATION_KEYWORDS.some(keyword => text.includes(keyword));
  if (factors.hasIntegration) {
    suggestions.push('Involves external integration - ensure API documentation is available');
  }

  // 4. Dependencies Check (0-1)
  factors.hasDependencies = (task.dependencies?.length ?? 0) > 0;
  if (factors.hasDependencies) {
    suggestions.push(`Blocked by ${task.dependencies?.length} task(s) - resolve dependencies first`);
  }

  // 5. Subtask Count (0-2)
  if (allTasks) {
    const subtaskCount = allTasks.filter(t => t.parent_task_id === task.id).length;
    factors.subtaskCount = Math.min(2, Math.floor(subtaskCount / 2));
    
    if (subtaskCount > 5) {
      suggestions.push('Many subtasks - consider grouping related work');
    }
  }

  // Check for high-complexity keywords
  const hasHighComplexityKeywords = HIGH_COMPLEXITY_KEYWORDS.some(keyword => text.includes(keyword));
  if (hasHighComplexityKeywords) {
    suggestions.push('Task involves complex operations - plan carefully and test thoroughly');
  }

  // Calculate total score
  const score = 
    factors.descriptionLength +
    factors.acceptanceCriteriaCount +
    (factors.hasIntegration ? 1 : 0) +
    (factors.hasDependencies ? 1 : 0) +
    factors.subtaskCount +
    (hasHighComplexityKeywords ? 1 : 0);

  const maxScore = 9; // 2 + 2 + 1 + 1 + 2 + 1

  // Determine complexity level
  let level: ComplexityLevel;
  if (score <= 2) {
    level = 'low';
  } else if (score <= 5) {
    level = 'medium';
  } else {
    level = 'high';
  }

  // Add general suggestion for high complexity
  if (level === 'high' && suggestions.length === 0) {
    suggestions.push('Consider breaking this task into smaller, manageable subtasks');
  }

  return {
    level,
    score,
    maxScore,
    factors,
    suggestions,
  };
}

/**
 * Check if a task should be suggested for breakdown
 */
export function suggestBreakdown(task: Task, allTasks?: Task[]): boolean {
  const result = calculateComplexity(task, allTasks);
  return result.level === 'high';
}

/**
 * Get color class for complexity level
 */
export function getComplexityColor(level: ComplexityLevel): string {
  switch (level) {
    case 'low':
      return 'text-green-400 bg-green-900/30 border-green-700/50';
    case 'medium':
      return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
    case 'high':
      return 'text-red-400 bg-red-900/30 border-red-700/50';
  }
}

/**
 * Get icon name for complexity level
 */
export function getComplexityIcon(level: ComplexityLevel): 'circle' | 'triangle' | 'hexagon' {
  switch (level) {
    case 'low':
      return 'circle';
    case 'medium':
      return 'triangle';
    case 'high':
      return 'hexagon';
  }
}

/**
 * Format complexity for display
 */
export function formatComplexity(level: ComplexityLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

