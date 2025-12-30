import type { LoopStep } from '../components/workbench/DevelopmentLoopHelper';

export interface LoopState {
  currentStep: LoopStep | null;
  completedSteps: LoopStep[];
  activeTaskId: string | null;
  lastStepChange: Date | null;
  loopIteration: number;
}

export interface LoopDetectionContext {
  hasActiveTask: boolean;
  hasPendingTasks: boolean;
  lastCommand: string | null;
  terminalActive: boolean;
  hasRecentCommit: boolean;
  briefGenerated: boolean;
}

/**
 * Detect the current step in the development loop based on context
 */
export function detectCurrentStep(
  context: LoopDetectionContext
): LoopStep | null {
  // If no active task, we're at the start or need to view/select tasks
  if (!context.hasActiveTask) {
    if (!context.hasPendingTasks) {
      return 'start'; // No tasks available, need to start
    }
    return 'view_tasks'; // Has tasks but none active
  }

  // Has active task - check what step we're on
  if (context.briefGenerated) {
    // Brief generated, check if we're implementing or reviewing
    if (context.terminalActive && context.lastCommand) {
      // Check if last command was a review command
      if (context.lastCommand.includes('/review')) {
        return 'review';
      }
      // Otherwise likely implementing
      return 'implement';
    }
    // Brief generated but not implementing yet
    return 'generate_brief';
  }

  // Has active task but no brief - should generate brief
  return 'select_task';
}

/**
 * Determine completed steps based on context
 */
export function getCompletedSteps(
  context: LoopDetectionContext,
  currentStep: LoopStep | null
): LoopStep[] {
  const completed: LoopStep[] = [];

  // Start is always completed if we have any context
  if (context.hasPendingTasks || context.hasActiveTask) {
    completed.push('start');
  }

  // View tasks is completed if we have tasks
  if (context.hasPendingTasks || context.hasActiveTask) {
    completed.push('view_tasks');
  }

  // Select task is completed if we have an active task
  if (context.hasActiveTask) {
    completed.push('select_task');
  }

  // Generate brief is completed if brief was generated
  if (context.briefGenerated) {
    completed.push('generate_brief');
  }

  // Implement is completed if we've moved past it
  if (context.lastCommand?.includes('/review') || context.hasRecentCommit) {
    completed.push('implement');
  }

  // Review is completed if we've committed
  if (context.hasRecentCommit) {
    completed.push('review');
    completed.push('commit');
  }

  return completed;
}

/**
 * Check if a command matches a loop step
 */
export function commandMatchesStep(
  command: string,
  step: LoopStep
): boolean {
  const patterns: Record<LoopStep, string[]> = {
    start: ['/start'],
    view_tasks: ['/tasks', 'task'],
    select_task: ['/next', 'next task'],
    generate_brief: ['/brief', 'brief'],
    implement: ['copilot', 'implement', 'code'],
    review: ['/review', 'review'],
    commit: ['/git-commit', 'git commit', 'commit'],
  };

  const lowerCommand = command.toLowerCase();
  return patterns[step].some((pattern) => lowerCommand.includes(pattern));
}

/**
 * Auto-fill command for a given step
 */
export function getCommandForStep(
  step: LoopStep,
  activeTaskId?: string | null
): string {
  const commands: Record<LoopStep, string> = {
    start: '/start',
    view_tasks: '/tasks',
    select_task: '/next',
    generate_brief: activeTaskId ? `/brief ${activeTaskId}` : '/brief [Task ID]',
    implement: 'Switch to VS Code and use Copilot',
    review: '/review',
    commit: '/git-commit',
  };

  return commands[step];
}

/**
 * Get next step in the loop
 */
export function getNextStep(
  currentStep: LoopStep | null,
  completedSteps: LoopStep[]
): LoopStep | null {
  const allSteps: LoopStep[] = [
    'start',
    'view_tasks',
    'select_task',
    'generate_brief',
    'implement',
    'review',
    'commit',
  ];

  if (!currentStep) {
    return 'start';
  }

  const currentIndex = allSteps.indexOf(currentStep);
  if (currentIndex === -1) {
    return 'start';
  }

  // Find next incomplete step
  for (let i = currentIndex + 1; i < allSteps.length; i++) {
    if (!completedSteps.includes(allSteps[i])) {
      return allSteps[i];
    }
  }

  // All steps completed, start new loop
  return 'start';
}

/**
 * Check if we should advance to next step
 */
export function shouldAdvanceStep(
  currentStep: LoopStep,
  context: LoopDetectionContext
): boolean {
  switch (currentStep) {
    case 'start':
      return context.hasPendingTasks || context.hasActiveTask;
    case 'view_tasks':
      return context.hasActiveTask;
    case 'select_task':
      return context.briefGenerated;
    case 'generate_brief':
      return context.terminalActive && context.lastCommand?.includes('copilot');
    case 'implement':
      return context.lastCommand?.includes('/review') ?? false;
    case 'review':
      return context.hasRecentCommit;
    case 'commit':
      return true; // After commit, loop restarts
    default:
      return false;
  }
}

