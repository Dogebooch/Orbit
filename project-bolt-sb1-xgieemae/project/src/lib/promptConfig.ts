/**
 * Centralized prompt configuration for all AI help buttons
 * Each stage/screen has tailored prompts that are sent to Gemini CLI
 */

export type PromptContext = 
  | 'vision'
  | 'userProfile'
  | 'strategy'
  | 'workbench'
  | 'testing'
  | 'settings'
  | 'general';

export interface PromptConfig {
  context: PromptContext;
  basePrompt: string;
  getPrompt: (content?: string, additionalContext?: Record<string, unknown>) => string;
}

/**
 * Build a prompt for a specific context
 */
function buildPrompt(
  context: PromptContext,
  basePrompt: string,
  content?: string,
  additionalContext?: Record<string, unknown>
): string {
  const parts: string[] = [];

  // Add context-specific instructions
  parts.push(basePrompt);

  // Add content if provided
  if (content) {
    parts.push(`\n## Content to Review:\n${content}`);
  }

  // Add additional context if provided
  if (additionalContext) {
    parts.push(`\n## Additional Context:`);
    Object.entries(additionalContext).forEach(([key, value]) => {
      parts.push(`- ${key}: ${value}`);
    });
  }

  return parts.join('\n');
}

/**
 * Prompt configurations for each context
 */
export const promptConfigs: Record<PromptContext, PromptConfig> = {
  vision: {
    context: 'vision',
    basePrompt: `You are helping the user refine their project vision. Review the vision statement and provide specific, actionable feedback to help them:
- Clarify the problem statement
- Better define the target user
- Establish measurable success metrics
- Ensure the vision is specific and actionable`,
    getPrompt: (content, additionalContext) => 
      buildPrompt('vision', promptConfigs.vision.basePrompt, content, additionalContext),
  },

  userProfile: {
    context: 'userProfile',
    basePrompt: `You are helping the user create a detailed user profile. Review the profile and provide feedback to:
- Create a vivid persona with specific characteristics
- Identify clear pain points and frustrations
- Describe how the user works and their context
- Specify technical comfort level accurately`,
    getPrompt: (content, additionalContext) => 
      buildPrompt('userProfile', promptConfigs.userProfile.basePrompt, content, additionalContext),
  },

  strategy: {
    context: 'strategy',
    basePrompt: `You are helping the user plan their project strategy. Review their strategy and provide feedback to:
- Break down features into actionable tasks
- Identify dependencies between tasks
- Suggest prioritization based on value and dependencies
- Ensure tasks are specific and testable`,
    getPrompt: (content, additionalContext) => 
      buildPrompt('strategy', promptConfigs.strategy.basePrompt, content, additionalContext),
  },

  workbench: {
    context: 'workbench',
    basePrompt: `You are helping the user with their development workbench. Provide guidance on:
- Current task implementation
- Code quality and best practices
- Task dependencies and sequencing
- Integration with TaskMaster AI`,
    getPrompt: (content, additionalContext) => 
      buildPrompt('workbench', promptConfigs.workbench.basePrompt, content, additionalContext),
  },

  testing: {
    context: 'testing',
    basePrompt: `You are helping the user with testing and deployment. Provide guidance on:
- Test strategy and coverage
- Deployment considerations
- Quality assurance
- User acceptance testing`,
    getPrompt: (content, additionalContext) => 
      buildPrompt('testing', promptConfigs.testing.basePrompt, content, additionalContext),
  },

  settings: {
    context: 'settings',
    basePrompt: `You are helping the user configure their Orbit Mission Control settings. Provide guidance on:
- MCP server configuration
- Project file management
- Integration setup
- Best practices for configuration`,
    getPrompt: (content, additionalContext) => 
      buildPrompt('settings', promptConfigs.settings.basePrompt, content, additionalContext),
  },

  general: {
    context: 'general',
    basePrompt: `You are Jarvis, an AI assistant for Orbit Mission Control. Help the user with their question or request.`,
    getPrompt: (content, additionalContext) => 
      buildPrompt('general', promptConfigs.general.basePrompt, content, additionalContext),
  },
};

/**
 * Get a prompt for a specific context
 */
export function getPromptForContext(
  context: PromptContext,
  content?: string,
  additionalContext?: Record<string, unknown>
): string {
  const config = promptConfigs[context];
  return config.getPrompt(content, additionalContext);
}

/**
 * Get prompt for AI helper actions (suggestions, evaluate, improve)
 */
export function getHelperPrompt(
  action: 'suggestions' | 'evaluate' | 'improve',
  contentType: string,
  content: string
): string {
  const actionPrompts = {
    suggestions: `Review this ${contentType} and provide 3-5 specific, actionable suggestions for improvement. Focus on clarity, specificity, and actionability.`,
    evaluate: `Evaluate this ${contentType} for quality. Provide:
- A score from 1-10
- Key strengths
- Areas for improvement
- Overall feedback`,
    improve: `Improve this ${contentType} while maintaining its core intent. Make it clearer, more specific, and more actionable. Return only the improved version.`,
  };

  return `${actionPrompts[action]}\n\n## Content:\n${content}`;
}

