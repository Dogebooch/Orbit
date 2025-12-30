/**
 * Tech stack templates and file generators for CLAUDE.md, .cursorrules, and copilot-instructions.md
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TechStackTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  languages: string[];
  frameworks: string[];
  styling: string[];
  testing: string[];
  buildTools: string[];
  boltCompatible?: boolean;
  defaultCodingStandards: CodingStandards;
}

export interface CodingStandards {
  typescript: boolean;
  strictMode: boolean;
  preferFunctional: boolean;
  namingConvention: 'camelCase' | 'snake_case' | 'PascalCase';
  importOrder: string[];
  maxFileLength: number;
  testingApproach: 'unit' | 'integration' | 'e2e' | 'all';
  documentationLevel: 'minimal' | 'moderate' | 'comprehensive';
  errorHandling: 'basic' | 'comprehensive';
}

export interface AIInstructions {
  communicationStyle: 'concise' | 'detailed' | 'educational';
  codeExamples: boolean;
  askClarifyingQuestions: boolean;
  suggestImprovements: boolean;
  followExistingPatterns: boolean;
  preferSimpleSolutions: boolean;
  customInstructions: string;
}

export interface ProjectConfig {
  id: string;
  projectId: string;
  techStack: TechStackTemplate;
  codingStandards: CodingStandards;
  aiInstructions: AIInstructions;
  customSections: Record<string, string>;
  generatedAt: string;
  foundationDataHash: string;
}

export interface GeneratedFile {
  filename: string;
  content: string;
  description: string;
}

// ============================================
// TECH STACK TEMPLATES
// ============================================

export const TECH_STACK_TEMPLATES: TechStackTemplate[] = [
  {
    id: 'react-ts-vite',
    name: 'React + TypeScript + Vite',
    description: 'Modern React setup with TypeScript, Vite bundler, and Tailwind CSS',
    icon: '⚛️',
    languages: ['TypeScript', 'JavaScript'],
    frameworks: ['React 18', 'Vite'],
    styling: ['Tailwind CSS', 'CSS Modules'],
    testing: ['Vitest', 'React Testing Library'],
    buildTools: ['Vite', 'ESLint', 'Prettier'],
    boltCompatible: true,
    defaultCodingStandards: {
      typescript: true,
      strictMode: true,
      preferFunctional: true,
      namingConvention: 'camelCase',
      importOrder: ['react', 'third-party', 'local-components', 'local-utils', 'styles'],
      maxFileLength: 300,
      testingApproach: 'unit',
      documentationLevel: 'moderate',
      errorHandling: 'comprehensive',
    },
  },
  {
    id: 'nextjs-ts',
    name: 'Next.js + TypeScript',
    description: 'Full-stack React framework with server components and API routes',
    icon: '▲',
    languages: ['TypeScript', 'JavaScript'],
    frameworks: ['Next.js 14', 'React 18'],
    styling: ['Tailwind CSS', 'CSS Modules'],
    testing: ['Jest', 'React Testing Library', 'Playwright'],
    buildTools: ['Next.js CLI', 'ESLint', 'Prettier'],
    boltCompatible: true,
    defaultCodingStandards: {
      typescript: true,
      strictMode: true,
      preferFunctional: true,
      namingConvention: 'camelCase',
      importOrder: ['react', 'next', 'third-party', 'components', 'lib', 'styles'],
      maxFileLength: 250,
      testingApproach: 'all',
      documentationLevel: 'moderate',
      errorHandling: 'comprehensive',
    },
  },
  {
    id: 'python-fastapi',
    name: 'Python + FastAPI',
    description: 'High-performance Python API with automatic OpenAPI docs',
    icon: '🐍',
    languages: ['Python 3.11+'],
    frameworks: ['FastAPI', 'Pydantic'],
    styling: [],
    testing: ['pytest', 'pytest-asyncio'],
    buildTools: ['Poetry', 'Ruff', 'mypy'],
    boltCompatible: false,
    defaultCodingStandards: {
      typescript: false,
      strictMode: true,
      preferFunctional: false,
      namingConvention: 'snake_case',
      importOrder: ['stdlib', 'third-party', 'local'],
      maxFileLength: 400,
      testingApproach: 'unit',
      documentationLevel: 'comprehensive',
      errorHandling: 'comprehensive',
    },
  },
  {
    id: 'node-express-ts',
    name: 'Node.js + Express + TypeScript',
    description: 'Backend API with Express.js and TypeScript',
    icon: '🟢',
    languages: ['TypeScript', 'JavaScript'],
    frameworks: ['Express.js', 'Node.js 20+'],
    styling: [],
    testing: ['Jest', 'Supertest'],
    buildTools: ['tsup', 'ESLint', 'Prettier'],
    boltCompatible: false,
    defaultCodingStandards: {
      typescript: true,
      strictMode: true,
      preferFunctional: true,
      namingConvention: 'camelCase',
      importOrder: ['node', 'third-party', 'local'],
      maxFileLength: 300,
      testingApproach: 'integration',
      documentationLevel: 'moderate',
      errorHandling: 'comprehensive',
    },
  },
  {
    id: 'custom',
    name: 'Custom Stack',
    description: 'Start from scratch and define your own tech stack',
    icon: '🛠️',
    languages: [],
    frameworks: [],
    styling: [],
    testing: [],
    buildTools: [],
    boltCompatible: false,
    defaultCodingStandards: {
      typescript: true,
      strictMode: true,
      preferFunctional: true,
      namingConvention: 'camelCase',
      importOrder: [],
      maxFileLength: 300,
      testingApproach: 'unit',
      documentationLevel: 'moderate',
      errorHandling: 'basic',
    },
  },
];

// ============================================
// DEFAULT AI INSTRUCTIONS
// ============================================

export const DEFAULT_AI_INSTRUCTIONS: AIInstructions = {
  communicationStyle: 'concise',
  codeExamples: true,
  askClarifyingQuestions: true,
  suggestImprovements: true,
  followExistingPatterns: true,
  preferSimpleSolutions: true,
  customInstructions: '',
};

// ============================================
// FILE GENERATORS
// ============================================

interface GeneratorContext {
  projectName: string;
  projectDescription: string;
  targetUser: string;
  techStack: TechStackTemplate;
  codingStandards: CodingStandards;
  aiInstructions: AIInstructions;
  vision?: {
    problem: string;
    targetUser: string;
    successMetrics: string;
  };
  userProfile?: {
    primaryUser: string;
    goal: string;
    technicalComfort: string;
  };
}

/**
 * Generate CLAUDE.md content
 */
