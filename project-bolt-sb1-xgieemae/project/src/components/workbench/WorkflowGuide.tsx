import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  List,
  Target,
  RefreshCw,
  Code2,
  TestTube,
  GitCommit,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  Bug,
  Scissors,
  MessageSquarePlus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui';

export interface WorkflowStep {
  id: string;
  number: number;
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  tips?: string[];
  conditional?: boolean;
}

interface ConditionalAction {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  when: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'review',
    number: 1,
    title: 'Review Tasks',
    description: 'View all tasks and their current status',
    prompt: 'Show tasks',
    icon: List,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    tips: ['Review task dependencies', 'Check which tasks are blocked'],
  },
  {
    id: 'select',
    number: 2,
    title: 'Select Next Task',
    description: 'Get AI recommendation for next task based on dependencies and priorities',
    prompt: "What's the next task I should work on? Please consider dependencies and priorities.",
    icon: Target,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    tips: ['Consider task complexity', 'Check for blockers first'],
  },
  {
    id: 'context',
    number: 3,
    title: 'Refresh Context',
    description: 'Ensure AI has current project context before implementing',
    prompt: 'Here is the current project context for this task:\n\n[PASTE CONTEXT FROM CONTEXT CLIPPER]\n\nPlease confirm you understand the context before we proceed.',
    icon: RefreshCw,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/30',
    tips: [
      'Use Context Clipper to copy relevant context',
      'Start a new AI session if switching features',
      'Include vision, user profile, and current task',
    ],
    conditional: true,
  },
  {
    id: 'implement',
    number: 4,
    title: 'Implement Task',
    description: 'Have AI implement the task and all subtasks',
    prompt: 'Implement task {TASK_NUMBER} and all of its subtasks.',
    icon: Code2,
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    tips: [
      'For complex tasks, implement one subtask at a time',
      'Use: "Implement subtask X.1" for granular control',
    ],
  },
  {
    id: 'test',
    number: 5,
    title: 'Smoke Test',
    description: 'Verify the implementation works as expected',
    prompt: '',
    icon: TestTube,
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
    tips: [
      'Test the happy path first',
      'Check edge cases',
      'Verify on different screen sizes if UI',
      'If you find bugs, create them as tasks (see below)',
    ],
  },
  {
    id: 'commit',
    number: 6,
    title: 'Commit Changes',
    description: 'Save your progress with a meaningful commit message',
    prompt: 'git add . && git commit -m "feat: implement task {TASK_NUMBER} - {TASK_TITLE}"',
    icon: GitCommit,
    color: 'text-pink-400',
    bgColor: 'bg-pink-900/30',
    tips: [
      'Claude Code does NOT auto-checkpoint',
      'Commit after each completed task',
      'Use conventional commits: feat, fix, refactor',
    ],
  },
];

const CONDITIONAL_ACTIONS: ConditionalAction[] = [
  {
    id: 'bug-as-task',
    title: 'Found a Bug? Create a Task',
    description: 'Log bugs as proper tasks for better tracking',
    prompt: `The [FEATURE_NAME] is not working as expected. Create a new task to fix it:

- Expected behavior: [WHAT SHOULD HAPPEN]
- Actual behavior: [WHAT IS HAPPENING]
- Steps to reproduce: [HOW TO TRIGGER THE BUG]

Requirements for the fix:
- [Requirement 1]
- [Requirement 2]`,
    icon: Bug,
    when: 'You discover a bug during smoke testing',
  },
  {
    id: 'break-down-file',
    title: 'Large File? Break It Down',
    description: 'Split files over 500 lines into modules',
    prompt: `Break down this file into logical modules so it's easier to read.
Create directories if needed and move utils and interfaces to separate files, maintaining a domain-driven file structure.`,
    icon: Scissors,
    when: 'A file grows beyond 500 lines',
  },
  {
    id: 'new-session',
    title: 'Context Stale? Start Fresh',
    description: 'Begin a new AI session to prevent context pollution',
    prompt: `I'm starting a new AI conversation session for this feature. Here's the context:

[PASTE CONTEXT FROM CONTEXT CLIPPER]

Let's work on task {TASK_NUMBER}: {TASK_TITLE}`,
    icon: MessageSquarePlus,
    when: 'After 3+ tasks, switching features, or AI seems confused',
  },
  {
    id: 'add-extra-context',
    title: 'Add Extra Context',
    description: 'Provide additional context for complex tasks',
    prompt: `Before implementing, here's additional context:

UI Preferences:
- [Style preferences]

API Documentation:
- [Relevant API details]

Constraints:
- [Any limitations to consider]`,
    icon: Sparkles,
    when: 'Task needs specific UI, API, or architectural guidance',
  },
];

