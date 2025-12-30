import type { TipVariant } from '../components/ui/TipCard';

export interface TipConfig {
  id: string;
  stage: string;
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
    variant: 'pro-tip',
    title: 'Be Specific, Not Generic',
    content: 'AI tools like Claude make thousands of micro-decisions based on your inputs. Vague descriptions like "make it user-friendly" lead to generic code. Instead, say "allow users to complete checkout in under 60 seconds with no more than 3 clicks."',
    dismissible: true,
  },
  {
    id: 'vision-incomplete-warning',
    stage: 'vision',
    variant: 'warning',
    title: 'Complete Your Foundation First',
    content: 'Before moving to coding, define your problem and target user clearly. Skipping this step is the #1 reason AI-assisted projects fail—the model forgets the "Why" while focusing on the "How."',
    dismissible: false,
  },
  {
    id: 'vision-challenge-prompt',
    stage: 'vision',
    variant: 'info',
    title: 'Challenge Your Assumptions',
    content: 'Use the AI Challenge step to stress-test your idea. Ask Claude or ChatGPT: "What are the 5 biggest risks with this approach?" Address gaps now before they become expensive problems.',
    dismissible: true,
  },
  {
    id: 'vision-no-empty-codebase',
    stage: 'vision',
    variant: 'warning',
    title: 'Start in Bolt.new First',
    content: 'The Vibe Coding guide strongly recommends starting your project in Bolt.new with Claude Code. This gives AI the context it needs from the start. After building your MVP in Bolt, download it to your local environment and continue in the Workbench.',
    dismissible: true,
    learnMoreUrl: 'https://bolt.new',
  },

  // ============================================
  // STRATEGY STAGE TIPS
  // ============================================
  {
    id: 'strategy-prd-first',
    stage: 'strategy',
    variant: 'info',
    title: 'PRD is Your Source of Truth',
    content: 'A good Product Requirements Document (PRD) becomes the foundation for all AI interactions. When you tell Claude "refer to the PRD," it can make better decisions aligned with your goals.',
    dismissible: true,
  },
  {
    id: 'strategy-taskmaster-setup',
    stage: 'strategy',
    variant: 'pro-tip',
    title: 'Parse PRD into Tasks',
    content: 'After creating your PRD, use TaskMaster to break it into manageable tasks. The key command is: "Parse the PRD and create initial tasks, focusing on MVP scope."',
    dismissible: true,
  },
  {
    id: 'strategy-json-parsing-workaround',
    stage: 'strategy',
    variant: 'warning',
    title: 'Claude Code JSON Parsing Issue',
    content: 'Claude Code may encounter a JSON parsing error when parsing PRD files directly. Workaround: Use Cursor (or another AI tool) to generate initial tasks from your PRD, then switch back to Claude Code for task implementation. This is a temporary limitation.',
    dismissible: true,
  },
  {
    id: 'strategy-claude-md',
    stage: 'strategy',
    variant: 'info',
    title: 'Create CLAUDE.md First',
    content: 'Run "claude > /init" in your project to auto-generate CLAUDE.md, or download from Foundation. This file tells Claude your tech stack, coding conventions, and project structure.',
    dismissible: true,
    learnMoreUrl: 'https://docs.anthropic.com/claude/docs/claude-code',
  },
  {
    id: 'strategy-prep-codebase',
    stage: 'strategy',
    variant: 'warning',
    title: 'Use Bolt.new for Initial Setup',
    content: 'Start your project in Bolt.new using the Bolt Launcher tab. Generate your MVP prompt, paste it into Claude Code in Bolt, and let it build your initial codebase. This avoids the "empty project" problem and gives you a working foundation to iterate on.',
    dismissible: true,
    learnMoreUrl: 'https://bolt.new',
  },
  {
    id: 'strategy-bolt-download',
    stage: 'strategy',
    variant: 'info',
    title: 'Download from Bolt to Local',
    content: 'After building your MVP in Bolt.new, use the download button to get your project files. Extract them to your local environment, then open the Workbench stage to continue development with TaskMaster and Claude Code locally.',
    dismissible: true,
  },
  {
    id: 'strategy-complexity-analysis',
    stage: 'strategy',
    variant: 'pro-tip',
    title: 'Analyze Task Complexity',
    content: 'After parsing your PRD, ask Claude: "Can you analyze the complexity of our tasks?" High-complexity tasks should be broken into smaller subtasks for better AI output.',
    dismissible: true,
  },
  {
    id: 'strategy-commit-often',
    stage: 'strategy',
    variant: 'warning',
    title: 'Commit After Every Task',
    content: 'Claude Code doesn\'t auto-checkpoint. Use git commit after each completed task so you can rollback if something breaks. Your future self will thank you.',
    dismissible: true,
  },

  // ============================================
  // WORKBENCH STAGE TIPS
  // ============================================
  {
    id: 'workbench-task-breakdown',
    stage: 'workbench',
    variant: 'pro-tip',
    title: 'Break Down Complex Tasks',
    content: 'If a task feels too big, it probably is. Use "Analyze complexity of tasks" to identify high-complexity items, then "Break down task X into subtasks." Smaller tasks = better AI output.',
    dismissible: true,
  },
  {
    id: 'workbench-context-management',
    stage: 'workbench',
    variant: 'info',
    title: 'Context is King',
    content: 'AI models have limited context windows. Before starting a task, clip relevant context (Vision, User Profile, current task) and paste it into your AI conversation. Don\'t assume the AI remembers previous sessions.',
    dismissible: true,
  },
  {
    id: 'workbench-one-task-at-time',
    stage: 'workbench',
    variant: 'warning',
    title: 'One Task at a Time',
    content: 'Don\'t ask the AI to implement multiple features at once. Complete one task, verify it works, commit your code, then move to the next. This prevents cascading errors and makes debugging easier.',
    dismissible: true,
  },
  {
    id: 'workbench-file-size-warning',
    stage: 'workbench',
    variant: 'warning',
    title: 'Keep Files Under 500 Lines',
    content: 'AI is not great at handling large files. If you have a file larger than 500 lines, ask Claude to break it down into logical modules. Smaller files = better AI comprehension and fewer mistakes.',
    dismissible: true,
  },
  {
    id: 'workbench-backend-disconnected',
    stage: 'workbench',
    variant: 'warning',
    title: 'Terminal Backend Not Connected',
    content: 'The terminal is in simulated mode. For real command execution and TaskMaster sync, start the backend server: cd server && npm install && npm run dev',
    dismissible: true,
  },
  {
    id: 'workbench-bug-as-task',
    stage: 'workbench',
    variant: 'pro-tip',
    title: 'Log Bugs as Tasks',
    content: 'When you find a bug, don\'t just fix it inline. Create a new task: "Fix [bug description] - expected behavior: X, actual behavior: Y." This ensures proper tracking and helps AI understand the full context.',
    dismissible: true,
  },
  {
    id: 'workbench-iterative-loop',
    stage: 'workbench',
    variant: 'info',
    title: 'Follow the Development Loop',
    content: 'The TaskMaster workflow is iterative: Review Tasks → Select Next → Refresh Context → Implement → Smoke Test → Commit → Repeat. Each iteration builds on the last.',
    dismissible: true,
  },
  {
    id: 'workbench-context-refresh',
    stage: 'workbench',
    variant: 'pro-tip',
    title: 'Refresh Context Before Implementing',
    content: 'AI models forget context between sessions. Before starting any task, use the Context Clipper to copy your project vision, user profile, and current task. Paste this into your AI conversation to set the stage.',
    dismissible: true,
  },
  {
    id: 'workbench-smoke-test-pattern',
    stage: 'workbench',
    variant: 'warning',
    title: 'Always Smoke Test',
    content: 'After each task implementation, verify the feature works: test the happy path, check edge cases, and try it on mobile if it\'s UI. Don\'t move to the next task until the current one actually works.',
    dismissible: true,
  },
  {
    id: 'workbench-iterate-outputs',
    stage: 'workbench',
    variant: 'pro-tip',
    title: 'Iterate, Don\'t Accept First Output',
    content: 'The magic happens in iteration rounds 2-3. When Claude gives you working code, ask: "Can you improve this?" or "What edge cases might we be missing?" The first output is a draft, not the final answer.',
    dismissible: true,
  },
  {
    id: 'workbench-collaborator-not-search',
    stage: 'workbench',
    variant: 'info',
    title: 'Collaborate, Don\'t Just Search',
    content: 'Claude is a collaborator, not a search engine. Don\'t just ask questions—guide the conversation. Share your reasoning, explain constraints, and iterate together. "Help me think through X" beats "What is X?"',
    dismissible: true,
  },
  {
    id: 'workbench-simplest-first',
    stage: 'workbench',
    variant: 'warning',
    title: 'Start Simple, Add Complexity Later',
    content: 'Ask for "the simplest solution that works" first. Over-engineering from the start leads to bloated code and harder debugging. Get a working MVP, then iterate toward sophistication.',
    dismissible: true,
  },
  {
    id: 'workbench-refactor-after-feature',
    stage: 'workbench',
    variant: 'pro-tip',
    title: 'Refactor After Major Features',
    content: 'After completing a major feature, ask Claude to refactor and clean up. Say: "Review this code for clarity, remove duplication, and improve naming." Ignoring code quality creates tech debt fast.',
    dismissible: true,
  },

  // ============================================
  // TESTING STAGE TIPS
  // ============================================
  {
    id: 'testing-validate-before-deploy',
    stage: 'testing',
    variant: 'warning',
    title: 'Validate Before You Deploy',
    content: 'AI-generated code can have subtle bugs. Run through the validation checklist before deployment: Does it match acceptance criteria? Did you test edge cases? Does it work on mobile?',
    dismissible: true,
  },
  {
    id: 'testing-user-testing',
    stage: 'testing',
    variant: 'info',
    title: 'Real User Testing',
    content: 'Your software works on your machine—but does it work for your target user? Get at least 3 people matching your user persona to test. Watch them use it without helping.',
    dismissible: true,
  },
  {
    id: 'testing-checklist-complete',
    stage: 'testing',
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
    variant: 'info',
    title: 'MCP Servers Enhance Claude',
    content: 'Model Context Protocol servers give Claude superpowers: file access, memory, web search, and TaskMaster integration. Each server you configure unlocks new capabilities.',
    dismissible: true,
  },
  {
    id: 'settings-project-files',
    stage: 'settings',
    variant: 'pro-tip',
    title: 'Generate Project Files',
    content: 'Use the Project Files wizard to generate CLAUDE.md and .cursorrules files. These files help AI assistants understand your project\'s coding standards and architecture.',
    dismissible: true,
  },

];

/**
 * Get tips for a specific stage
 */
export function getTipsForStage(
  stage: string,
  options?: {
    excludeIds?: string[];
  }
): TipConfig[] {
  const { excludeIds = [] } = options || {};
  
  return STAGE_TIPS.filter((tip) => {
    if (tip.stage !== stage) return false;
    if (excludeIds.includes(tip.id)) return false;
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