export function generateClaudeMd(ctx: GeneratorContext): string {
  const sections: string[] = [];

  // Project Overview
  sections.push(`# Project Guidelines for Claude

## Project Overview
${ctx.projectDescription || ctx.projectName}
`);

  // Target User
  if (ctx.vision?.targetUser || ctx.userProfile?.primaryUser) {
    sections.push(`## Target User
${ctx.vision?.targetUser || ctx.userProfile?.primaryUser}
${ctx.userProfile?.technicalComfort ? `\n**Technical Comfort:** ${ctx.userProfile.technicalComfort}` : ''}
`);
  }

  // Technical Stack
  sections.push(`## Technical Stack
${ctx.techStack.languages.length > 0 ? `- **Languages**: ${ctx.techStack.languages.join(', ')}` : ''}
${ctx.techStack.frameworks.length > 0 ? `- **Frameworks**: ${ctx.techStack.frameworks.join(', ')}` : ''}
${ctx.techStack.styling.length > 0 ? `- **Styling**: ${ctx.techStack.styling.join(', ')}` : ''}
${ctx.techStack.testing.length > 0 ? `- **Testing**: ${ctx.techStack.testing.join(', ')}` : ''}
${ctx.techStack.buildTools.length > 0 ? `- **Build Tools**: ${ctx.techStack.buildTools.join(', ')}` : ''}
`);

  // Coding Standards
  sections.push(`## Coding Standards
${ctx.codingStandards.typescript ? '- Use TypeScript for all new files' : '- JavaScript is the primary language'}
${ctx.codingStandards.strictMode ? '- Enable strict mode' : ''}
${ctx.codingStandards.preferFunctional ? '- Prefer functional components and patterns' : '- Use class-based patterns where appropriate'}
- Naming convention: ${ctx.codingStandards.namingConvention}
- Keep files under ${ctx.codingStandards.maxFileLength} lines when possible
- Documentation level: ${ctx.codingStandards.documentationLevel}
- Error handling: ${ctx.codingStandards.errorHandling}
`);

  // Import Order
  if (ctx.codingStandards.importOrder.length > 0) {
    sections.push(`## Import Order
\`\`\`
${ctx.codingStandards.importOrder.map((item, i) => `${i + 1}. ${item}`).join('\n')}
\`\`\`
`);
  }

  // AI Instructions
  sections.push(`## AI Instructions

### Communication Style
${ctx.aiInstructions.communicationStyle === 'concise' ? '- Be concise and direct in explanations' : ''}
${ctx.aiInstructions.communicationStyle === 'detailed' ? '- Provide detailed explanations with context' : ''}
${ctx.aiInstructions.communicationStyle === 'educational' ? '- Explain concepts in an educational manner, helping the developer learn' : ''}

### Behavior
${ctx.aiInstructions.codeExamples ? '- Provide code examples when explaining concepts' : '- Focus on explanations without excessive code examples'}
${ctx.aiInstructions.askClarifyingQuestions ? '- Ask clarifying questions if requirements are ambiguous' : '- Make reasonable assumptions if requirements are unclear'}
${ctx.aiInstructions.suggestImprovements ? '- Suggest improvements but don\'t implement without approval' : '- Only implement what is explicitly requested'}
${ctx.aiInstructions.followExistingPatterns ? '- Follow existing patterns in the codebase' : '- Introduce better patterns when beneficial'}
${ctx.aiInstructions.preferSimpleSolutions ? '- Start with the simplest solution that works' : '- Optimize for robustness from the start'}
`);

  // Custom Instructions
  if (ctx.aiInstructions.customInstructions) {
    sections.push(`### Additional Instructions
${ctx.aiInstructions.customInstructions}
`);
  }

  // Problem Solving Approach
  sections.push(`## Problem Solving Approach
1. **Start simple** - Implement the simplest solution that works first
2. **Iterate** - Add complexity only when specifically requested
3. **Highlight issues** - Point out potential edge cases or problems
4. **Suggest tests** - Recommend testing approaches for new features
5. **Ask questions** - Clarify ambiguous requirements before implementing
`);

  // What NOT to do
  sections.push(`## What NOT To Do
- Don't add features beyond what was explicitly requested
- Don't refactor code unless asked
- Don't create abstractions for one-time operations
${ctx.codingStandards.typescript ? '- Don\'t use `any` type without documented justification' : ''}
- Don't bypass existing patterns without discussion
`);

  return sections.join('\n').trim();
}

