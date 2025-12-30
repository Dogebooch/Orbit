import fs from 'fs';
import path from 'path';
import type { TaskMasterTask, OrbitTask, ServerMessage } from './types.js';

export class TaskMasterSync {
  private onTasksUpdated: (message: ServerMessage) => void;
  private projectPath: string | null = null;
  private lastTasksJson: string = '';

  constructor(onTasksUpdated: (message: ServerMessage) => void) {
    this.onTasksUpdated = onTasksUpdated;
  }

  setProjectPath(projectPath: string): void {
    this.projectPath = projectPath;
    console.log(`[TaskMaster] Project path set to: ${projectPath}`);
  }

  /**
   * Check if tasks.json exists and read it
   */
  checkAndSync(): void {
    if (!this.projectPath) {
      return;
    }

    const tasksJsonPath = path.join(this.projectPath, '.taskmaster', 'tasks', 'tasks.json');

    if (!fs.existsSync(tasksJsonPath)) {
      // Also check for tasks/ at root level
      const altPath = path.join(this.projectPath, 'tasks', 'tasks.json');
      if (fs.existsSync(altPath)) {
        this.readAndBroadcast(altPath);
      }
      return;
    }

    this.readAndBroadcast(tasksJsonPath);
  }

  /**
   * Handle file change event for tasks.json
   */
  handleFileChange(relativePath: string): boolean {
    // Check if this is a tasks.json file
    if (
      relativePath.includes('tasks.json') &&
      (relativePath.includes('.taskmaster') || relativePath.startsWith('tasks'))
    ) {
      console.log(`[TaskMaster] Detected tasks.json change: ${relativePath}`);
      this.checkAndSync();
      return true;
    }
    return false;
  }

  private readAndBroadcast(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Skip if content hasn't changed
      if (content === this.lastTasksJson) {
        return;
      }
      
      this.lastTasksJson = content;
      const data = JSON.parse(content);
      
      // TaskMaster stores tasks in a "tasks" array
      const tasks: TaskMasterTask[] = Array.isArray(data) ? data : data.tasks || [];
      
      console.log(`[TaskMaster] Broadcasting ${tasks.length} tasks`);
      this.onTasksUpdated({
        type: 'tasks:updated',
        tasks,
      });
    } catch (error) {
      console.error('[TaskMaster] Failed to read/parse tasks.json:', error);
      this.onTasksUpdated({
        type: 'error',
        message: `Failed to parse tasks.json: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Convert TaskMaster task to Orbit task format
   */
  static toOrbitTask(task: TaskMasterTask, index: number): OrbitTask {
    // Map status
    let status: OrbitTask['status'] = 'pending';
    if (task.status === 'in-progress') {
      status = 'in_progress';
    } else if (task.status === 'done') {
      status = 'completed';
    }

    // Map priority (high=1, medium=3, low=5)
    let priority = 3;
    if (task.priority === 'high') {
      priority = 1;
    } else if (task.priority === 'low') {
      priority = 5;
    }

    return {
      id: `taskmaster-${task.id}`,
      title: task.title,
      description: task.description || '',
      status,
      priority,
      order_index: index,
      acceptance_criteria: task.testStrategy || '',
      notes: `TaskMaster ID: ${task.id}${task.details ? '\n\n' + task.details : ''}`,
    };
  }

  /**
   * Convert multiple TaskMaster tasks to Orbit format
   */
  static toOrbitTasks(tasks: TaskMasterTask[]): OrbitTask[] {
    return tasks.map((task, index) => TaskMasterSync.toOrbitTask(task, index));
  }
}

