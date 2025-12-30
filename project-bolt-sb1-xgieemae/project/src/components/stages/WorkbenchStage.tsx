import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTerminal } from '../../contexts/TerminalContext';
import { useSession } from '../../contexts/SessionContext';
import { supabase } from '../../lib/supabase';
import { Button, Card, Input, StageTips, GitReminder } from '../ui';
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
  Lightbulb,
  Plus,
  X,
  Filter,
  Download,
  Sparkles,
  AlertTriangle,
  GitBranch,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { TerminalPanel } from '../workbench/TerminalPanel';
import { TaskMasterCommands } from '../workbench/TaskMasterCommands';
import { TaskQuickActions } from '../workbench/TaskQuickActions';
import { SessionIndicator } from '../workbench/SessionIndicator';
import { SessionManager } from '../workbench/SessionManager';
import { SessionOnboarding } from '../workbench/SessionOnboarding';
import { WorkflowGuide } from '../workbench/WorkflowGuide';
import { generateAndDownloadClaudeMd } from '../../lib/claudeExport';
import {
  isSubtask,
  getSubtasks,
  getBlockingTasks,
  isTaskBlocked,
  parseTaskNumber,
  sortTasksWithSubtasks,
  type Task as TaskType,
} from '../../utils/taskUtils';
import {
  calculateComplexity,
  getComplexityColor,
  formatComplexity,
  type ComplexityLevel,
} from '../../utils/complexityScoring';

interface Task extends TaskType {
  created_at: string;
  updated_at: string;
}