/**
 * Generate .cursorrules content
 */
export function generateCursorrules(ctx: GeneratorContext): string {
  const sections: string[] = [];

  sections.push(`# ${ctx.projectName} - Cursor Rules

## Project Overview
${ctx.projectDescription || 'A software project built with AI assistance.'}
`);

  if (ctx.vision?.problem) {
    sections.push(`## Problem Being Solved
${ctx.vision.problem}
`);
  }

  if (ctx.userProfile?.primaryUser) {
    sections.push(`## Target User
${ctx.userProfile.primaryUser}
${ctx.userProfile.goal ? `\n**Goal:** ${ctx.userProfile.goal}` : ''}
`);
  }

  // Technical Stack
  sections.push(`---

## Technical Stack
${ctx.techStack.languages.length > 0 ? `- **Languages**: ${ctx.techStack.languages.join(', ')}` : ''}
${ctx.techStack.frameworks.length > 0 ? `- **Frameworks**: ${ctx.techStack.frameworks.join(', ')}` : ''}
${ctx.techStack.styling.length > 0 ? `- **Styling**: ${ctx.techStack.styling.join(', ')}` : ''}
${ctx.techStack.testing.length > 0 ? `- **Testing**: ${ctx.techStack.testing.join(', ')}` : ''}
`);

  // Coding Standards
  sections.push(`---

## Coding Standards

### TypeScript/JavaScript
${ctx.codingStandards.typescript ? '- Use TypeScript for ALL new files' : '- JavaScript is acceptable'}
${ctx.codingStandards.strictMode ? '- Enable strict mode (already configured)' : ''}
${ctx.codingStandards.typescript ? '- Avoid `any` unless absolutely necessary - document why if used' : ''}
- Define interfaces for all props and data structures

### Patterns
${ctx.codingStandards.preferFunctional ? '- Use functional components exclusively' : '- Classes are acceptable where appropriate'}
- Keep components focused and single-responsibility
- Extract reusable logic into custom hooks when appropriate
`);

  // Import Order
  if (ctx.codingStandards.importOrder.length > 0) {
    sections.push(`### Imports
\`\`\`typescript
// Import order:
${ctx.codingStandards.importOrder.map((item, i) => `// ${i + 1}. ${item}`).join('\n')}
\`\`\`
`);
  }

  // Problem Solving
  sections.push(`---

## Problem Solving Approach

1. **Start simple** - Implement the simplest solution that works first
2. **Iterate** - Add complexity only when specifically requested
3. **Highlight issues** - Point out potential edge cases or problems
4. **Suggest tests** - Recommend testing approaches for new features
5. **Ask questions** - Clarify ambiguous requirements before implementing
`);

  // What NOT to do
  sections.push(`## What NOT To Do

- Don't use \`any\` type without documented justification
- Don't add external dependencies without discussion
- Don't break existing functionality
- Don't implement authentication changes without explicit approval
- Don't over-engineer simple solutions
`);

  // Custom Instructions
  if (ctx.aiInstructions.customInstructions) {
    sections.push(`---

## Additional Instructions
${ctx.aiInstructions.customInstructions}
`);
  }

  return sections.join('\n').trim();
}

