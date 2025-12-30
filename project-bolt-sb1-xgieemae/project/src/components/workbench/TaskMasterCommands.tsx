import React, { useState, useMemo } from 'react';
import {
  Terminal as TerminalIcon,
  ChevronDown,
  ChevronUp,
  Search,
  Rocket,
  List,
  BarChart3,
  Settings,
  Play,
  Sparkles,
  FileText,
  Plus,
  Edit,
  Trash2,
  Zap,
  Bug,
} from 'lucide-react';
import { Input } from '../ui';

export interface TaskMasterCommand {
  id: string;
  label: string;
  prompt: string;
  category: 'setup' | 'discovery' | 'analysis' | 'management' | 'implementation' | 'autopilot';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiresTask?: boolean;
}

interface TaskMasterCommandsProps {
  onCommandSelect: (prompt: string) => void;
  onTaskCommand?: (prompt: string, taskId?: string) => void;
  selectedTaskId?: string | null;
}

const COMMANDS: TaskMasterCommand[] = [
  // Setup & Initialization
  {
    id: 'parse-prd',
    label: 'Parse PRD and Generate Tasks',
    prompt: "I've initialized a new project with Claude Task Master. I have a PRD at scripts/prd.txt. Can you parse it and set up initial tasks?",
    category: 'setup',
    icon: FileText,
    description: 'Parse your PRD file and generate initial task structure. Note: If Claude Code shows a JSON parsing error, use Cursor first then switch back.',
  },
  {
    id: 'init-taskmaster',
    label: 'Initialize TaskMaster Project',
    prompt: 'I would like to initialize TaskMaster AI for this project. Can you help me set it up?',
    category: 'setup',
    icon: Rocket,
    description: 'Set up TaskMaster AI configuration and structure',
  },

  // Task Discovery
  {
    id: 'show-tasks',
    label: 'Show All Tasks',
    prompt: 'Show tasks',
    category: 'discovery',
    icon: List,
    description: 'Display all tasks with their current status',
  },
  {
    id: 'next-task',
    label: 'Next Task to Work On',
    prompt: "What's the next task I should work on? Please consider dependencies and priorities.",
    category: 'discovery',
    icon: Play,
    description: 'Get the next recommended task based on dependencies',
  },
  {
    id: 'task-details',
    label: 'Show Task Details',
    prompt: 'Show me details about the current task',
    category: 'discovery',
    icon: FileText,
    description: 'View detailed information about a specific task',
    requiresTask: true,
  },

  // Task Analysis
  {
    id: 'analyze-complexity',
    label: 'Analyze Task Complexity',
    prompt: 'Can you analyze the complexity of our tasks to help me understand which ones need to be broken down further?',
    category: 'analysis',
    icon: BarChart3,
    description: 'Analyze complexity scores for all tasks',
  },
  {
    id: 'breakdown-high-complexity',
    label: 'Break Down High Complexity Tasks',
    prompt: 'Can you help me break down all of the high complexity tasks?',
    category: 'analysis',
    icon: Sparkles,
    description: 'Automatically break down complex tasks into subtasks',
  },
  {
    id: 'breakdown-task',
    label: 'Break Down Specific Task',
    prompt: 'Task {TASK_NUMBER} seems complex. Can you break it down into subtasks?',
    category: 'analysis',
    icon: Sparkles,
    description: 'Break down a specific task into smaller subtasks',
    requiresTask: true,
  },

  // Task Management
  {
    id: 'add-task',
    label: 'Add New Task',
    prompt: "Let's add a new task. We should implement {FEATURE_NAME}. Here are the requirements:\n\n- Requirement 1\n- Requirement 2",
    category: 'management',
    icon: Plus,
    description: 'Create a new task with requirements',
  },
  {
    id: 'create-bug-task',
    label: 'Create Bug Fix Task',
    prompt: 'The [FEATURE] is not working as expected. Create a new task to fix it:\n\n- Expected behavior: [WHAT SHOULD HAPPEN]\n- Actual behavior: [WHAT IS HAPPENING]\n\nRequirements for the fix:\n- the fix should [REQUIREMENT 1]\n- it should [REQUIREMENT 2]',
    category: 'management',
    icon: Bug,
    description: 'Turn a bug into a tracked task with clear requirements',
  },
  {
    id: 'update-task',
    label: 'Update Task Direction',
    prompt: 'There should be a change in task {TASK_NUMBER}. Can you update it with this and set it back to pending?',
    category: 'management',
    icon: Edit,
    description: 'Modify an existing task and reset its status',
    requiresTask: true,
  },
  {
    id: 'deprecate-task',
    label: 'Remove Task',
    prompt: 'Task {TASK_NUMBER} is not needed anymore. You can remove it.',
    category: 'management',
    icon: Trash2,
    description: 'Mark a task as deprecated or remove it',
    requiresTask: true,
  },

  // Implementation
  {
    id: 'implement-task',
    label: 'Implement Task with Subtasks',
    prompt: 'Implement task {TASK_NUMBER} and all of its subtasks.',
    category: 'implementation',
    icon: Play,
    description: 'Implement a task and all its subtasks',
    requiresTask: true,
  },
  {
    id: 'implement-subtask',
    label: 'Implement Subtask',
    prompt: 'Implement subtask {SUBTASK_NUMBER}.',
    category: 'implementation',
    icon: Zap,
    description: 'Implement a specific subtask',
    requiresTask: true,
  },

  // Autopilot
  {
    id: 'autopilot-start',
    label: 'Start Autopilot',
    prompt: 'tm autopilot start',
    category: 'autopilot',
    icon: Rocket,
    description: 'Start TDD workflow autopilot',
  },
  {
    id: 'autopilot-next',
    label: 'Autopilot Next Action',
    prompt: 'tm autopilot next',
    category: 'autopilot',
    icon: Play,
    description: 'Get the next autopilot action',
  },
  {
    id: 'autopilot-status',
    label: 'Autopilot Status',
    prompt: 'tm autopilot status',
    category: 'autopilot',
    icon: BarChart3,
    description: 'Check autopilot workflow progress',
  },
];

