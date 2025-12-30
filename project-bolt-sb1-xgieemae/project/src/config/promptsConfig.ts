/**
 * Centralized Prompt Configuration
 * 
 * Single source of truth for all prompts used in the Orbit application.
 * Prompts are organized by category and can be filtered/searched in the Prompt Library.
 */

export interface PromptDefinition {
  title: string;
  content: string;
  category: string;
  is_favorite: boolean;
  source?: 'taskmaster-guide' | 'vibe-coding-guide' | 'comprehensive-guide' | 'built-in';
}

export type PromptCategory = 
  | 'prd' 
  | 'taskmaster' 
  | 'bolt' 
  | 'review' 
  | 'testing' 
  | 'refactor' 
  | 'debugging' 
  | 'optimization' 
  | 'context' 
  | 'implementation';

export const PROMPT_CATEGORIES: Record<PromptCategory, string> = {
  prd: 'PRD & Requirements',
  taskmaster: 'TaskMaster',
  bolt: 'Bolt.new',
  review: 'Code Review',
  testing: 'Testing',
  refactor: 'Refactoring',
  debugging: 'Debugging',
  optimization: 'Optimization',
  context: 'Context',
  implementation: 'Implementation',
};

/**
 * Default prompts that are seeded into the database for new users.
 * These come from the TaskMaster guide, Vibe Coding guide, and built-in patterns.
 */
