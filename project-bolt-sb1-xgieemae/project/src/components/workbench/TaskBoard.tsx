import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTerminal } from '../../contexts/TerminalContext';
import { supabase } from '../../lib/supabase';
import { Button, Card, Input } from '../ui';
import { Toast } from '../ui/Toast';
import {
  Plus,
  Check,
  Circle,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
  Flag,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: number;
  acceptance_criteria: string;
  notes: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export function TaskBoard() {
  const { currentProject } = useApp();
  const { taskMasterTasks } = useTerminal();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [completedTaskTitle, setCompletedTaskTitle] = useState<string>('');

  useEffect(() => {
    if (currentProject) {
      loadTasks();
    }
  }, [currentProject]);

  const loadTasks = async () => {
    if (!currentProject) return;

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('order_index', { ascending: true });

    if (data) {
      setTasks(data);
    }
  };

  const createTask = async () => {
    if (!currentProject || !newTaskTitle.trim()) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: currentProject.id,
        title: newTaskTitle.trim(),
        description: '',
        status: 'pending',
        priority: 0,
        order_index: tasks.length,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks([...tasks, data]);
      setNewTaskTitle('');
      setShowNewTask(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    // Show toast notification when task is completed
    if (newStatus === 'completed') {
      const completedTask = tasks.find((t) => t.id === taskId);
      if (completedTask) {
        setCompletedTaskTitle(completedTask.title);
        setShowToast(true);
      }
    }
  };

  const setActiveTask = async (taskId: string) => {
    await updateTaskStatus(taskId, 'in_progress');
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  const updateTaskField = async (taskId: string, field: string, value: string) => {
    await supabase
      .from('tasks')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  const currentTask = tasks.find((t) => t.status === 'in_progress');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return 'bg-red-900/30 border-red-700/50 text-red-300';
    if (priority === 2) return 'bg-orange-900/30 border-orange-700/50 text-orange-300';
    if (priority === 1) return 'bg-blue-900/30 border-blue-700/50 text-blue-300';
    return 'bg-primary-800/30 border-primary-700/50 text-primary-300';
  };

  const getPriorityLabel = (priority: number) => {
    const labels = ['Low', 'Medium', 'High', 'Critical'];
    return labels[priority] || 'Low';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 border border-primary-600/50">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-primary-100 mb-1">Active Mission</h2>
                <p className="text-primary-400 text-sm">Your current focus</p>
              </div>
              {currentTask && (
                <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full">
                  <span className="text-xs font-semibold text-blue-300">IN PROGRESS</span>
                </div>
              )}
            </div>

            {currentTask ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary-100 mb-2">
                    {currentTask.title}
                  </h3>
                  {currentTask.description && (
                    <p className="text-primary-300 text-sm leading-relaxed">
                      {currentTask.description}
                    </p>
                  )}
                </div>

                {currentTask.acceptance_criteria && (
                  <div className="pt-4 border-t border-primary-600/50">
                    <h4 className="text-sm font-semibold text-primary-200 mb-2">
                      Acceptance Criteria
                    </h4>
                    <p className="text-sm text-primary-300 whitespace-pre-line">
                      {currentTask.acceptance_criteria}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => updateTaskStatus(currentTask.id, 'completed')}
                    variant="primary"
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                  <Button
                    onClick={() => updateTaskStatus(currentTask.id, 'pending')}
                    variant="secondary"
                    className="flex-1"
                  >
                    Pause Task
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                <p className="text-primary-400 mb-4">No active task. Select one from the queue below.</p>
                {pendingTasks.length > 0 && (
                  <Button onClick={() => setActiveTask(pendingTasks[0].id)} variant="primary">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Start Next Task
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <h2 className="text-lg font-semibold text-primary-100 mb-6">Progress</h2>

            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-primary-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progressPercentage / 100)}`}
                    className="text-blue-400 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-100">
                      {Math.round(progressPercentage)}%
                    </div>
                    <div className="text-xs text-primary-400">complete</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-primary-300">
                <span>Total Tasks</span>
                <span className="font-semibold">{totalTasks}</span>
              </div>
              <div className="flex justify-between text-green-300">
                <span>Completed</span>
                <span className="font-semibold">{completedCount}</span>
              </div>
              {currentTask && (
                <div className="flex justify-between text-blue-300">
                  <span>In Progress</span>
                  <span className="font-semibold">1</span>
                </div>
              )}
              <div className="flex justify-between text-primary-300">
                <span>Pending</span>
                <span className="font-semibold">{pendingTasks.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-primary-100">Task Queue</h2>
            <p className="text-sm text-primary-400 mt-1">
              {pendingTasks.length} pending tasks
              {taskMasterTasks.length > 0 && (
                <span className="ml-2 text-primary-300">
                  • {taskMasterTasks.length} from TaskMaster
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => setShowNewTask(true)} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {showNewTask && (
          <div className="mb-4 p-4 bg-primary-800 rounded-lg border border-primary-700">
            <Input
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createTask()}
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <Button onClick={createTask} className="flex-1">
                Add Task
              </Button>
              <Button variant="ghost" onClick={() => setShowNewTask(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <p className="text-primary-400">No tasks yet. Create one or use Taskmaster AI.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="bg-primary-800/40 border border-primary-700/50 rounded-lg hover:bg-primary-800/60 transition-colors overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setActiveTask(task.id)}
                      className="flex-shrink-0 mt-1 text-primary-500 hover:text-blue-400 transition-colors"
                    >
                      <Circle className="w-5 h-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-primary-100 mb-1">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs text-primary-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {task.priority > 0 && (
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 flex-shrink-0 ${getPriorityColor(
                          task.priority
                        )} border`}
                      >
                        <Flag className="w-3 h-3" />
                        {getPriorityLabel(task.priority)}
                      </div>
                    )}

                    <button
                      onClick={() =>
                        setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                      }
                      className="text-primary-500 hover:text-primary-300 transition-colors flex-shrink-0"
                    >
                      {expandedTaskId === task.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {expandedTaskId === task.id && (
                    <div className="mt-4 pt-4 border-t border-primary-700/50 space-y-3">
                      {editingTaskId === task.id ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Description..."
                            value={task.description}
                            onChange={(e) =>
                              updateTaskField(task.id, 'description', e.target.value)
                            }
                          />
                          <textarea
                            placeholder="Acceptance criteria..."
                            value={task.acceptance_criteria}
                            onChange={(e) =>
                              updateTaskField(task.id, 'acceptance_criteria', e.target.value)
                            }
                            className="w-full p-2 bg-primary-900 border border-primary-700 rounded text-sm text-primary-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400"
                            rows={3}
                          />
                          <Button
                            onClick={() => setEditingTaskId(null)}
                            size="sm"
                            className="w-full"
                          >
                            Done Editing
                          </Button>
                        </div>
                      ) : (
                        <>
                          {task.acceptance_criteria && (
                            <div>
                              <p className="text-xs font-medium text-primary-300 mb-1">
                                Acceptance Criteria
                              </p>
                              <p className="text-xs text-primary-400 whitespace-pre-line">
                                {task.acceptance_criteria}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={() => setEditingTaskId(task.id)}
                              variant="ghost"
                              size="sm"
                              className="flex-1"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => deleteTask(task.id)}
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {completedTasks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-primary-700/50">
                <h3 className="text-sm font-semibold text-primary-300 mb-3">
                  Completed ({completedCount})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg flex items-center gap-3"
                    >
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-green-300 line-through">
                          {task.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => updateTaskStatus(task.id, 'pending')}
                        className="text-xs px-2 py-1 rounded bg-primary-700/50 text-primary-300 hover:bg-primary-600 transition-colors"
                      >
                        Undo
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {showToast && (
        <Toast
          taskTitle={completedTaskTitle}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
