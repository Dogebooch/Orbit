import type { TipVariant } from '../components/ui/TipCard';

export type TipTrigger = 'always' | 'incomplete' | 'complete' | 'first-visit' | 'backend-disconnected';

export interface TipConfig {
  id: string;
  stage: string;
  trigger: TipTrigger;
  variant: TipVariant;
  title: string;
  content: string;
  dismissible?: boolean;
  learnMoreUrl?: string;
}

export const STAGE_TIPS: TipConfig[] = [
  // ============================================
  // FOUNDATION / VISION STAGE TIPS
  // ============================================
  {
    id: 'vision-specificity',
    stage: 'vision',
    trigger: 'always',
    variant: 'pro-tip',
    title: 'Be Specific, Not Generic',
    content: 'AI tools like Claude make thousands of micro-decisions based on your inputs. Vague descriptions like "make it user-friendly" lead to generic code. Instead, say "allow users to complete checkout in under 60 seconds with no more than 3 clicks."',
    dismissible: true,
  },
  {
    id: 'vision-incomplete-warning',
    stage: 'vision',
    trigger: 'incomplete',
    variant: 'warning',
    title: 'Complete Your Foundation First',
    content: 'Before moving to coding, define your problem and target user clearly. Skipping this step is the #1 reason AI-assisted projects fail—the model forgets the "Why" while focusing on the "How."',
    dismissible: false,
  },
  {
    id: 'vision-challenge-prompt',
    stage: 'vision',
    trigger: 'complete',
    variant: 'info',
    title: 'Challenge Your Assumptions',
    content: 'Use the AI Challenge step to stress-test your idea. Ask Claude or ChatGPT: "What are the 5 biggest risks with this approach?" Address gaps now before they become expensive problems.',
    dismissible: true,
  },
  {
    id: 'vision-no-empty-codebase',
    stage: 'vision',
    trigger: 'first-visit',
    variant: 'warning',
    title: 'Don\'t Start from an Empty Codebase',
    content: 'The guide strongly recommends NOT starting from scratch. Use a starter template (Bolt.new, create-next-app, etc.) to give the AI context to work with. Empty files lead to inconsistent patterns.',
    dismissible: true,
  },

  // ============================================
  // STRATEGY STAGE TIPS
  // ============================================
  {
    id: 'strategy-prd-first',
    stage: 'strategy',
    trigger: 'always',
    variant: 'info',
    title: 'PRD is Your Source of Truth',
    content: 'A good Product Requirements Document (PRD) becomes the foundation for all AI interactions. When you tell Claude "refer to the PRD," it can make better decisions aligned with your goals.',
    dismissible: true,
  },
  {
    id: 'strategy-taskmaster-setup',
    stage: 'strategy',
    trigger: 'incomplete',
    variant: 'pro-tip',
    title: 'Parse PRD into Tasks',
    content: 'After creating your PRD, use TaskMaster to break it into manageable tasks. The key command is: "Parse the PRD and create initial tasks, focusing on MVP scope."',
    dismissible: true,
  },

  // ============================================
  // WORKBENCH STAGE TIPS
  // ============================================
  {
    id: 'workbench-task-breakdown',
    stage: 'workbench',
    trigger: 'always',
    variant: 'pro-tip',
    title: 'Break Down Complex Tasks',
    content: 'If a task feels too big, it probably is. Use "Analyze complexity of tasks" to identify high-complexity items, then "Break down task X into subtasks." Smaller tasks = better AI output.',
    dismissible: true,
  },
  {
    id: 'workbench-context-management',
    stage: 'workbench',
    trigger: 'always',
    variant: 'info',
    title: 'Context is King',
    content: 'AI models have limited context windows. Before starting a task, clip relevant context (Vision, User Profile, current task) and paste it into your AI conversation. Don\'t assume the AI remembers previous sessions.',
    dismissible: true,
  },
  {
    id: 'workbench-one-task-at-time',
    stage: 'workbench',
    trigger: 'always',
    variant: 'warning',
    title: 'One Task at a Time',
    content: 'Don\'t ask the AI to implement multiple features at once. Complete one task, verify it works, commit your code, then move to the next. This prevents cascading errors and makes debugging easier.',
    dismissible: true,
  },
  {
    id: 'workbench-backend-disconnected',
    stage: 'workbench',
    trigger: 'backend-disconnected',
    variant: 'warning',
    title: 'Terminal Backend Not Connected',
    content: 'The terminal is in simulated mode. For real command execution and TaskMaster sync, start the backend server: cd server && npm install && npm run dev',
    dismissible: true,
  },
  {
    id: 'workbench-bug-as-task',
    stage: 'workbench',
    trigger: 'always',
    variant: 'pro-tip',
    title: 'Log Bugs as Tasks',
    content: 'When you find a bug, don\'t just fix it inline. Create a new task: "Fix [bug description] - expected behavior: X, actual behavior: Y." This ensures proper tracking and helps AI understand the full context.',
    dismissible: true,
  },

  // ============================================
  // TESTING STAGE TIPS
  // ============================================
  {
    id: 'testing-validate-before-deploy',
    stage: 'testing',
    trigger: 'always',
    variant: 'warning',
    title: 'Validate Before You Deploy',
    content: 'AI-generated code can have subtle bugs. Run through the validation checklist before deployment: Does it match acceptance criteria? Did you test edge cases? Does it work on mobile?',
    dismissible: true,
  },
  {
    id: 'testing-user-testing',
    stage: 'testing',
    trigger: 'always',
    variant: 'info',
    title: 'Real User Testing',
    content: 'Your software works on your machine—but does it work for your target user? Get at least 3 people matching your user persona to test. Watch them use it without helping.',
    dismissible: true,
  },
  {
    id: 'testing-checklist-complete',
    stage: 'testing',
    trigger: 'complete',
    variant: 'success',
    title: 'Ready for Launch!',
    content: 'You\'ve completed the validation checklist. Consider one final review of your deployment configuration before pushing to production.',
    dismissible: true,
  },

  // ============================================
  // PROMPT LIBRARY TIPS
  // ============================================
  {
    id: 'prompts-context-first',
    stage: 'prompts',
    trigger: 'always',
    variant: 'pro-tip',
    title: 'Always Include Context',
    content: 'When using prompts, prepend relevant context: your Vision, current task, and any constraints. A prompt without context is like asking for directions without saying where you are.',
    dismissible: true,
  },

  // ============================================
  // SETTINGS STAGE TIPS
  // ============================================
  {
    id: 'settings-mcp-value',
    stage: 'settings',
    trigger: 'first-visit',
    variant: 'info',
    title: 'MCP Servers Enhance Claude',
    content: 'Model Context Protocol servers give Claude superpowers: file access, memory, web search, and TaskMaster integration. Each server you configure unlocks new capabilities.',
    dismissible: true,
  },
  {
    id: 'settings-project-files',
    stage: 'settings',
    trigger: 'always',
    variant: 'pro-tip',
    title: 'Generate Project Files',
    content: 'Use the Project Files wizard to generate CLAUDE.md and .cursorrules files. These files help AI assistants understand your project\'s coding standards and architecture.',
    dismissible: true,
  },

  // ============================================
  // RESEARCH STAGE TIPS
  // ============================================
  {
    id: 'research-competitor-analysis',
    stage: 'research',
    trigger: 'always',
    variant: 'info',
    title: 'Learn from Competitors',
    content: 'Study 3-5 competing apps before building. Note what they do well (steal ideas!) and what frustrates users (your opportunity). Screenshots and notes here become valuable context for AI.',
    dismissible: true,
  },
];