const STORAGE_KEY = 'orbit_workflow_step';

interface WorkflowGuideProps {
  onPromptSelect: (prompt: string) => void;
  currentTaskNumber?: number;
  currentTaskTitle?: string;
}

export function WorkflowGuide({
  onPromptSelect,
  currentTaskNumber,
  currentTaskTitle,
}: WorkflowGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showConditionals, setShowConditionals] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Load saved state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentStep(parsed.currentStep || 0);
        setCompletedSteps(new Set(parsed.completedSteps || []));
      } catch (e) {
        console.error('Failed to parse workflow state:', e);
      }
    }
  }, []);

  // Save state on change
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentStep,
        completedSteps: Array.from(completedSteps),
      })
    );
  }, [currentStep, completedSteps]);

  const replaceTaskPlaceholders = (prompt: string): string => {
    let result = prompt;
    if (currentTaskNumber) {
      result = result.replace(/{TASK_NUMBER}/g, currentTaskNumber.toString());
    }
    if (currentTaskTitle) {
      result = result.replace(/{TASK_TITLE}/g, currentTaskTitle);
    }
    return result;
  };

  const copyPrompt = async (prompt: string, id: string) => {
    const finalPrompt = replaceTaskPlaceholders(prompt);
    await navigator.clipboard.writeText(finalPrompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStepAction = (step: WorkflowStep, index: number) => {
    if (step.prompt) {
      const finalPrompt = replaceTaskPlaceholders(step.prompt);
      onPromptSelect(finalPrompt);
    }
    // Mark as completed and advance
    setCompletedSteps((prev) => new Set([...prev, step.id]));
    if (index < WORKFLOW_STEPS.length - 1) {
      setCurrentStep(index + 1);
    }
  };

  const handleNextStep = () => {
    const step = WORKFLOW_STEPS[currentStep];
    setCompletedSteps((prev) => new Set([...prev, step.id]));
    if (currentStep < WORKFLOW_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Loop back to start
      setCurrentStep(0);
      setCompletedSteps(new Set());
    }
  };

  const resetWorkflow = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  const activeStep = WORKFLOW_STEPS[currentStep];
  const ActiveIcon = activeStep.icon;

  return (
    <div className="bg-gradient-to-br from-primary-800/60 to-primary-900/80 border border-primary-600/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-primary-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <RotateCcw className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-primary-100 flex items-center gap-2">
              Development Workflow
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                Step {currentStep + 1}/{WORKFLOW_STEPS.length}
              </span>
            </h3>
            <p className="text-xs text-primary-400">
              Follow the iterative loop: Review → Select → Implement → Test → Commit → Repeat
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              resetWorkflow();
            }}
            className="text-xs px-2 py-1"
            title="Reset workflow"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-primary-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-primary-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-primary-700/50">
          {/* Progress Steps */}
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-4">
              {WORKFLOW_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = completedSteps.has(step.id);
                const isPast = index < currentStep;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setCurrentStep(index)}
                      className={`relative flex flex-col items-center gap-1 transition-all ${
                        isActive ? 'scale-110' : 'hover:scale-105'
                      }`}
                      title={step.title}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? `${step.bgColor} ring-2 ring-offset-2 ring-offset-primary-900 ring-${step.color.replace('text-', '')}`
                            : isCompleted || isPast
                            ? 'bg-green-900/30 border border-green-600/50'
                            : 'bg-primary-800 border border-primary-600/50'
                        }`}
                      >
                        {isCompleted || isPast ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <StepIcon
                            className={`w-5 h-5 ${isActive ? step.color : 'text-primary-500'}`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          isActive ? 'text-primary-200' : 'text-primary-500'
                        }`}
                      >
                        {step.number}
                      </span>
                    </button>
                    {index < WORKFLOW_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-1 ${
                          isPast || isCompleted ? 'bg-green-600/50' : 'bg-primary-700'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Current Step Details */}
          <div className={`mx-4 mb-4 p-4 rounded-lg ${activeStep.bgColor} border border-primary-600/30`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-primary-900/50`}>
                <ActiveIcon className={`w-6 h-6 ${activeStep.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-primary-100">{activeStep.title}</h4>
                  {activeStep.conditional && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-700 text-primary-400">
                      if needed
                    </span>
                  )}
                </div>
                <p className="text-sm text-primary-300 mb-3">{activeStep.description}</p>

                {/* Prompt */}
                {activeStep.prompt && (
                  <div className="bg-primary-900/60 rounded-lg p-3 mb-3">
                    <div className="flex items-start justify-between gap-2">
                      <code className="text-xs text-primary-200 whitespace-pre-wrap flex-1">
                        {replaceTaskPlaceholders(activeStep.prompt)}
                      </code>
                      <button
                        onClick={() => copyPrompt(activeStep.prompt, activeStep.id)}
                        className="p-1.5 rounded hover:bg-primary-700 transition-colors flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        {copiedId === activeStep.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-primary-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Tips */}
                {activeStep.tips && activeStep.tips.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {activeStep.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-primary-400">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary-500" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {activeStep.prompt && (
                    <Button
                      onClick={() => handleStepAction(activeStep, currentStep)}
                      className="text-sm"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Use Prompt
                    </Button>
                  )}
                  <Button onClick={handleNextStep} variant="secondary" className="text-sm">
                    {currentStep === WORKFLOW_STEPS.length - 1 ? (
                      <>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Start New Cycle
                      </>
                    ) : (
                      <>
                        Next Step
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Actions */}
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowConditionals(!showConditionals)}
              className="w-full flex items-center justify-between p-3 bg-primary-800/40 rounded-lg hover:bg-primary-800/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-primary-200">
                  Situational Actions
                </span>
                <span className="text-xs text-primary-500">
                  (bugs, large files, stale context)
                </span>
              </div>
              {showConditionals ? (
                <ChevronUp className="w-4 h-4 text-primary-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-primary-400" />
              )}
            </button>

            {showConditionals && (
              <div className="mt-3 space-y-2">
                {CONDITIONAL_ACTIONS.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <div
                      key={action.id}
                      className="p-3 bg-primary-800/30 rounded-lg border border-primary-700/50"
                    >
                      <div className="flex items-start gap-3">
                        <ActionIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-primary-100 text-sm">{action.title}</h5>
                          <p className="text-xs text-primary-400 mb-1">{action.description}</p>
                          <p className="text-[10px] text-amber-400/80 mb-2">
                            When: {action.when}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyPrompt(action.prompt, action.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-700 hover:bg-primary-600 rounded transition-colors text-primary-200"
                            >
                              {copiedId === action.id ? (
                                <>
                                  <Check className="w-3 h-3 text-green-400" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy Prompt
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                const finalPrompt = replaceTaskPlaceholders(action.prompt);
                                onPromptSelect(finalPrompt);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-900/50 hover:bg-amber-900/70 border border-amber-700/50 rounded transition-colors text-amber-200"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Use
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Reference */}
          <div className="px-4 pb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-lg border border-indigo-700/30">
              <div className="flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-200/80">
                  <strong className="text-indigo-300">The Loop:</strong> This workflow is designed
                  to be repeated. After committing, start back at "Review Tasks" to see what's
                  next. Each iteration builds on the last.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

