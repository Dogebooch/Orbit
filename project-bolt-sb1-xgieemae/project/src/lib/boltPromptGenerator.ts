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

type TechStack = string;

interface ResearchApp {
  name: string;
  what_does_well: string;
  what_does_poorly: string;
  key_insight: string;
}

interface ResearchData {
  apps: ResearchApp[];
  patterns_to_borrow: string;
  patterns_to_avoid: string;
  opportunity_gap: string;
}

interface BoltPromptData {
  projectName: string;
  vision: VisionData;
  userProfile: UserProfileData;
  features: Feature[];
  techStack: TechStack;
  outOfScope: string;
  research?: ResearchData;
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
    research,
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
${techStack || 'Not specified'}

## MVP Features (Priority Order)

${generateFeaturesSection(mvpFeatures)}

## Out of Scope (Do NOT Build)

${outOfScope || 'Not specified'}

${research ? generateResearchSection(research) : ''}

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
Stack: ${truncate(data.techStack, 80)}
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
 * Helper: Generate research section with competitive analysis
 */
function generateResearchSection(research: ResearchData): string {
  let section = '\n## Research & Preferences\n\n';

  if (research.apps && research.apps.length > 0) {
    section += '### Competitive Research\n\n';
    research.apps.forEach((app, index) => {
      section += `#### ${index + 1}. ${app.name}\n\n`;
      
      if (app.what_does_well) {
        section += `**What it does well:**\n${app.what_does_well}\n\n`;
      }
      
      if (app.what_does_poorly) {
        section += `**What it does poorly:**\n${app.what_does_poorly}\n\n`;
      }
      
      if (app.key_insight) {
        section += `**Key insight:** ${app.key_insight}\n\n`;
      }
    });
  }

  if (research.patterns_to_borrow) {
    section += `### Patterns to Borrow\n\n${research.patterns_to_borrow}\n\n`;
  }

  if (research.patterns_to_avoid) {
    section += `### Patterns to Avoid\n\n${research.patterns_to_avoid}\n\n`;
  }

  if (research.opportunity_gap) {
    section += `### Opportunity Gap\n\n${research.opportunity_gap}\n\n`;
  }

  section += '**How to use this research:**\n';
  section += '1. When implementing UI elements, check if any analyzed tool has a good solution and reference it explicitly\n';
  section += '2. Before finalizing any design, check the "Patterns to Avoid" list to avoid documented anti-patterns\n';
  section += '3. Consider whether your choices address the identified opportunity gap - that\'s your differentiator\n';
  section += '4. Combine the best elements from multiple tools rather than copying any single one\n';

  return section;
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