export const DEFAULT_PROMPTS: PromptDefinition[] = [
  // ============================================================================
  // PRD & Requirements Category
  // ============================================================================
  {
    title: 'Create Functional Requirements',
    content:
      'I would like to create concise functional requirements for the following application:\n\n[DESCRIBE YOUR APP]\n\nBe sure to include:\n- App name\n- Tech stack\n- Core features\n- Database needs\n- API integrations\n- Design style\n- Things NOT to build\n- Ask it to research a comparable, existing app (if applicable)\n\nOutput as markdown code.',
    category: 'prd',
    is_favorite: true,
    source: 'taskmaster-guide',
  },
  {
    title: 'Generate PRD from Requirements',
    content:
      'You are an expert technical product manager specializing in feature development and creating comprehensive product requirements documents (PRDs). Your task is to generate a detailed and well-structured PRD based on the following instructions:\n\n<prd_instructions>\n{{PRD_INSTRUCTIONS}}\n</prd_instructions>\n\nFollow these steps to create the PRD:\n\n1. Begin with a brief overview explaining the project and the purpose of the document.\n\n2. Use sentence case for all headings except for the title of the document, which should be in title case.\n\n3. Organize your PRD into the following sections:\n   a. Introduction\n   b. Product Overview\n   c. Goals and Objectives\n   d. Target Audience\n   e. Features and Requirements\n   f. User Stories and Acceptance Criteria\n   g. Technical Requirements / Stack\n   h. Design and User Interface\n\n4. For each section, provide detailed and relevant information based on the PRD instructions. Ensure that you:\n   - Use clear and concise language\n   - Provide specific details and metrics where required\n   - Maintain consistency throughout the document\n   - Address all points mentioned in each section\n\n5. When creating user stories and acceptance criteria:\n   - List ALL necessary user stories including primary, alternative, and edge-case scenarios\n   - Assign a unique requirement ID (e.g., ST-101) to each user story for direct traceability\n   - Include at least one user story specifically for secure access or authentication if the application requires user identification\n   - Include at least one user story specifically for Database modelling if the application requires a database\n   - Ensure no potential user interaction is omitted\n   - Make sure each user story is testable\n\n6. Format your PRD professionally:\n   - Use consistent styles\n   - Include numbered sections and subsections\n   - Use bullet points and tables where appropriate to improve readability\n   - Ensure proper spacing and alignment throughout the document\n\n7. Review your PRD to ensure all aspects of the project are covered comprehensively and that there are no contradictions or ambiguities.\n\nPresent your final PRD within <PRD> tags. Begin with the title of the document in title case, followed by each section with its corresponding content. Use appropriate subheadings within each section as needed.\n\nRemember to tailor the content to the specific project described in the PRD instructions, providing detailed and relevant information for each section based on the given context.',
    category: 'prd',
    is_favorite: true,
    source: 'taskmaster-guide',
  },
  {
    title: 'Feature Specification Pattern',
    content:
      '## Feature Specification: [FEATURE_NAME]\n\n## User Story\nAs a [user type], I want to [action] so that [benefit].\n\n## Acceptance Criteria\n- [ ] [Specific testable requirement]\n- [ ] [Specific testable requirement]\n- [ ] [Specific testable requirement]',
    category: 'prd',
    is_favorite: true,
    source: 'built-in',
  },

  // ============================================================================
  // TaskMaster Category
  // ============================================================================
  {
    title: 'Parse PRD & Create Tasks',
    content:
      "I've initialized a new project with Claude Task Master. I have a PRD at scripts/prd.txt.\nCan you parse it and set up initial tasks?",
    category: 'taskmaster',
    is_favorite: true,
    source: 'taskmaster-guide',
  },
  {
    title: 'Show All Tasks',
    content: 'Show tasks',
    category: 'taskmaster',
    is_favorite: false,
    source: 'taskmaster-guide',
  },
  {
    title: 'Get Next Task',
    content:
      "What's the next task I should work on? Please consider dependencies and priorities.",
    category: 'taskmaster',
    is_favorite: true,
    source: 'taskmaster-guide',
  },
  {
    title: 'Analyze Task Complexity',
    content:
      'Can you analyze the complexity of our tasks to help me understand which ones need to be broken down further?',
    category: 'taskmaster',
    is_favorite: true,
    source: 'taskmaster-guide',
  },
  {
    title: 'Break Down Complex Tasks',
    content:
      'Can you help me break down all of the high complexity tasks?',
    category: 'taskmaster',
    is_favorite: false,
    source: 'taskmaster-guide',
  },
  {
    title: 'Break Down Individual Task',
    content:
      'Task [TASK_NUMBER] seems complex. Can you break it down into subtasks?',
    category: 'taskmaster',
    is_favorite: false,
    source: 'taskmaster-guide',
  },
  {
    title: 'Add New Task',
    content:
      "Let's add a new task. We should implement [FEATURE_NAME].\nHere are the requirements:\n\n- Requirement 1\n- Requirement 2\n- Requirement 3",
    category: 'taskmaster',
    is_favorite: false,
    source: 'taskmaster-guide',
  },
  {
    title: 'Implement Task',
    content:
      'Implement task [TASK_NUMBER] and all of its subtasks.',
    category: 'taskmaster',
    is_favorite: true,
    source: 'taskmaster-guide',
  },
  {
    title: 'Implement Subtask',
    content:
      'Implement subtask [TASK_NUMBER].[SUBTASK_NUMBER]',
    category: 'taskmaster',
    is_favorite: false,
    source: 'taskmaster-guide',
  },
  {
    title: 'Update Task',
    content:
      'There should be a change in the [TASK_NAME] task.\nCan you update task [TASK_NUMBER] with this and set it back to pending?\n\n[DESCRIBE THE CHANGE]',
    category: 'taskmaster',
    is_favorite: false,
    source: 'taskmaster-guide',
  },
  {
    title: 'Remove Task',
    content:
      'Task [TASK_NUMBER] is not needed anymore. You can remove it.',
    category: 'taskmaster',
    is_favorite: false,
    source: 'taskmaster-guide',
  },

  // ============================================================================
  // Bolt.new Category
  // ============================================================================
  {
    title: 'Bolt.new Prompt Generator',
    content:
      'You are an expert at creating optimized prompts for Bolt.new (an AI-powered development environment). Your task is to take the following project requirements and generate a comprehensive, well-structured prompt that will help Bolt.new\'s AI create an excellent MVP application.\n\n[PROJECT_REQUIREMENTS]\n\nGenerate a Bolt.new prompt that:\n- Is clear and specific\n- Includes all necessary technical details\n- Specifies the tech stack\n- Lists core features with acceptance criteria\n- Includes design preferences\n- Mentions what NOT to build\n\nOutput the prompt ready to paste into Bolt.new.',
    category: 'bolt',
    is_favorite: true,
    source: 'vibe-coding-guide',
  },

  // ============================================================================
  // Code Review Category
  // ============================================================================
  {
    title: 'Code Review',
    content:
      'Review the current code for:\n- Potential bugs or edge cases\n- Security vulnerabilities\n- Performance optimizations\n- Code quality and maintainability\n\nProvide specific suggestions for improvement.',
    category: 'review',
    is_favorite: true,
    source: 'built-in',
  },

  // ============================================================================
  // Testing Category
  // ============================================================================
  {
    title: 'Generate Comprehensive Tests',
    content:
      "Please create comprehensive tests for the current application:\n\n- Unit tests for core business logic functions\n- Integration tests for the main user workflows\n- Error handling tests for edge cases\n- Performance tests for file processing\n\nUse [your preferred testing framework] and include both positive and negative test cases.",
    category: 'testing',
    is_favorite: true,
    source: 'built-in',
  },
  {
    title: 'User Testing Script',
    content:
      '## User Test Script\n\n### Setup\n"I\'d like you to try using this tool. I\'m testing the tool, not you, so there are no wrong answers. Please think out loud as you use it."\n\n### Task\n"Your goal is to [REALISTIC TASK]. Take your time and let me know if anything is confusing."\n\n### Observation Points\n- Do they understand what the tool does?\n- Can they complete the primary task without help?\n- Where do they hesitate or show confusion?\n- What do they say out loud while using it?',
    category: 'testing',
    is_favorite: false,
    source: 'built-in',
  },

  // ============================================================================
  // Refactoring Category
  // ============================================================================
  {
    title: 'Refactor for Simplicity',
    content:
      "Refactor this code to be simpler and more maintainable:\n- Remove unnecessary complexity\n- Extract reusable functions\n- Improve naming\n- Add comments where logic isn't obvious\n\nKeep the same functionality.",
    category: 'refactor',
    is_favorite: false,
    source: 'built-in',
  },
  {
    title: 'Break Down Large File',
    content:
      'Break down this file into logical modules so it\'s easier to read.\nCreate directories if needed and move utils and interfaces to separate files, maintaining a domain-driven file structure.',
    category: 'refactor',
    is_favorite: false,
    source: 'taskmaster-guide',
  },

  // ============================================================================
  // Debugging Category
  // ============================================================================
  {
    title: 'Create Bug Fix Task',
    content:
      'The [FEATURE] is not working as expected. Create a new task to fix it:\n\n- Expected behavior: [WHAT SHOULD HAPPEN]\n- Actual behavior: [WHAT IS HAPPENING]\n- Steps to reproduce: [HOW TO TRIGGER THE BUG]\n\nRequirements for the fix:\n- [Requirement 1]\n- [Requirement 2]',
    category: 'debugging',
    is_favorite: true,
    source: 'taskmaster-guide',
  },
  {
    title: 'Add Error Handling',
    content:
      "Add comprehensive error handling:\n- Try-catch blocks where needed\n- User-friendly error messages\n- Logging for debugging\n- Graceful fallbacks\n\nEnsure the app doesn't crash on errors.",
    category: 'debugging',
    is_favorite: false,
    source: 'built-in',
  },

  // ============================================================================
  // Optimization Category
  // ============================================================================
  {
    title: 'Optimize Performance',
    content:
      'Analyze and optimize performance:\n- Identify bottlenecks\n- Reduce unnecessary renders/calculations\n- Implement caching where appropriate\n- Optimize database queries\n\nMeasure before and after.',
    category: 'optimization',
    is_favorite: false,
    source: 'built-in',
  },

  // ============================================================================
  // Context Category
  // ============================================================================
  {
    title: 'Analyze User Feedback',
    content:
      "Based on user testing, here's what I observed:\n\nUser 1: [Specific behaviors and comments]\nUser 2: [Specific behaviors and comments]\n\nCommon patterns:\n- [Issue that multiple users hit]\n- [Unexpected user behavior]\n\nPlease analyze this feedback and suggest:\n1. Critical UX improvements needed\n2. Changes to improve user success rate",
    category: 'context',
    is_favorite: false,
    source: 'built-in',
  },
  {
    title: 'Challenge My Assumptions',
    content:
      "I'm building [APP DESCRIPTION]. Before I start coding, please challenge my assumptions:\n\n**Problem:** [PROBLEM STATEMENT]\n**Target User:** [USER DESCRIPTION]\n**Why Software:** [WHY THIS NEEDS TO BE BUILT]\n\nAsk me tough questions about:\n- Is this the right problem to solve?\n- Are there existing solutions I'm missing?\n- What could go wrong with this approach?\n- What am I not considering?",
    category: 'context',
    is_favorite: true,
    source: 'built-in',
  },

  // ============================================================================
  // Implementation Category
  // ============================================================================
  {
    title: 'Implement Feature (Simple)',
    content:
      'I need to implement [SPECIFIC FEATURE].\n\nRequirements:\n- [Requirement 1]\n- [Requirement 2]\n- [Requirement 3]\n\nPlease analyze these requirements and suggest the simplest solution that works. Avoid over-engineering.',
    category: 'implementation',
    is_favorite: false,
    source: 'built-in',
  },
  {
    title: 'Implementation Options',
    content:
      'I need to implement [SPECIFIC FEATURE]. Please analyze these requirements and suggest 3 approaches:\n\nRequirements:\n- [List specific needs]\n\nFor each approach, explain:\n1. Implementation complexity\n2. User experience impact\n3. Maintenance considerations\n4. Pros and cons\n\nI\'ll choose one and you can implement it.',
    category: 'implementation',
    is_favorite: false,
    source: 'built-in',
  },
  {
    title: 'Context-Aware Modifications Pattern',
    content:
      'Looking at the current [component/file], I need to:\n[Specific change 1]\n[Specific change 2]\n[Specific change 3]\n\nPlease modify the existing code while maintaining the current patterns and style.',
    category: 'implementation',
    is_favorite: true,
    source: 'built-in',
  },

  // ============================================================================
  // Comprehensive Guide Prompts (Placeholders - to be extracted from PDF)
  // ============================================================================
  // TODO: Extract prompts from Comprehensive Guide to Vibe Coding using Claude Code.pdf
  // These placeholders should be replaced with actual prompts once the PDF is processed
  {
    title: '[Comprehensive Guide] Prompt 1',
    content:
      '[PLACEHOLDER] This prompt will be extracted from the Comprehensive Guide PDF. The extraction script needs to be run to populate this content.',
    category: 'implementation',
    is_favorite: false,
    source: 'comprehensive-guide',
  },
];

/**
 * Get prompts by category
 */
export function getPromptsByCategory(category: PromptCategory | 'all'): PromptDefinition[] {
  if (category === 'all') {
    return DEFAULT_PROMPTS;
  }
  return DEFAULT_PROMPTS.filter(p => p.category === category);
}

/**
 * Get prompts by source
 */
export function getPromptsBySource(source: PromptDefinition['source']): PromptDefinition[] {
  return DEFAULT_PROMPTS.filter(p => p.source === source);
}

/**
 * Search prompts by title or content
 */
export function searchPrompts(query: string): PromptDefinition[] {
  const lowerQuery = query.toLowerCase();
  return DEFAULT_PROMPTS.filter(
    p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery)
  );
}