export function WorkbenchStage() {
  const { currentProject, user } = useApp();
  const { setCommandInput, isBackendConnected, taskMasterTasks } = useTerminal();
  const { 
    currentSession, 
    sessionHealth, 
    shouldStartNewSession, 
    startNewSession, 
    addTaskToSession 
  } = useSession();
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
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');
  const [showIdeas, setShowIdeas] = useState(true);
  const [savingIdea, setSavingIdea] = useState(false);
  const [showTaskMasterSync, setShowTaskMasterSync] = useState(false);
  const [importingTasks, setImportingTasks] = useState(false);
  const [lastCompletedTask, setLastCompletedTask] = useState<string | null>(null);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [sessionWarning, setSessionWarning] = useState<{ taskId: string; taskTitle: string } | null>(null);

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
    const task = tasks.find((t) => t.id === taskId);
    
    // Check if we should start a new session when starting a task
    if (newStatus === 'in_progress' && shouldStartNewSession(taskId)) {
      setSessionWarning({ taskId, taskTitle: task?.title || 'Unknown task' });
      return; // Don't update status yet, wait for user decision
    }

    await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    // Add task to current session when starting it
    if (newStatus === 'in_progress' && currentSession) {
      await addTaskToSession(taskId);
    }

    // Show git reminder when task is completed
    if (newStatus === 'completed' && task) {
      setLastCompletedTask(task.title);
    }
  };

  const handleSessionWarningContinue = async () => {
    if (!sessionWarning) return;
    
    // User chose to continue with current session
    await supabase
      .from('tasks')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', sessionWarning.taskId);

    setTasks(tasks.map((t) => (t.id === sessionWarning.taskId ? { ...t, status: 'in_progress' } : t)));
    
    if (currentSession) {
      await addTaskToSession(sessionWarning.taskId);
    }
    
    setSessionWarning(null);
  };

  const handleSessionWarningNewSession = async () => {
    if (!sessionWarning) return;
    
    // Start new session with this task
    const task = tasks.find(t => t.id === sessionWarning.taskId);
    const sessionName = task ? `${task.title.substring(0, 30)}...` : undefined;
    
    await startNewSession(sessionName, sessionWarning.taskId);
    
    // Update task status
    await supabase
      .from('tasks')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', sessionWarning.taskId);

    setTasks(tasks.map((t) => (t.id === sessionWarning.taskId ? { ...t, status: 'in_progress' } : t)));
    
    setSessionWarning(null);
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

  const createFeatureIdea = async () => {
    if (!currentProject || !newIdeaText.trim()) return;

    setSavingIdea(true);
    try {
      const maxOrderIndex = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order_index)) : -1;

      const { data } = await supabase
        .from('tasks')
        .insert({
          project_id: currentProject.id,
          title: `[IDEA] ${newIdeaText.trim()}`,
          description: '',
          status: 'pending',
          priority: -1, // Low priority for ideas
          acceptance_criteria: '',
          notes: 'Feature idea - convert to task when ready to implement',
          order_index: maxOrderIndex + 1,
        })
        .select()
        .single();

      if (data) {
        setTasks([...tasks, data]);
        setNewIdeaText('');
        setShowIdeaForm(false);
      }
    } catch (err) {
      console.error('Error creating feature idea:', err);
    } finally {
      setSavingIdea(false);
    }
  };

  const convertIdeaToTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newTitle = task.title.replace('[IDEA] ', '');
    await supabase
      .from('tasks')
      .update({
        title: newTitle,
        priority: 0,
        notes: task.notes.replace('Feature idea - convert to task when ready to implement', 'Converted from feature idea'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, title: newTitle, priority: 0 } : t)));
  };

  // Import tasks from TaskMaster
  const importTaskMasterTasks = async () => {
    if (!currentProject || taskMasterTasks.length === 0) return;

    setImportingTasks(true);
    try {
      const maxOrderIndex = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order_index)) : -1;
      
      // Convert TaskMaster tasks to Orbit format
      const newTasks = taskMasterTasks
        .filter((tmTask) => {
          // Skip if we already have a task with similar title
          return !tasks.some((t) => 
            t.title.toLowerCase().includes(tmTask.title.toLowerCase()) ||
            tmTask.title.toLowerCase().includes(t.title.toLowerCase())
          );
        })
        .map((tmTask, index) => ({
          project_id: currentProject.id,
          title: `${tmTask.id}. ${tmTask.title}`,
          description: tmTask.description,
          status: tmTask.status === 'done' ? 'completed' : tmTask.status === 'in-progress' ? 'in_progress' : 'pending' as const,
          priority: tmTask.priority === 'high' ? 2 : tmTask.priority === 'medium' ? 1 : 0,
          acceptance_criteria: '',
          notes: `Imported from TaskMaster. Original status: ${tmTask.status}`,
          order_index: maxOrderIndex + index + 1,
          dependencies: tmTask.dependencies.map(String),
        }));

      if (newTasks.length > 0) {
        const { data } = await supabase
          .from('tasks')
          .insert(newTasks)
          .select();

        if (data) {
          setTasks([...tasks, ...data]);
        }
      }

      setShowTaskMasterSync(false);
    } catch (err) {
      console.error('Error importing TaskMaster tasks:', err);
    } finally {
      setImportingTasks(false);
    }
  };

  const generateContext = async (taskOnly = false) => {
    if (!currentProject) return '';

    const sections: string[] = [];

    // Add session metadata at the top
    if (currentSession) {
      const taskNumbers = currentSession.task_ids
        .map(id => {
          const task = tasks.find(t => t.id === id);
          return task ? `#${task.order_index + 1}` : null;
        })
        .filter(Boolean)
        .join(', ');
      
      sections.push(`## AI Session Context
**Session:** ${currentSession.session_name}
**Tasks in Session:** ${taskNumbers || 'None'}
**Session Health:** ${sessionHealth.status}

> This is part of an ongoing AI conversation session. Keep context from previous interactions in this session.`);
    }

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

  // Separate feature ideas from regular tasks
  const isIdea = (task: Task) => task.title.startsWith('[IDEA]');
  const featureIdeas = tasks.filter((t) => isIdea(t));
  const regularTasks = tasks.filter((t) => !isIdea(t));

  // Sort tasks with subtasks appearing after their parents
  const sortedTasks = useMemo(() => sortTasksWithSubtasks(regularTasks), [regularTasks]);

  // Filter main tasks (not subtasks) for the main timeline
  const mainTasks = useMemo(() => regularTasks.filter((t) => !isSubtask(t)), [regularTasks]);

  const currentTask = regularTasks.find((t) => t.status === 'in_progress');
  const pendingTasks = mainTasks.filter((t) => t.status === 'pending');
  const completedTasks = mainTasks.filter((t) => t.status === 'completed');
  const totalTasks = mainTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
  
  // Find the next task that isn't blocked by dependencies
  const nextTask = useMemo(() => {
    return pendingTasks.find((t) => !isTaskBlocked(t, regularTasks));
  }, [pendingTasks, regularTasks]);

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

      {/* Session Indicator */}
      <div className="mb-4">
        <SessionIndicator onManageClick={() => setShowSessionManager(true)} />
      </div>

      <StageTips
        stage="workbench"
        isBackendConnected={isBackendConnected}
        maxTips={1}
      />

      {/* TaskMaster Sync Banner */}
      {taskMasterTasks.length > 0 && (
        <div className="mb-4 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-semibold text-cyan-300">
                  TaskMaster Tasks Detected
                </h3>
                <p className="text-xs text-cyan-400">
                  Found {taskMasterTasks.length} tasks from tasks.json
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowTaskMasterSync(!showTaskMasterSync)}
                className="text-xs text-cyan-300"
              >
                {showTaskMasterSync ? 'Hide' : 'View'} Tasks
              </Button>
              <Button
                onClick={importTaskMasterTasks}
                disabled={importingTasks}
                className="text-xs bg-cyan-600 hover:bg-cyan-500"
              >
                {importingTasks ? 'Importing...' : 'Import All'}
              </Button>
            </div>
          </div>
          
          {showTaskMasterSync && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {taskMasterTasks.map((tmTask) => (
                <div
                  key={tmTask.id}
                  className="flex items-center justify-between p-2 bg-primary-800/50 rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono">#{tmTask.id}</span>
                    <span className="text-primary-200">{tmTask.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      tmTask.status === 'done' 
                        ? 'bg-green-900/50 text-green-400'
                        : tmTask.status === 'in-progress'
                        ? 'bg-blue-900/50 text-blue-400'
                        : 'bg-primary-700 text-primary-400'
                    }`}>
                      {tmTask.status}
                    </span>
                    {tmTask.priority === 'high' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/50 text-red-400">
                        High
                      </span>
                    )}
                  </div>
                  {tmTask.dependencies.length > 0 && (
                    <span className="text-[10px] text-primary-500">
                      Deps: {tmTask.dependencies.join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="flex-1 min-h-[500px]">
            <TerminalPanel />
          </div>

          {/* Workflow Guide - Step-by-step development loop */}
          <WorkflowGuide
            onPromptSelect={handleTaskMasterCommand}
            currentTaskNumber={currentTask ? currentTask.order_index + 1 : undefined}
            currentTaskTitle={currentTask?.title}
          />

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

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowContextPreview(!showContextPreview)}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  {showContextPreview ? 'Hide' : 'Show'} Preview
                </button>
                
                <Button
                  variant="ghost"
                  className="text-xs py-1"
                  onClick={async () => {
                    if (currentProject) {
                      await generateAndDownloadClaudeMd(currentProject.id);
                    }
                  }}
                >
                  <Sparkles className="w-3 h-3 mr-1 text-purple-400" />
                  Export CLAUDE.md
                </Button>
              </div>

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
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-primary-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-400" />
                  Task Timeline
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowIdeaForm(!showIdeaForm)}
                  className="text-xs py-1 px-2"
                >
                  <Lightbulb className="w-4 h-4 mr-1 text-yellow-400" />
                  Add Idea
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-primary-400">
                  {pendingTasks.length} pending · {completedTasks.length} completed · {featureIdeas.length} ideas
                </p>
                {featureIdeas.length > 0 && (
                  <button
                    onClick={() => setShowIdeas(!showIdeas)}
                    className={`text-xs flex items-center gap-1 transition-colors ${showIdeas ? 'text-yellow-400' : 'text-primary-500'}`}
                  >
                    <Filter className="w-3 h-3" />
                    {showIdeas ? 'Hide' : 'Show'} Ideas
                  </button>
                )}
              </div>
            </div>

            {/* Quick Idea Capture Form */}
            {showIdeaForm && (
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-300">Quick Feature Idea</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newIdeaText}
                    onChange={(e) => setNewIdeaText(e.target.value)}
                    placeholder="Describe your feature idea..."
                    className="flex-1 text-sm bg-primary-900"
                    onKeyDown={(e) => e.key === 'Enter' && createFeatureIdea()}
                  />
                  <Button
                    onClick={createFeatureIdea}
                    disabled={!newIdeaText.trim() || savingIdea}
                    className="text-xs"
                  >
                    {savingIdea ? '...' : <Plus className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowIdeaForm(false); setNewIdeaText(''); }}
                    className="text-xs px-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-yellow-400/70 mt-2">
                  Ideas are saved separately. Convert to a task when ready to implement.
                </p>
              </div>
            )}

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

              {pendingTasks.map((task, index) => {
                const taskBlocked = isTaskBlocked(task, regularTasks);
                const blockingTasks = getBlockingTasks(task, regularTasks);
                const subtasks = getSubtasks(task, regularTasks);
                const taskNumber = parseTaskNumber(task.title);
                const complexity = calculateComplexity(task, regularTasks);

                return (
                  <div key={task.id} className="relative group">
                    {index < pendingTasks.length - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-primary-700"></div>
                    )}
                    <div
                      className={`rounded-lg p-4 relative cursor-pointer transition-colors ${
                        taskBlocked
                          ? 'bg-amber-900/20 border border-amber-700/50 hover:bg-amber-900/30'
                          : 'bg-primary-800/40 border border-primary-700 hover:bg-primary-800/60'
                      }`}
                      onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!taskBlocked) {
                              updateTaskStatus(task.id, 'in_progress');
                            }
                          }}
                          disabled={taskBlocked}
                          className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                            taskBlocked
                              ? 'border-amber-600 bg-amber-900/30 cursor-not-allowed'
                              : 'border-primary-600 bg-primary-900 hover:border-blue-500 hover:bg-blue-900/30'
                          }`}
                          title={taskBlocked ? `Blocked by: ${blockingTasks.map(t => t.title).join(', ')}` : 'Start task'}
                        >
                          {taskBlocked ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-primary-500" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {taskNumber && (
                              <span className="text-xs font-mono text-primary-500">#{taskNumber.display}</span>
                            )}
                            <h3 className="font-medium text-primary-100 text-sm">{task.title}</h3>
                            <span 
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${getComplexityColor(complexity.level)}`}
                              title={`Complexity: ${formatComplexity(complexity.level)} (${complexity.score}/${complexity.maxScore})`}
                            >
                              {formatComplexity(complexity.level)}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-xs text-primary-400 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          {taskBlocked && (
                            <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Blocked by {blockingTasks.length} task{blockingTasks.length > 1 ? 's' : ''}
                            </p>
                          )}
                          {subtasks.length > 0 && (
                            <p className="text-xs text-primary-500 mt-1 flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {subtasks.length} subtask{subtasks.length > 1 ? 's' : ''}
                            </p>
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
                          {/* Blocking tasks warning */}
                          {taskBlocked && blockingTasks.length > 0 && (
                            <div className="p-2 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                              <p className="text-xs font-medium text-amber-300 mb-1">Blocked by:</p>
                              <ul className="text-xs text-amber-400 space-y-0.5">
                                {blockingTasks.map((bt) => (
                                  <li key={bt.id} className="flex items-center gap-1">
                                    <Circle className="w-2 h-2" />
                                    {bt.title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Subtasks */}
                          {subtasks.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-primary-300 mb-2 flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                Subtasks
                              </p>
                              <div className="space-y-1 pl-2 border-l-2 border-primary-700">
                                {subtasks.map((subtask) => {
                                  const subTaskNumber = parseTaskNumber(subtask.title);
                                  return (
                                    <div
                                      key={subtask.id}
                                      className={`flex items-center gap-2 p-2 rounded text-xs ${
                                        subtask.status === 'completed'
                                          ? 'bg-green-900/20 text-green-300'
                                          : subtask.status === 'in_progress'
                                          ? 'bg-blue-900/20 text-blue-300'
                                          : 'bg-primary-800/50 text-primary-300'
                                      }`}
                                    >
                                      {subtask.status === 'completed' ? (
                                        <Check className="w-3 h-3" />
                                      ) : subtask.status === 'in_progress' ? (
                                        <PlayCircle className="w-3 h-3" />
                                      ) : (
                                        <Circle className="w-3 h-3" />
                                      )}
                                      {subTaskNumber && (
                                        <span className="font-mono text-primary-500">#{subTaskNumber.display}</span>
                                      )}
                                      <span className={subtask.status === 'completed' ? 'line-through' : ''}>
                                        {subtask.title.replace(/^\d+\.\d+\.?\s*/, '')}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
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
                          
                          {/* Complexity Analysis */}
                          {complexity.level !== 'low' && complexity.suggestions.length > 0 && (
                            <div className={`p-2 rounded-lg border ${getComplexityColor(complexity.level)}`}>
                              <p className="text-xs font-medium mb-1">
                                Complexity: {formatComplexity(complexity.level)} ({complexity.score}/{complexity.maxScore})
                              </p>
                              <ul className="text-xs space-y-0.5 opacity-80">
                                {complexity.suggestions.map((suggestion, idx) => (
                                  <li key={idx}>• {suggestion}</li>
                                ))}
                              </ul>
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
                );
              })}

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

              {/* Feature Ideas Section */}
              {showIdeas && featureIdeas.length > 0 && (
                <>
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-yellow-700/50"></div>
                    <span className="text-xs font-medium text-yellow-500 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      IDEAS ({featureIdeas.length})
                    </span>
                    <div className="flex-1 h-px bg-yellow-700/50"></div>
                  </div>
                  {featureIdeas.map((idea) => (
                    <div key={idea.id} className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-700/50 flex items-center justify-center">
                          <Lightbulb className="w-3 h-3 text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-yellow-300 text-sm">
                            {idea.title.replace('[IDEA] ', '')}
                          </h3>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => convertIdeaToTask(idea.id)}
                          className="text-xs py-1 px-2 text-yellow-400 hover:text-yellow-300"
                        >
                          Convert to Task
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {regularTasks.length === 0 && featureIdeas.length === 0 && (
                <div className="text-center py-12">
                  <Circle className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                  <p className="text-primary-400 text-sm">No tasks yet</p>
                  <p className="text-xs text-primary-500 mt-2">Use TaskMaster commands to generate tasks from your PRD</p>
                  <Button
                    variant="ghost"
                    onClick={() => setShowIdeaForm(true)}
                    className="mt-3 text-xs text-yellow-400"
                  >
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Or capture a feature idea
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Git Reminder Modal */}
      {lastCompletedTask && (
        <GitReminder
          taskTitle={lastCompletedTask}
          onDismiss={() => setLastCompletedTask(null)}
          autoDismissMs={10000}
        />
      )}

      {/* Session Manager Modal */}
      <SessionManager
        isOpen={showSessionManager}
        onClose={() => setShowSessionManager(false)}
        suggestedTaskId={currentTask?.id}
        suggestedSessionName={currentTask ? `${currentTask.title.substring(0, 30)}...` : undefined}
      />

      {/* Session Onboarding for First-Time Users */}
      {!currentSession && (
        <SessionOnboarding onStartSession={() => setShowSessionManager(true)} />
      )}

      {/* Session Warning Modal */}
      {sessionWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-primary-900 border border-yellow-700/50 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                  Consider Starting a New Session
                </h3>
                <p className="text-sm text-primary-300 mb-3">
                  You're about to start working on <strong>{sessionWarning.taskTitle}</strong>.
                </p>
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-3 mb-3">
                  <p className="text-xs text-yellow-300 font-medium mb-1">Why start a new session?</p>
                  <ul className="text-xs text-yellow-200 space-y-1">
                    {sessionHealth.reasons.map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-primary-400">
                  Starting a fresh AI conversation prevents context pollution and ensures better code quality.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSessionWarningNewSession}
                className="flex-1"
              >
                Start New Session
              </Button>
              <Button
                onClick={handleSessionWarningContinue}
                variant="secondary"
                className="flex-1"
              >
                Continue Current
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