/**
 * Get tips for a specific stage with optional trigger filtering
 */
export function getTipsForStage(
  stage: string,
  options?: {
    triggers?: TipTrigger[];
    excludeIds?: string[];
  }
): TipConfig[] {
  const { triggers, excludeIds = [] } = options || {};
  
  return STAGE_TIPS.filter((tip) => {
    if (tip.stage !== stage) return false;
    if (excludeIds.includes(tip.id)) return false;
    if (triggers && !triggers.includes(tip.trigger)) return false;
    return true;
  });
}

/**
 * Get a single tip by ID
 */
export function getTipById(id: string): TipConfig | undefined {
  return STAGE_TIPS.find((tip) => tip.id === id);
}

/**
 * Storage key for dismissed tips
 */
const DISMISSED_TIPS_KEY = 'orbit_dismissed_tips';

/**
 * Get list of dismissed tip IDs from localStorage
 */
export function getDismissedTips(): string[] {
  const stored = localStorage.getItem(DISMISSED_TIPS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Mark a tip as dismissed
 */
export function dismissTip(tipId: string): void {
  const dismissed = getDismissedTips();
  if (!dismissed.includes(tipId)) {
    dismissed.push(tipId);
    localStorage.setItem(DISMISSED_TIPS_KEY, JSON.stringify(dismissed));
  }
}

/**
 * Reset all dismissed tips (for testing or user preference)
 */
export function resetDismissedTips(): void {
  localStorage.removeItem(DISMISSED_TIPS_KEY);
}

