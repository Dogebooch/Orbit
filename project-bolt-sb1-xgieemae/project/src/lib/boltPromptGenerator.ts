/**
 * Bolt.new Prompt Generator
 * 
 * Generates comprehensive MVP prompts optimized for Claude Code in Bolt.new
 * Includes all project context: vision, user profile, features, tech stack
 */

interface VisionData {
  problem: string;
  target_user: string;
  success_metrics: string;
  why_software: string;
  target_level: string;
}

interface UserProfileData {
  primary_user: string;
  goal: string;
  context: string;
  frustrations: string;
  technical_comfort: string;
  time_constraints: string;
  persona_name: string;
  persona_role: string;
}

interface Feature {
  name: string;
  userStory: string;
  acceptanceCriteria: string[];
  priority: 'must-have' | 'should-have' | 'nice-to-have';
}

interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  deployment: string;
  additionalTools?: string;
}

interface BoltPromptData {
  projectName: string;
  vision: VisionData;
  userProfile: UserProfileData;
  features: Feature[];
  techStack: TechStack;
  outOfScope: string;
}

/**
 * Generates a comprehensive Bolt.new prompt for Claude Code
 */
export function generateBoltPrompt(data: BoltPromptData): string {
  const {
    projectName,
    vision,
    userProfile,
    features,
    techStack,
    outOfScope,
  } = data;

  // Filter must-have and should-have features for MVP
  const mvpFeatures = features.filter(
    (f) => f.priority === 'must-have' || f.priority === 'should-have'
  );

  const prompt = `# Build MVP: ${projectName}

## Project Vision

**Problem We're Solving:**
${vision.problem || 'Not specified'}

**Target User:**
${vision.target_user || 'Not specified'}

**Why Software?**
${vision.why_software || 'Not specified'}

**Success Metrics:**
${vision.success_metrics || 'Not specified'}

## User Persona

**Primary User:** ${userProfile.persona_name || 'User'} (${userProfile.persona_role || 'Role not specified'})

**User Goal:**
${userProfile.goal || 'Not specified'}

**Context:**
${userProfile.context || 'Not specified'}

**Key Frustrations:**
${userProfile.frustrations || 'Not specified'}

**Technical Comfort:** ${userProfile.technical_comfort || 'medium'}

## Technical Stack

Build this application using:
- **Frontend:** ${getTechStackLabel('frontend', techStack.frontend)}
- **Backend:** ${getTechStackLabel('backend', techStack.backend)}
- **Database:** ${getTechStackLabel('database', techStack.database)}
- **Deployment:** ${getTechStackLabel('deployment', techStack.deployment)}
${techStack.additionalTools ? `- **Additional Tools:** ${techStack.additionalTools}` : ''}

## MVP Features (Priority Order)

${generateFeaturesSection(mvpFeatures)}

## Out of Scope (Do NOT Build)

${outOfScope || 'Not specified'}

## Development Guidelines

1. **Start Simple:** Build the simplest version that solves the core problem
2. **User-Focused:** Every feature should directly support the user goal
3. **Clean Code:** Use TypeScript, follow best practices, include error handling
4. **Modern UI:** Clean, responsive design with good UX patterns
5. **Production Ready:** Include proper validation, loading states, and error messages

## Instructions for Claude Code

Please build this MVP application following these steps:

1. **Set up the project structure** with the specified tech stack
2. **Implement core features** in priority order (must-have first)
3. **Create a clean, modern UI** that matches the user persona's technical comfort level
4. **Add proper error handling** and loading states
5. **Include basic documentation** in a README.md

Focus on creating a working prototype that demonstrates the core value proposition. We can iterate and add more features later.

---

**Target Level:** ${vision.target_level === 'mvp' ? 'MVP (Minimum Viable Product)' : vision.target_level}
**Build Time Goal:** Complete functional prototype in one session
`;

  return prompt.trim();
}

/**
 * Generates a shortened version of the prompt for preview
 */
export function generateBoltPromptPreview(data: BoltPromptData): string {
  const mvpFeatureCount = data.features.filter(
    (f) => f.priority === 'must-have' || f.priority === 'should-have'
  ).length;

  return `Build MVP: ${data.projectName}

Problem: ${truncate(data.vision.problem, 100)}
User: ${truncate(data.userProfile.primary_user, 80)}
Stack: ${getTechStackLabel('frontend', data.techStack.frontend)}
Features: ${mvpFeatureCount} MVP features defined

[Full prompt is ${Math.ceil(generateBoltPrompt(data).length / 1000)}k characters]`;
}

/**
 * Helper: Generate features section with proper formatting
 */
function generateFeaturesSection(features: Feature[]): string {
  if (features.length === 0) {
    return '(No features defined yet - add features in the PRD section)';
  }

  return features
    .map((feature, index) => {
      const priorityEmoji = {
        'must-have': '🔴',
        'should-have': '🟡',
        'nice-to-have': '🟢',
      }[feature.priority];

      let section = `### ${index + 1}. ${feature.name} ${priorityEmoji} ${feature.priority.toUpperCase()}`;

      if (feature.userStory) {
        section += `\n\n**User Story:**\n${feature.userStory}`;
      }

      if (feature.acceptanceCriteria && feature.acceptanceCriteria.length > 0) {
        section += `\n\n**Acceptance Criteria:**`;
        feature.acceptanceCriteria.forEach((criterion) => {
          section += `\n- ${criterion}`;
        });
      }

      return section;
    })
    .join('\n\n');
}

/**
 * Helper: Get human-readable tech stack labels
 */
function getTechStackLabel(category: string, value: string): string {
  const labels: Record<string, Record<string, string>> = {
    frontend: {
      'react-vite': 'React + TypeScript + Vite',
      'nextjs': 'Next.js + TypeScript',
      'vue': 'Vue 3 + TypeScript',
      'vanilla': 'Vanilla JavaScript',
    },
    backend: {
      'none': 'None (Client-only)',
      'supabase': 'Supabase (Backend-as-a-Service)',
      'nodejs': 'Node.js + Express',
      'edge': 'Edge Functions (Serverless)',
      'tauri': 'Tauri (Rust Backend)',
    },
    database: {
      'none': 'None',
      'supabase-postgres': 'Supabase PostgreSQL',
      'sqlite': 'SQLite',
      'sqlite-better': 'SQLite with better-sqlite3 (Node.js/Electron)',
      'sqlite-sqljs': 'SQLite with sql.js (Browser/WebAssembly)',
      'firebase': 'Firebase Firestore',
    },
    deployment: {
      'vercel': 'Vercel',
      'netlify': 'Netlify',
      'railway': 'Railway',
      'electron': 'Electron Desktop App',
      'local': 'Local Development Only',
    },
  };

  return labels[category]?.[value] || value;
}

/**
 * Helper: Truncate text with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Validates that required data is present for prompt generation
 */
export function validateBoltPromptData(data: BoltPromptData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.projectName || data.projectName.trim() === '') {
    errors.push('Project name is required');
  }

  if (!data.vision.problem || data.vision.problem.trim() === '') {
    errors.push('Vision: Problem statement is required');
  }

  if (!data.vision.target_user || data.vision.target_user.trim() === '') {
    errors.push('Vision: Target user is required');
  }

  if (!data.userProfile.primary_user || data.userProfile.primary_user.trim() === '') {
    errors.push('User Profile: Primary user is required');
  }

  if (!data.userProfile.goal || data.userProfile.goal.trim() === '') {
    errors.push('User Profile: User goal is required');
  }

  if (data.features.length === 0) {
    errors.push('At least one feature is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

