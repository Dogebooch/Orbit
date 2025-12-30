import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  List,
  ArrowRight,
  FileText,
  Code2,
  Eye,
  GitCommit,
  ChevronDown,
  ChevronUp,
  Check,
  Circle,
  HelpCircle,
  ExternalLink,
  Target,
  BookMarked,
  Info,
  X,
} from 'lucide-react';
import { Card, Button, Tooltip } from '../ui';
import { useTerminal } from '../../contexts/TerminalContext';
import { useDevelopmentLoop } from '../../hooks/useDevelopmentLoop';
import { useApp } from '../../contexts/AppContext';

export type LoopStep = 
  | 'start'
  | 'view_tasks'
  | 'select_task'
  | 'generate_brief'
  | 'implement'
  | 'review'
  | 'commit';

interface LoopStepInfo {
  id: LoopStep;
  title: string;
  description: string;
  command: string;
  icon: React.ElementType;
  details: string;
  guideAnchor?: string;
}

const LOOP_STEPS: LoopStepInfo[] = [
  {
    id: 'start',
    title: 'Start Session',
    description: 'Initialize Claude Code session',
    command: '/start',
    icon: Play,
    details: 'Begin your development session by initializing Claude Code in your project directory. This sets up the context and prepares the environment.',
    guideAnchor: 'phase-7-daily-build-loop',
  },
  {
    id: 'view_tasks',
    title: 'View Tasks',
    description: 'Check current project status',
    command: '/tasks',
    icon: List,
    details: 'View all tasks in your project. See what\'s pending, in progress, and completed. Understand dependencies and priorities.',
    guideAnchor: 'phase-7-daily-build-loop',
  },
  {
    id: 'select_task',
    title: 'Select Task',
    description: 'Choose next task based on dependencies',
    command: '/next',
    icon: ArrowRight,
    details: 'Ask Claude which task to work on next. Claude will analyze dependencies and recommend the best task to tackle.',
    guideAnchor: 'phase-7-daily-build-loop',
  },
  {
    id: 'generate_brief',
    title: 'Generate Copilot Brief',
    description: 'Create detailed prompt for Copilot',
    command: '/brief [Task ID]',
    icon: FileText,
    details: 'Generate a comprehensive brief containing requirements, constraints, and file paths. This brief is ready to paste into GitHub Copilot Chat or Composer.',
    guideAnchor: 'copilot-handoff-prompts',
  },
  {
    id: 'implement',
    title: 'Implement with Copilot',
    description: 'Build the feature using Copilot',
    icon: Code2,
    command: 'Switch to VS Code',
    details: 'Copy the brief and switch to VS Code. Paste it into Copilot Chat or Composer. Review and apply the generated code changes.',
    guideAnchor: 'phase-7-daily-build-loop',
  },
  {
    id: 'review',
    title: 'Architectural Audit',
    description: 'Review implementation against PRD',
    command: '/review',
    icon: Eye,
    details: 'Have Claude review Copilot\'s work against the PRD, architecture patterns, and constraints. Identify any issues before committing.',
    guideAnchor: 'code-review-checklist',
  },
  {
    id: 'commit',
    title: 'Commit',
    description: 'Save your progress',
    command: '/git-commit',
    icon: GitCommit,
    details: 'Generate a commit message and commit your changes. This completes the loop iteration and you can start the next one.',
    guideAnchor: 'phase-7-daily-build-loop',
  },
];

interface DevelopmentLoopHelperProps {
  currentStep?: LoopStep;
  completedSteps?: LoopStep[];
  onStepAction?: (step: LoopStep, command: string) => void;
  activeTaskId?: string | null;
}