const CATEGORY_CONFIG = {
  setup: {
    label: 'Setup & Initialization',
    icon: Rocket,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-700/50',
  },
  discovery: {
    label: 'Task Discovery',
    icon: List,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-700/50',
  },
  analysis: {
    label: 'Task Analysis',
    icon: BarChart3,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-700/50',
  },
  management: {
    label: 'Task Management',
    icon: Settings,
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-700/50',
  },
  implementation: {
    label: 'Implementation',
    icon: Play,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-700/50',
  },
  autopilot: {
    label: 'Autopilot',
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-700/50',
  },
};

export function TaskMasterCommands({ onCommandSelect, onTaskCommand, selectedTaskId }: TaskMasterCommandsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['setup', 'discovery', 'implementation'])
  );

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return COMMANDS;

    const query = searchQuery.toLowerCase();
    return COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.prompt.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const commandsByCategory = useMemo(() => {
    const grouped: Record<string, TaskMasterCommand[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = [];
      }
      grouped[cmd.category].push(cmd);
    });
    return grouped;
  }, [filteredCommands]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleCommandClick = (command: TaskMasterCommand) => {
    let prompt = command.prompt;

    // Replace placeholders if task is selected
    if (selectedTaskId && command.requiresTask) {
      const taskNumber = selectedTaskId; // Could be enhanced to get actual task number
      prompt = prompt.replace(/{TASK_NUMBER}/g, taskNumber);
      prompt = prompt.replace(/{SUBTASK_NUMBER}/g, `${taskNumber}.1`);
    }

    if (command.requiresTask && selectedTaskId && onTaskCommand) {
      onTaskCommand(prompt, selectedTaskId);
    } else {
      onCommandSelect(prompt);
    }
  };

  const categories = Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
        <Input
          type="text"
          placeholder="Search commands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Commands by Category */}
      <div className="space-y-3">
        {categories.map((category) => {
          const commands = commandsByCategory[category];
          if (!commands || commands.length === 0) return null;

          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;
          const isExpanded = expandedCategories.has(category);

          return (
            <div
              key={category}
              className={`border rounded-lg overflow-hidden ${config.borderColor} ${config.bgColor}`}
            >
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 hover:bg-primary-800/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="text-sm font-semibold text-primary-100">{config.label}</span>
                  <span className="text-xs text-primary-500">({commands.length})</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-primary-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-primary-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-primary-700/50 p-3 space-y-2">
                  {commands.map((cmd) => {
                    const CommandIcon = cmd.icon;
                    const isDisabled = cmd.requiresTask && !selectedTaskId;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleCommandClick(cmd)}
                        disabled={isDisabled}
                        className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors group ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'bg-primary-800/40 hover:bg-primary-700/60'
                        }`}
                        title={isDisabled ? 'Select a task first' : cmd.description}
                      >
                        <CommandIcon className="w-4 h-4 text-primary-400 group-hover:text-primary-300 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-primary-100">{cmd.label}</div>
                          <div className="text-xs text-primary-500 line-clamp-1">{cmd.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCommands.length === 0 && (
        <div className="text-center py-8">
          <Search className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-primary-400">No commands found</p>
        </div>
      )}
    </div>
  );
}

