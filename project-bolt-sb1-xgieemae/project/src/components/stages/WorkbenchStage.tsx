import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTerminal } from '../../contexts/TerminalContext';
import { supabase } from '../../lib/supabase';
import { Button, Card, Input } from '../ui';
import {
  Code2,
  Copy,
  Circle,
  Check,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Eye,
  FileText,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { TerminalPanel } from '../workbench/TerminalPanel';
import { TaskMasterCommands } from '../workbench/TaskMasterCommands';
import { TaskQuickActions } from '../workbench/TaskQuickActions';

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

export function WorkbenchStage() {
  const { currentProject, user } = useApp();
  const { setCommandInput } = useTerminal();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [copiedContext, setCopiedContext] = useState(false);
  const [contextPreview, setContextPreview] = useState<string>('');
  const [showContextPreview, setShowContextPreview] = useState(false);
  const [contextOptions, setContextOptions] = useState({
    includeVision: true,
    includeUserProfile: true,
    includeGuidelines: true,
    includeCurrentTask: true,
  });

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

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const handleTaskMasterCommand = (prompt: string) => {
    setCommandInput(prompt);
  };

  const handleTaskCommand = (prompt: string, taskId?: string) => {
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        const taskNumber = task.order_index + 1;
        const updatedPrompt = prompt
          .replace(/{TASK_NUMBER}/g, taskNumber.toString())
          .replace(/{TASK_TITLE}/g, task.title);
        setCommandInput(updatedPrompt);
      }
    } else {
      setCommandInput(prompt);
    }
  };

  const handleImplementTask = (taskId: string, taskTitle: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const taskNumber = task.order_index + 1;
      setCommandInput(`Implement task ${taskNumber} and all of its subtasks.`);
    }
  };

  const handleBreakDownTask = (taskId: string, taskTitle: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const taskNumber = task.order_index + 1;
      setCommandInput(`Task ${taskNumber} seems complex. Can you break it down into subtasks?`);
    }
  };

  const handleViewTaskDetails = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const generateContext = async (taskOnly = false) => {
    if (!currentProject) return '';

    const sections: string[] = [];

    if (!taskOnly) {
      const { data: visionData } = await supabase
        .from('visions')
        .select('*')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (contextOptions.includeCurrentTask || taskOnly) {
        const { data: taskData } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', currentProject.id)
          .eq('status', 'in_progress')
          .maybeSingle();

        sections.push(`## Current Task
${taskData ? `**${taskData.title}**\n${taskData.description || 'No description'}\n\n**Acceptance Criteria:**\n${taskData.acceptance_criteria || 'Not defined'}` : 'No active task'}`);
      }

      if (contextOptions.includeVision) {
        sections.push(`## Project Vision
**Problem:** ${visionData?.problem || 'Not defined'}
**Target User:** ${visionData?.target_user || 'Not defined'}
**Success Metrics:** ${visionData?.success_metrics || 'Not defined'}`);
      }

      if (contextOptions.includeUserProfile) {
        sections.push(`## User Profile
**Primary User:** ${profileData?.primary_user || 'Not defined'}
**Goal:** ${profileData?.goal || 'Not defined'}
**Technical Comfort:** ${profileData?.technical_comfort || 'medium'}
**Time Constraints:** ${profileData?.time_constraints || 'Not defined'}`);
      }

      if (contextOptions.includeGuidelines) {
        sections.push(`## Guidelines
- Follow the project's coding standards
- Keep the user's technical comfort level in mind
- Focus on the current task scope
- Ask clarifying questions if requirements are ambiguous`);
      }
    } else {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('status', 'in_progress')
        .maybeSingle();

      sections.push(`## Current Task
**${taskData?.title || 'No active task'}**

${taskData?.description || 'No description'}

**Acceptance Criteria:**
${taskData?.acceptance_criteria || 'Not defined'}

${taskData?.notes ? `**Notes:**\n${taskData.notes}` : ''}`);
    }

    return `# Project Context for AI Assistant

${sections.join('\n\n')}

---
Ready to implement the current task with this context in mind.
`;
  };

  const updateContextPreview = async () => {
    const preview = await generateContext(false);
    setContextPreview(preview);
  };

  useEffect(() => {
    if (showContextPreview) {
      updateContextPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showContextPreview, contextOptions, currentProject]);

  const copyContextToClipboard = async (taskOnly = false) => {
    const context = await generateContext(taskOnly);
    await navigator.clipboard.writeText(context);
    setCopiedContext(true);
    setTimeout(() => setCopiedContext(false), 2000);
  };

  const currentTask = tasks.find((t) => t.status === 'in_progress');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
  const nextTask = pendingTasks[0];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
          <Code2 className="w-8 h-8 text-primary-400" />
          Mission Control
        </h1>
        <p className="text-primary-400 mt-2">
          Integrated terminal with TaskMaster AI workflow and vertical task timeline
        </p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="flex-1 min-h-[500px]">
            <TerminalPanel />
          </div>

          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-primary-100 mb-1 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary-400" />
                TaskMaster Commands
              </h2>
              <p className="text-sm text-primary-400">
                Click a command to fill it into the terminal. Uses TaskMaster AI to manage your development workflow.
              </p>
            </div>
            <TaskMasterCommands
              onCommandSelect={handleTaskMasterCommand}
              onTaskCommand={handleTaskCommand}
              selectedTaskId={currentTask?.id || null}
            />
          </Card>

          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-primary-100 mb-1 flex items-center gap-2">
                <Copy className="w-5 h-5 text-primary-400" />
                Context Clipper
              </h2>
              <p className="text-sm text-primary-400">
                Copy your project context to paste into Claude Code or any AI assistant
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-primary-300">Include sections:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-primary-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contextOptions.includeCurrentTask}
                      onChange={(e) =>
                        setContextOptions({ ...contextOptions, includeCurrentTask: e.target.checked })
                      }
                      className="rounded border-primary-600 bg-primary-900 text-primary-400 focus:ring-primary-400"
                    />
                    Current Task
                  </label>
                  <label className="flex items-center gap-2 text-sm text-primary-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contextOptions.includeVision}
                      onChange={(e) =>
                        setContextOptions({ ...contextOptions, includeVision: e.target.checked })
                      }
                      className="rounded border-primary-600 bg-primary-900 text-primary-400 focus:ring-primary-400"
                    />
                    Project Vision
                  </label>
                  <label className="flex items-center gap-2 text-sm text-primary-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contextOptions.includeUserProfile}
                      onChange={(e) =>
                        setContextOptions({ ...contextOptions, includeUserProfile: e.target.checked })
                      }
                      className="rounded border-primary-600 bg-primary-900 text-primary-400 focus:ring-primary-400"
                    />
                    User Profile
                  </label>
                  <label className="flex items-center gap-2 text-sm text-primary-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contextOptions.includeGuidelines}
                      onChange={(e) =>
                        setContextOptions({ ...contextOptions, includeGuidelines: e.target.checked })
                      }
                      className="rounded border-primary-600 bg-primary-900 text-primary-400 focus:ring-primary-400"
                    />
                    Guidelines
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => copyContextToClipboard(false)} className="flex-1" variant="primary">
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedContext ? 'Copied!' : 'Copy Full Context'}
                </Button>
                <Button onClick={() => copyContextToClipboard(true)} className="flex-1" variant="secondary">
                  <FileText className="w-4 h-4 mr-2" />
                  Task Only
                </Button>
              </div>

              <button
                onClick={() => setShowContextPreview(!showContextPreview)}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {showContextPreview ? 'Hide' : 'Show'} Preview
              </button>

              {showContextPreview && (
                <div className="mt-2 p-3 bg-primary-900/50 rounded-lg border border-primary-700/50">
                  <pre className="text-xs text-primary-300 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                    {contextPreview || 'Generating preview...'}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="w-96 flex flex-col gap-6 min-h-0">
          {/* Task Status Summary */}
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary-100 mb-1 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-400" />
                Progress Overview
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-400">Progress</span>
                <span className="text-sm font-semibold text-primary-100">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-primary-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-primary-400">Total</div>
                  <div className="text-lg font-semibold text-primary-100">{totalTasks}</div>
                </div>
                <div>
                  <div className="text-primary-400">Completed</div>
                  <div className="text-lg font-semibold text-green-400">{completedTasks.length}</div>
                </div>
                <div>
                  <div className="text-primary-400">In Progress</div>
                  <div className="text-lg font-semibold text-blue-400">{currentTask ? 1 : 0}</div>
                </div>
                <div>
                  <div className="text-primary-400">Pending</div>
                  <div className="text-lg font-semibold text-primary-300">{pendingTasks.length}</div>
                </div>
              </div>
              {nextTask && (
                <div className="pt-3 border-t border-primary-700/50">
                  <div className="text-xs text-primary-400 mb-1">Next Suggested Task</div>
                  <div className="text-sm font-medium text-primary-100">{nextTask.title}</div>
                  <Button
                    onClick={() => handleViewTaskDetails(nextTask.id)}
                    variant="ghost"
                    className="mt-2 w-full text-xs py-1"
                  >
                    View Details
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Task Timeline */}
          <Card className="flex-1 flex flex-col min-h-0">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-primary-100 mb-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                Task Timeline
              </h2>
              <p className="text-xs text-primary-400">
                {pendingTasks.length} pending · {completedTasks.length} completed
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {currentTask && (
                <div className="relative">
                  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-blue-500/30"></div>
                  <div
                    className="bg-blue-900/30 border-2 border-blue-500 rounded-lg p-4 relative cursor-pointer hover:bg-blue-900/40 transition-colors"
                    onClick={() => setExpandedTaskId(expandedTaskId === currentTask.id ? null : currentTask.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-300">IN PROGRESS</span>
                        </div>
                        <h3 className="font-semibold text-primary-100 text-sm">{currentTask.title}</h3>
                        {currentTask.description && (
                          <p className="text-xs text-primary-400 mt-1 line-clamp-2">{currentTask.description}</p>
                        )}
                      </div>
                      {expandedTaskId === currentTask.id ? (
                        <ChevronUp className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      )}
                    </div>
                    {expandedTaskId === currentTask.id && (
                      <div className="mt-4 pt-4 border-t border-blue-500/30 space-y-3">
                        {currentTask.acceptance_criteria && (
                          <div>
                            <p className="text-xs font-medium text-primary-300 mb-1">Acceptance Criteria</p>
                            <p className="text-xs text-primary-400 whitespace-pre-line">{currentTask.acceptance_criteria}</p>
                          </div>
                        )}
                        {currentTask.notes && (
                          <div>
                            <p className="text-xs font-medium text-primary-300 mb-1">Notes</p>
                            <p className="text-xs text-primary-500 whitespace-pre-line">{currentTask.notes}</p>
                          </div>
                        )}
                        <TaskQuickActions
                          task={currentTask}
                          onImplement={handleImplementTask}
                          onBreakDown={handleBreakDownTask}
                          onViewDetails={handleViewTaskDetails}
                          isExpanded={true}
                        />
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(currentTask.id, 'completed');
                          }}
                          className="w-full text-xs py-1.5"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {pendingTasks.map((task, index) => (
                <div key={task.id} className="relative group">
                  {index < pendingTasks.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-primary-700"></div>
                  )}
                  <div
                    className="bg-primary-800/40 border border-primary-700 rounded-lg p-4 relative cursor-pointer hover:bg-primary-800/60 transition-colors"
                    onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTaskStatus(task.id, 'in_progress');
                        }}
                        className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-primary-600 bg-primary-900 flex items-center justify-center hover:border-blue-500 hover:bg-blue-900/30 transition-colors"
                      >
                        <Circle className="w-4 h-4 text-primary-500" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-primary-100 text-sm">{task.title}</h3>
                        {task.description && (
                          <p className="text-xs text-primary-400 mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <TaskQuickActions
                          task={task}
                          onImplement={handleImplementTask}
                          onBreakDown={handleBreakDownTask}
                          onViewDetails={handleViewTaskDetails}
                          isExpanded={false}
                        />
                        {expandedTaskId === task.id ? (
                          <ChevronUp className="w-4 h-4 text-primary-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-primary-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                    {expandedTaskId === task.id && (
                      <div className="mt-4 pt-4 border-t border-primary-700/50 space-y-3">
                        {task.acceptance_criteria && (
                          <div>
                            <p className="text-xs font-medium text-primary-300 mb-1">Acceptance Criteria</p>
                            <p className="text-xs text-primary-400 whitespace-pre-line">{task.acceptance_criteria}</p>
                          </div>
                        )}
                        {task.notes && (
                          <div>
                            <p className="text-xs font-medium text-primary-300 mb-1">Notes</p>
                            <p className="text-xs text-primary-500 whitespace-pre-line">{task.notes}</p>
                          </div>
                        )}
                        <TaskQuickActions
                          task={task}
                          onImplement={handleImplementTask}
                          onBreakDown={handleBreakDownTask}
                          onViewDetails={handleViewTaskDetails}
                          isExpanded={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {completedTasks.length > 0 && (
                <>
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-primary-700"></div>
                    <span className="text-xs font-medium text-primary-500">COMPLETED</span>
                    <div className="flex-1 h-px bg-primary-700"></div>
                  </div>
                  {completedTasks.map((task) => (
                    <div key={task.id} className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 opacity-75">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-700 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-green-300 text-sm line-through">{task.title}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {tasks.length === 0 && (
                <div className="text-center py-12">
                  <Circle className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                  <p className="text-primary-400 text-sm">No tasks yet</p>
                  <p className="text-xs text-primary-500 mt-2">Use TaskMaster commands to generate tasks from your PRD</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
