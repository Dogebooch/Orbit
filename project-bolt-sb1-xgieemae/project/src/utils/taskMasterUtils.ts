/**
 * TaskMaster utility functions for grouping prompts and generating tooltips
 */

export type TaskType = 
  | 'initialization'
  | 'task-management'
  | 'task-breakdown'
  | 'task-modification'
  | 'implementation'
  | 'context'
  | 'other';

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  is_favorite: boolean;
  source?: string | null;
  is_default?: boolean;
}

const TASK_TYPE_KEYWORDS: Record<TaskType, string[]> = {
  'initialization': ['parse prd', 'initialize', 'setup', 'create tasks', 'initial'],
  'task-management': ['show', 'get next', 'view', 'list', 'display', 'tasks'],
  'task-breakdown': ['break down', 'analyze complexity', 'break', 'complexity', 'subtask'],
  'task-modification': ['add', 'update', 'remove', 'change', 'deprecate', 'delete', 'modify'],
  'implementation': ['implement', 'build', 'create', 'code', 'develop'],
  'context': ['add context', 'context', 'additional', 'extra context'],
  'other': [],
};

/**
 * Infers task type from prompt title and content
 */
export function inferTaskType(prompt: Prompt): TaskType {
  const searchText = `${prompt.title} ${prompt.content}`.toLowerCase();
  
  // Check each task type in order of specificity
  for (const [type, keywords] of Object.entries(TASK_TYPE_KEYWORDS)) {
    if (type === 'other') continue;
    
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        return type as TaskType;
      }
    }
  }
  
  return 'other';
}

/**
 * Generates tooltip text by analyzing prompt content
 */
export function generateTooltipText(prompt: Prompt): string {
  const content = prompt.content.toLowerCase();
  const title = prompt.title.toLowerCase();
  
  // Extract usage criteria from content
  let usageCriteria = '';
  
  // Check for common patterns in prompt content
  if (content.includes('prd') && (content.includes('parse') || content.includes('initialize'))) {
    usageCriteria = 'Use when: You have a PRD file ready and need to initialize your task list from it.';
  } else if (title.includes('show') || title.includes('view') || title.includes('list')) {
    usageCriteria = 'Use when: You want to see the current status of all tasks in your project.';
  } else if (title.includes('next task') || content.includes('next task')) {
    usageCriteria = 'Use when: You need to know which task to work on next, considering dependencies and priorities.';
  } else if (content.includes('analyze complexity') || content.includes('complexity')) {
    usageCriteria = 'Use when: You want to identify which tasks are too complex and need to be broken down further.';
  } else if (content.includes('break down') || content.includes('breakdown')) {
    usageCriteria = 'Use when: You have complex tasks that need to be split into smaller, manageable subtasks.';
  } else if (title.includes('add') && content.includes('task')) {
    usageCriteria = 'Use when: You need to add a new task to your project backlog with specific requirements.';
  } else if (title.includes('update') || title.includes('change')) {
    usageCriteria = 'Use when: You need to modify an existing task\'s requirements or direction.';
  } else if (title.includes('remove') || title.includes('delete') || title.includes('deprecate')) {
    usageCriteria = 'Use when: A task is no longer needed and should be removed from the project.';
  } else if (title.includes('implement') || content.includes('implement')) {
    usageCriteria = 'Use when: You\'re ready to start coding a specific task or subtask.';
  } else if (content.includes('context') || content.includes('additional context')) {
    usageCriteria = 'Use when: You need to provide extra information (UI preferences, API docs, images) to guide task implementation.';
  } else {
    // Fallback: extract first sentence or use title
    const firstSentence = prompt.content.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 0 && firstSentence.length < 150) {
      usageCriteria = `Use when: ${firstSentence}`;
    } else {
      usageCriteria = `Use when: You need to ${prompt.title.toLowerCase()}`;
    }
  }
  
  return usageCriteria;
}

/**
 * Groups prompts by their inferred task type
 */
export function groupPromptsByType(prompts: Prompt[]): Map<TaskType, Prompt[]> {
  const grouped = new Map<TaskType, Prompt[]>();
  
  // Initialize all task types
  const taskTypes: TaskType[] = [
    'initialization',
    'task-management',
    'task-breakdown',
    'task-modification',
    'implementation',
    'context',
    'other',
  ];
  
  taskTypes.forEach(type => {
    grouped.set(type, []);
  });
  
  // Group prompts
  prompts.forEach(prompt => {
    const type = inferTaskType(prompt);
    const group = grouped.get(type) || [];
    group.push(prompt);
    grouped.set(type, group);
  });
  
  // Remove empty groups
  taskTypes.forEach(type => {
    if (grouped.get(type)?.length === 0) {
      grouped.delete(type);
    }
  });
  
  return grouped;
}

/**
 * Gets display label for task type
 */
export function getTaskTypeLabel(type: TaskType): string {
  const labels: Record<TaskType, string> = {
    'initialization': 'Initialization',
    'task-management': 'Task Management',
    'task-breakdown': 'Task Breakdown',
    'task-modification': 'Task Modification',
    'implementation': 'Implementation',
    'context': 'Context',
    'other': 'Other',
  };
  
  return labels[type];
}

/**
 * Gets color classes for task type buttons
 */
export function getTaskTypeColors(type: TaskType): {
  bg: string;
  border: string;
  hoverBg: string;
  hoverBorder: string;
} {
  const colors: Record<TaskType, { bg: string; border: string; hoverBg: string; hoverBorder: string }> = {
    'initialization': {
      bg: 'bg-blue-900/30',
      border: 'border-blue-700/50',
      hoverBg: 'hover:bg-blue-900/40',
      hoverBorder: 'hover:border-blue-700/70',
    },
    'task-management': {
      bg: 'bg-green-900/30',
      border: 'border-green-700/50',
      hoverBg: 'hover:bg-green-900/40',
      hoverBorder: 'hover:border-green-700/70',
    },
    'task-breakdown': {
      bg: 'bg-amber-900/30',
      border: 'border-amber-700/50',
      hoverBg: 'hover:bg-amber-900/40',
      hoverBorder: 'hover:border-amber-700/70',
    },
    'task-modification': {
      bg: 'bg-orange-900/30',
      border: 'border-orange-700/50',
      hoverBg: 'hover:bg-orange-900/40',
      hoverBorder: 'hover:border-orange-700/70',
    },
    'implementation': {
      bg: 'bg-purple-900/30',
      border: 'border-purple-700/50',
      hoverBg: 'hover:bg-purple-900/40',
      hoverBorder: 'hover:border-purple-700/70',
    },
    'context': {
      bg: 'bg-indigo-900/30',
      border: 'border-indigo-700/50',
      hoverBg: 'hover:bg-indigo-900/40',
      hoverBorder: 'hover:border-indigo-700/70',
    },
    'other': {
      bg: 'bg-primary-800/50',
      border: 'border-primary-700/50',
      hoverBg: 'hover:bg-primary-800/70',
      hoverBorder: 'hover:border-primary-700/70',
    },
  };
  
  return colors[type];
}

