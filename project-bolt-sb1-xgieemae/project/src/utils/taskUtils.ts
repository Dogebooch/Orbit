/**
 * Task Utilities for Dependencies and Subtasks
 * 
 * Supports flat structure with naming convention:
 * - "Task 1", "Task 2" are main tasks
 * - "Task 1.1", "Task 1.2" are subtasks of Task 1
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: number;
  acceptance_criteria: string;
  notes: string;
  order_index: number;
  dependencies?: string[];
  parent_task_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ParsedTaskNumber {
  main: number;
  sub?: number;
  display: string;
}

/**
 * Parse a task title to extract task number information
 * Examples:
 * - "Task 1: Setup" -> { main: 1, display: "1" }
 * - "Task 1.2: Feature" -> { main: 1, sub: 2, display: "1.2" }
 * - "1. Setup" -> { main: 1, display: "1" }
 * - "1.2 Feature" -> { main: 1, sub: 2, display: "1.2" }
 */
export function parseTaskNumber(title: string): ParsedTaskNumber | null {
  // Match patterns like "Task 1.2:", "1.2:", "1.2 ", or just "1."
  const patterns = [
    /^(?:Task\s+)?(\d+)\.(\d+)(?:[:.\s]|$)/i,  // "Task 1.2:" or "1.2:"
    /^(?:Task\s+)?(\d+)(?:[:.\s]|$)/i,          // "Task 1:" or "1."
    /^\[?(\d+)\.(\d+)\]?(?:[:.\s]|$)/,          // "[1.2]" format
    /^\[?(\d+)\]?(?:[:.\s]|$)/,                 // "[1]" format
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      const main = parseInt(match[1], 10);
      const sub = match[2] ? parseInt(match[2], 10) : undefined;
      return {
        main,
        sub,
        display: sub ? `${main}.${sub}` : `${main}`,
      };
    }
  }

  return null;
}

/**
 * Check if a task is a subtask (has a sub-number like 1.1, 1.2)
 */
export function isSubtask(task: Task): boolean {
  const parsed = parseTaskNumber(task.title);
  return parsed?.sub !== undefined;
}

/**
 * Check if a task has subtasks
 */
export function hasSubtasks(task: Task, allTasks: Task[]): boolean {
  const parsed = parseTaskNumber(task.title);
  if (!parsed || parsed.sub !== undefined) return false;

  return allTasks.some((t) => {
    const tParsed = parseTaskNumber(t.title);
    return tParsed?.main === parsed.main && tParsed?.sub !== undefined;
  });
}

/**
 * Get the parent task for a subtask
 */
export function getParentTask(task: Task, allTasks: Task[]): Task | null {
  // First check if parent_task_id is set
  if (task.parent_task_id) {
    return allTasks.find((t) => t.id === task.parent_task_id) || null;
  }

  // Otherwise, try to find by task number
  const parsed = parseTaskNumber(task.title);
  if (!parsed || parsed.sub === undefined) return null;

  return (
    allTasks.find((t) => {
      const tParsed = parseTaskNumber(t.title);
      return tParsed?.main === parsed.main && tParsed?.sub === undefined;
    }) || null
  );
}

/**
 * Get all subtasks for a parent task
 */
export function getSubtasks(task: Task, allTasks: Task[]): Task[] {
  const parsed = parseTaskNumber(task.title);
  if (!parsed || parsed.sub !== undefined) return [];

  return allTasks
    .filter((t) => {
      // Check by parent_task_id first
      if (t.parent_task_id === task.id) return true;

      // Then by task number
      const tParsed = parseTaskNumber(t.title);
      return tParsed?.main === parsed.main && tParsed?.sub !== undefined;
    })
    .sort((a, b) => {
      const aParsed = parseTaskNumber(a.title);
      const bParsed = parseTaskNumber(b.title);
      return (aParsed?.sub || 0) - (bParsed?.sub || 0);
    });
}

/**
 * Get tasks that are blocking this task (dependencies that are not completed)
 */
export function getBlockingTasks(task: Task, allTasks: Task[]): Task[] {
  if (!task.dependencies || task.dependencies.length === 0) return [];

  return allTasks.filter(
    (t) => task.dependencies?.includes(t.id) && t.status !== 'completed'
  );
}

/**
 * Check if a task is blocked by uncompleted dependencies
 */
export function isTaskBlocked(task: Task, allTasks: Task[]): boolean {
  return getBlockingTasks(task, allTasks).length > 0;
}

/**
 * Get tasks that depend on this task
 */
export function getDependentTasks(task: Task, allTasks: Task[]): Task[] {
  return allTasks.filter((t) => t.dependencies?.includes(task.id));
}

/**
 * Group tasks by parent (main tasks with their subtasks)
 */
export function groupTasksByParent(tasks: Task[]): Map<string | null, Task[]> {
  const groups = new Map<string | null, Task[]>();

  // First, collect all main tasks (not subtasks)
  const mainTasks = tasks.filter((t) => !isSubtask(t));
  const subtasks = tasks.filter((t) => isSubtask(t));

  // Add main tasks as keys
  mainTasks.forEach((task) => {
    groups.set(task.id, []);
  });

  // Assign subtasks to their parents
  subtasks.forEach((subtask) => {
    const parent = getParentTask(subtask, tasks);
    if (parent) {
      const existing = groups.get(parent.id) || [];
      existing.push(subtask);
      groups.set(parent.id, existing);
    } else {
      // Orphan subtask - add to null group
      const orphans = groups.get(null) || [];
      orphans.push(subtask);
      groups.set(null, orphans);
    }
  });

  return groups;
}

/**
 * Sort tasks with subtasks appearing after their parents
 */
export function sortTasksWithSubtasks(tasks: Task[]): Task[] {
  const result: Task[] = [];
  const mainTasks = tasks
    .filter((t) => !isSubtask(t))
    .sort((a, b) => a.order_index - b.order_index);

  mainTasks.forEach((mainTask) => {
    result.push(mainTask);
    const subs = getSubtasks(mainTask, tasks);
    result.push(...subs);
  });

  // Add any orphan subtasks at the end
  const orphans = tasks.filter((t) => {
    if (!isSubtask(t)) return false;
    const parent = getParentTask(t, tasks);
    return parent === null;
  });

  result.push(...orphans);

  return result;
}

/**
 * Generate the next subtask number for a parent task
 */
export function getNextSubtaskNumber(parentTask: Task, allTasks: Task[]): string {
  const parsed = parseTaskNumber(parentTask.title);
  if (!parsed) return '1.1';

  const subtasks = getSubtasks(parentTask, allTasks);
  const maxSub = subtasks.reduce((max, t) => {
    const tParsed = parseTaskNumber(t.title);
    return Math.max(max, tParsed?.sub || 0);
  }, 0);

  return `${parsed.main}.${maxSub + 1}`;
}

/**
 * Format a task title with task number prefix
 */
export function formatTaskTitle(taskNumber: string, title: string): string {
  // Remove any existing task number prefix
  const cleanTitle = title
    .replace(/^(?:Task\s+)?\d+(?:\.\d+)?[:.\s]+/i, '')
    .trim();
  return `${taskNumber}. ${cleanTitle}`;
}