/**
 * Generate .github/copilot-instructions.md content
 */
export function generateCopilotInstructions(ctx: GeneratorContext): string {
  const sections: string[] = [];

  sections.push(`# GitHub Copilot Instructions for ${ctx.projectName}

## Project Context
${ctx.projectDescription || 'A software project.'}
`);

  if (ctx.userProfile?.primaryUser) {
    sections.push(`## Target User
${ctx.userProfile.primaryUser}
`);
  }

  // Tech Stack Summary
  sections.push(`## Tech Stack
${ctx.techStack.languages.join(', ')}${ctx.techStack.frameworks.length > 0 ? ` with ${ctx.techStack.frameworks.join(', ')}` : ''}
`);

  // Code Generation Preferences
  sections.push(`## Code Generation Preferences

### Naming
- Use ${ctx.codingStandards.namingConvention} for variables and functions
${ctx.codingStandards.namingConvention === 'camelCase' ? '- Use PascalCase for components, classes, and types' : ''}

### Style
${ctx.codingStandards.typescript ? '- Always use TypeScript' : '- JavaScript is preferred'}
${ctx.codingStandards.preferFunctional ? '- Prefer functional patterns' : '- Class-based patterns are acceptable'}
- Keep functions under 50 lines when possible
- Add JSDoc comments for exported functions

### Patterns to Follow
${ctx.codingStandards.typescript ? '- Define proper TypeScript interfaces for all data structures' : ''}
- Use early returns to reduce nesting
- Handle errors explicitly
- Prefer async/await over raw Promises
`);

  // What to avoid
  sections.push(`## Avoid
- Magic numbers (use named constants)
- Deep nesting (max 3 levels)
- Overly complex one-liners
${ctx.codingStandards.typescript ? '- The `any` type' : ''}
- Console.log in production code
`);

  return sections.join('\n').trim();
}

/**
 * Generate all project files
 */
export function generateProjectFiles(ctx: GeneratorContext): GeneratedFile[] {
  return [
    {
      filename: 'CLAUDE.md',
      content: generateClaudeMd(ctx),
      description: 'Project guidelines for Claude Code and Claude Desktop',
    },
    {
      filename: '.cursorrules',
      content: generateCursorrules(ctx),
      description: 'Cursor IDE rules file for AI code generation',
    },
    {
      filename: '.github/copilot-instructions.md',
      content: generateCopilotInstructions(ctx),
      description: 'GitHub Copilot custom instructions',
    },
  ];
}

/**
 * Get a tech stack template by ID
 */
export function getTechStackById(id: string): TechStackTemplate | undefined {
  return TECH_STACK_TEMPLATES.find((t) => t.id === id);
}

/**
 * Hash foundation data for change detection
 */
export function hashFoundationData(vision: unknown, profile: unknown): string {
  const data = JSON.stringify({ vision, profile });
  // Simple hash for change detection
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Create default generator context with React + TypeScript + Vite stack
 */
export function createDefaultGeneratorContext(
  projectName: string,
  projectDescription: string,
  vision?: {
    problem: string;
    target_user: string;
    success_metrics: string;
  },
  userProfile?: {
    primary_user: string;
    goal: string;
    technical_comfort: string;
  }
): GeneratorContext {
  const defaultTechStack = TECH_STACK_TEMPLATES[0]; // React + TypeScript + Vite
  
  return {
    projectName,
    projectDescription,
    targetUser: vision?.target_user || userProfile?.primary_user || '',
    techStack: defaultTechStack,
    codingStandards: defaultTechStack.defaultCodingStandards,
    aiInstructions: DEFAULT_AI_INSTRUCTIONS,
    vision: vision ? {
      problem: vision.problem || '',
      targetUser: vision.target_user || '',
      successMetrics: vision.success_metrics || '',
    } : undefined,
    userProfile: userProfile ? {
      primaryUser: userProfile.primary_user || '',
      goal: userProfile.goal || '',
      technicalComfort: userProfile.technical_comfort || 'medium',
    } : undefined,
  };
}

