import React, { useState } from 'react';
import { useTerminal } from '../../contexts/TerminalContext';
import { Card, Button, Input } from '../ui';
import { Plus, Check, Circle, AlertCircle, Flag, X } from 'lucide-react';

export function TaskList() {
  const { taskMasterTasks, setCommandInput, sendInput, isBackendConnected } = useTerminal();
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const handleAddTask = () => {
    if (!newTaskDescription.trim()) return;

    const command = `Let's add a new task. ${newTaskDescription.trim()}`;
    
    if (isBackendConnected) {
      // Send directly to terminal when backend is connected
      sendInput(command + '\r');
    } else {
      // Set command in input field for simulated terminal
      // User will need to press Enter to execute
      setCommandInput(command);
    }

    // Reset form
    setNewTaskDescription('');
    setShowNewTask(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAddTask();
    } else if (e.key === 'Escape') {
      setShowNewTask(false);
      setNewTaskDescription('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'text-green-400 bg-green-900/20 border-green-700/50';
      case 'in-progress':
        return 'text-blue-400 bg-blue-900/20 border-blue-700/50';
      case 'blocked':
        return 'text-red-400 bg-red-900/20 border-red-700/50';
      default:
        return 'text-primary-400 bg-primary-800/30 border-primary-700/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <Check className="w-4 h-4" />;
      case 'in-progress':
        return <Circle className="w-4 h-4 fill-current" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-300 bg-red-900/30 border-red-700/50';
      case 'medium':
        return 'text-orange-300 bg-orange-900/30 border-orange-700/50';
      default:
        return 'text-primary-300 bg-primary-800/30 border-primary-700/50';
    }
  };

  // Group tasks by status
  const pendingTasks = taskMasterTasks.filter(t => t.status === 'pending');
  const inProgressTasks = taskMasterTasks.filter(t => t.status === 'in-progress');
  const doneTasks = taskMasterTasks.filter(t => t.status === 'done');
  const blockedTasks = taskMasterTasks.filter(t => t.status === 'blocked');

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-primary-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-100">Task List</h2>
            <p className="text-xs text-primary-400 mt-1">
              {taskMasterTasks.length} {taskMasterTasks.length === 1 ? 'task' : 'tasks'} from TaskMaster
            </p>
          </div>
          {!showNewTask && (
            <Button
              onClick={() => setShowNewTask(true)}
              variant="primary"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>

        {showNewTask && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the task clearly. Include what needs to be built, acceptance criteria, and any constraints..."
                className="w-full p-3 bg-primary-900 border border-primary-700 rounded text-sm text-primary-100 placeholder-primary-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400"
                rows={4}
                autoFocus
              />
              <button
                onClick={() => {
                  setShowNewTask(false);
                  setNewTaskDescription('');
                }}
                className="absolute top-2 right-2 p-1 text-primary-500 hover:text-primary-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddTask} variant="primary" className="flex-1" size="sm">
                Submit
              </Button>
              <Button
                onClick={() => {
                  setShowNewTask(false);
                  setNewTaskDescription('');
                }}
                variant="ghost"
                className="flex-1"
                size="sm"
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-primary-500">
              Press Cmd/Ctrl+Enter to submit, Esc to cancel
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {taskMasterTasks.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <p className="text-primary-400 text-sm mb-2">No tasks yet</p>
            <p className="text-xs text-primary-500">
              Click "Add Task" to create your first task
            </p>
          </div>
        ) : (
          <>
            {/* In Progress */}
            {inProgressTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">
                  In Progress ({inProgressTasks.length})
                </h3>
                <div className="space-y-2">
                  {inProgressTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-primary-800/40 border border-primary-700/50 rounded-lg hover:bg-primary-800/60 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 mt-0.5 ${getStatusColor(task.status)} p-1 rounded`}>
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-primary-100 mb-1">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-primary-400 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {task.priority && task.priority !== 'low' && (
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(
                                  task.priority
                                )}`}
                              >
                                <Flag className="w-3 h-3 inline mr-1" />
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending */}
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-primary-400 mb-2 uppercase tracking-wide">
                  Pending ({pendingTasks.length})
                </h3>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-primary-800/40 border border-primary-700/50 rounded-lg hover:bg-primary-800/60 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 mt-0.5 ${getStatusColor(task.status)} p-1 rounded`}>
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-primary-100 mb-1">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-primary-400 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {task.priority && task.priority !== 'low' && (
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(
                                  task.priority
                                )}`}
                              >
                                <Flag className="w-3 h-3 inline mr-1" />
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blocked */}
            {blockedTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">
                  Blocked ({blockedTasks.length})
                </h3>
                <div className="space-y-2">
                  {blockedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-primary-800/40 border border-primary-700/50 rounded-lg hover:bg-primary-800/60 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 mt-0.5 ${getStatusColor(task.status)} p-1 rounded`}>
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-primary-100 mb-1">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-primary-400 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Done */}
            {doneTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">
                  Done ({doneTasks.length})
                </h3>
                <div className="space-y-2">
                  {doneTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-green-900/10 border border-green-700/30 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 mt-0.5 ${getStatusColor(task.status)} p-1 rounded`}>
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-green-300 line-through mb-1">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-primary-500 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

