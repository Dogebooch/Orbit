// WebSocket Message Types

// Frontend -> Backend messages
export type ClientMessage =
  | { type: 'terminal:input'; data: string }
  | { type: 'terminal:resize'; cols: number; rows: number }
  | { type: 'config:setWorkingDir'; path: string }
  | { type: 'config:getWorkingDir' }
  | { type: 'config:writeFile'; relativePath: string; content: string }
  | { type: 'config:createDir'; relativePath: string };

// Backend -> Frontend messages
export type ServerMessage =
  | { type: 'terminal:output'; data: string }
  | { type: 'terminal:exit'; code: number }
  | { type: 'terminal:ready' }
  | { type: 'file:changed'; path: string; event: 'add' | 'change' | 'unlink' }
  | { type: 'tasks:updated'; tasks: TaskMasterTask[] }
  | { type: 'config:workingDir'; path: string }
  | { type: 'config:writeResult'; success: boolean; path: string; error?: string }
  | { type: 'connection:status'; connected: boolean }
  | { type: 'error'; message: string };

// TaskMaster task format (from .taskmaster/tasks/tasks.json)
export interface TaskMasterTask {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'done' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  dependencies: number[];
  subtasks?: TaskMasterTask[];
  details?: string;
  testStrategy?: string;
}

// Orbit task format (for frontend sync)
export interface OrbitTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: number;
  order_index: number;
  acceptance_criteria: string;
  notes: string;
}

// Server configuration
export interface ServerConfig {
  workingDirectory: string;
  watchEnabled: boolean;
}