export function DevelopmentLoopHelper({
  currentStep,
  completedSteps = [],
  onStepAction,
  activeTaskId,
}: DevelopmentLoopHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedStep, setExpandedStep] = useState<LoopStep | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { setCommandInput } = useTerminal();
  const { activeTask } = useDevelopmentLoop();
  const { setCurrentStage } = useApp();
  const helpDropdownRef = useRef<HTMLDivElement>(null);

  const handleStepClick = (step: LoopStepInfo) => {
    if (onStepAction) {
      onStepAction(step.id, step.command);
    } else {
      // Default behavior: fill terminal with command
      let command = step.command;
      
      // Replace [Task ID] with actual task ID if available
      if (command.includes('[Task ID]') && activeTaskId) {
        command = command.replace('[Task ID]', activeTaskId);
      }
      
      setCommandInput(command);
    }
  };

  const getStepStatus = (stepId: LoopStep): 'completed' | 'current' | 'pending' => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (currentStep === stepId) return 'current';
    return 'pending';
  };

  const calculateProgress = (): number => {
    return Math.round((completedSteps.length / LOOP_STEPS.length) * 100);
  };

  const progress = calculateProgress();
  const nextStep = LOOP_STEPS.find(
    (step) => !completedSteps.includes(step.id) && step.id !== currentStep
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        helpDropdownRef.current &&
        !helpDropdownRef.current.contains(event.target as Node)
      ) {
        setIsHelpOpen(false);
      }
    };

    if (isHelpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHelpOpen]);

  const handleGoToPromptLibrary = () => {
    setCurrentStage('promptlibrary');
    setIsHelpOpen(false);
  };

  return (
    <Card className="mb-4">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-primary-100">
                Development Loop
              </h2>
              <Tooltip
                content="The 7-step Overseer Build Loop from the DougHub guide. Follow these steps to systematically build features with AI assistance."
                position="top"
              >
                <HelpCircle className="w-4 h-4 text-primary-400 cursor-help" />
              </Tooltip>
              <div className="relative" ref={helpDropdownRef}>
                <button
                  onClick={() => setIsHelpOpen(!isHelpOpen)}
                  className="p-1 hover:bg-primary-800/50 rounded transition-colors"
                  title="Help & Resources"
                >
                  <Info className="w-4 h-4 text-primary-400" />
                </button>
                {isHelpOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 z-50">
                    <Card className="p-4 shadow-lg border-primary-700/50">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-sm font-semibold text-primary-100">
                          Help & Resources
                        </h3>
                        <button
                          onClick={() => setIsHelpOpen(false)}
                          className="p-1 hover:bg-primary-800/50 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-primary-400" />
                        </button>
                      </div>

                      {/* Prompt Library Section */}
                      <div className="mb-4 pb-4 border-b border-primary-700/50">
                        <div className="flex items-start gap-2 mb-2">
                          <BookMarked className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-xs font-semibold text-primary-200 mb-1">
                              Prompt Library (Stage 4)
                            </h4>
                            <p className="text-xs text-primary-400 mb-3">
                              Stage 4 is now the Prompt Library. Access field-tested prompts from the Vibe Coding and TaskMaster guides. Use PRD prompts in Strategy, then TaskMaster prompts in the Workbench.
                            </p>
                            <Button
                              onClick={handleGoToPromptLibrary}
                              variant="secondary"
                              size="sm"
                              className="w-full text-xs"
                            >
                              <BookMarked className="w-3 h-3 mr-1.5" />
                              Go to Prompt Library
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Slash Commands Section */}
                      <div className="mb-4 pb-4 border-b border-primary-700/50">
                        <h4 className="text-xs font-semibold text-primary-200 mb-3">
                          Slash Commands Guide
                        </h4>
                        <div className="space-y-2">
                          {LOOP_STEPS.filter(step => step.command.startsWith('/')).map((step) => {
                            const Icon = step.icon;
                            return (
                              <div
                                key={step.id}
                                className="flex items-start gap-2 p-2 rounded bg-primary-800/30 hover:bg-primary-800/50 transition-colors"
                              >
                                <Icon className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <code className="text-xs font-mono text-blue-400">
                                      {step.command}
                                    </code>
                                  </div>
                                  <p className="text-xs text-primary-400">
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Links */}
                      <div>
                        <h4 className="text-xs font-semibold text-primary-200 mb-2">
                          Quick Links
                        </h4>
                        <div className="space-y-1">
                          <a
                            href="#phase-7-daily-build-loop"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Development Loop Guide
                          </a>
                          <a
                            href="#copilot-handoff-prompts"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Copilot Handoff Prompts
                          </a>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-primary-400">
              Follow the workflow: Start → View → Select → Brief → Implement → Review → Commit
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-primary-800/50 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-primary-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-primary-400" />
            )}
          </button>
        </div>

        {/* Progress Indicator and Active Mission */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-primary-700"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                  className="text-blue-400 transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-100">{progress}%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {currentStep && (
                <div className="mb-1">
                  <span className="text-xs text-primary-400">Current: </span>
                  <span className="text-xs font-medium text-blue-400">
                    {LOOP_STEPS.find((s) => s.id === currentStep)?.title}
                  </span>
                </div>
              )}
              {nextStep && (
                <div>
                  <span className="text-xs text-primary-400">Next: </span>
                  <span className="text-xs font-medium text-primary-300">
                    {nextStep.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Compact Active Mission */}
          {activeTask && (
            <div className="pt-3 border-t border-primary-700/50">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-primary-200">Active Mission:</span>
                    <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/50 rounded text-xs font-medium text-blue-300">
                      IN PROGRESS
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-primary-100 truncate">
                    {activeTask.title}
                  </h3>
                  {activeTask.description && (
                    <p className="text-xs text-primary-400 line-clamp-1 mt-0.5">
                      {activeTask.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Step List (when collapsed) */}
        {!isExpanded && (
          <div className="flex flex-wrap gap-2">
            {LOOP_STEPS.map((step) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <Tooltip
                  key={step.id}
                  content={`${step.title}: ${step.description}`}
                  position="top"
                >
                  <button
                    onClick={() => handleStepClick(step)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      status === 'completed'
                        ? 'bg-green-900/30 border border-green-700/50 text-green-300'
                        : status === 'current'
                        ? 'bg-blue-900/30 border border-blue-700/50 text-blue-300 animate-pulse'
                        : 'bg-primary-800/50 border border-primary-700/50 text-primary-300 hover:bg-primary-800/70'
                    }`}
                  >
                    {status === 'completed' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Expanded Step Details */}
        {isExpanded && (
          <div className="space-y-3 mt-4 pt-4 border-t border-primary-700/50">
            {LOOP_STEPS.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              const isStepExpanded = expandedStep === step.id;
              
              return (
                <div
                  key={step.id}
                  className={`rounded-lg border transition-colors ${
                    status === 'current'
                      ? 'border-blue-500/50 bg-blue-900/20'
                      : status === 'completed'
                      ? 'border-green-700/50 bg-green-900/10'
                      : 'border-primary-700/50 bg-primary-800/30'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Step Number & Icon */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            status === 'completed'
                              ? 'bg-green-900/50 border-2 border-green-500'
                              : status === 'current'
                              ? 'bg-blue-900/50 border-2 border-blue-500'
                              : 'bg-primary-800 border-2 border-primary-600'
                          }`}
                        >
                          {status === 'completed' ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <span className="text-xs font-semibold text-primary-300">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <Icon
                          className={`w-5 h-5 ${
                            status === 'completed'
                              ? 'text-green-400'
                              : status === 'current'
                              ? 'text-blue-400'
                              : 'text-primary-400'
                          }`}
                        />
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-primary-100 mb-0.5">
                              {step.title}
                            </h3>
                            <p className="text-xs text-primary-400 mb-2">
                              {step.description}
                            </p>
                            {isStepExpanded && (
                              <div className="mt-2 pt-2 border-t border-primary-700/50">
                                <p className="text-xs text-primary-300 mb-3">
                                  {step.details}
                                </p>
                                {step.guideAnchor && (
                                  <a
                                    href={`#${step.guideAnchor}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                                  >
                                    View guide section
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              onClick={() => handleStepClick(step)}
                              variant={status === 'current' ? 'primary' : 'secondary'}
                              size="sm"
                              className="text-xs"
                            >
                              {step.command.startsWith('/') || step.command.startsWith('Switch')
                                ? 'Run'
                                : 'Action'}
                            </Button>
                            <button
                              onClick={() =>
                                setExpandedStep(isStepExpanded ? null : step.id)
                              }
                              className="p-1 hover:bg-primary-800/50 rounded transition-colors"
                            >
                              {isStepExpanded ? (
                                <ChevronUp className="w-4 h-4 text-primary-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-primary-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

