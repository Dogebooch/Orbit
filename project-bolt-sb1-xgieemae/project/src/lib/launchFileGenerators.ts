/**
 * Launch File Generators
 * 
 * Generates all the files and prompts needed for the Vibe Coding workflow:
 * - PRD Generator Prompt (for Claude/ChatGPT)
 * - Bolt Meta-Prompt (for Claude/ChatGPT to generate Bolt prompt)
 * - TaskMaster configuration files
 * - MCP server configuration
 */

// ============================================================================
// Types
// ============================================================================

export interface VisionData {
  problem: string;
  target_user: string;
  success_metrics: string;
  why_software: string;
  target_level: string;
}

export interface UserProfileData {
  primary_user: string;
  goal: string;
  context: string;
  frustrations: string;
  technical_comfort: string;
  persona_name: string;
  persona_role: string;
  competitor_notes?: string;
}

export interface Feature {
  id: string;
  name: string;
  userStory: string;
  priority: 'must_have' | 'should_have' | 'nice_to_have';
  acceptanceCriteria: string[];
}

export type TechStack = string;

export interface ProjectContext {
  projectName: string;
  vision: VisionData;
  userProfile: UserProfileData;
  features: Feature[];
  techStack: TechStack;
  outOfScope: string;
}

// ============================================================================
// PRD Generator Prompt
// Based on the Vibe Coding guide's PRD creation template
// ============================================================================

export function generatePRDPrompt(context: ProjectContext, copilotInstructions?: string): string {
  const { projectName, vision, userProfile, features, techStack, outOfScope } = context;

  // Format features into requirements list
  const mustHave = features.filter(f => f.priority === 'must_have' && f.name);
  const shouldHave = features.filter(f => f.priority === 'should_have' && f.name);
  const niceToHave = features.filter(f => f.priority === 'nice_to_have' && f.name);

  const formatFeatureForPRD = (f: Feature): string => {
    let text = `- ${f.name}`;
    if (f.userStory) {
      text += `\n  User Story: ${f.userStory}`;
    }
    if (f.acceptanceCriteria.filter(c => c).length > 0) {
      text += '\n  Acceptance Criteria:';
      f.acceptanceCriteria.filter(c => c).forEach(c => {
        text += `\n    - ${c}`;
      });
    }
    return text;
  };

  const featuresText = [
    mustHave.length > 0 ? `**Must Have (MVP):**\n${mustHave.map(formatFeatureForPRD).join('\n\n')}` : '',
    shouldHave.length > 0 ? `**Should Have:**\n${shouldHave.map(formatFeatureForPRD).join('\n\n')}` : '',
    niceToHave.length > 0 ? `**Nice to Have (Future):**\n${niceToHave.map(formatFeatureForPRD).join('\n\n')}` : '',
  ].filter(Boolean).join('\n\n');

  return `You are an expert technical product manager specializing in feature development and creating comprehensive product requirements documents (PRDs). Your task is to generate a detailed and well-structured PRD based on the following instructions:

<prd_instructions>
The app is called **${projectName}**.

## Problem Statement
${vision.problem || 'Not specified'}

## Target Audience
${vision.target_user || 'Not specified'}

## Why Software is the Solution
${vision.why_software || 'Not specified'}

## Success Metrics
${vision.success_metrics || 'Not specified'}

## User Persona
- **Name:** ${userProfile.persona_name || 'Primary User'}
- **Role:** ${userProfile.persona_role || 'End User'}
- **Primary User Type:** ${userProfile.primary_user || 'Not specified'}
- **Goal:** ${userProfile.goal || 'Not specified'}
- **Context of Use:** ${userProfile.context || 'Not specified'}
- **Technical Comfort:** ${userProfile.technical_comfort || 'medium'}
- **Pain Points/Frustrations:** ${userProfile.frustrations || 'Not specified'}

## Technical Stack
${techStack || 'Not specified'}

## Features & Requirements
${featuresText || 'No features defined yet'}

## Out of Scope (Do NOT Build for MVP)
${outOfScope || 'Not specified'}

## Target Scope Level
${vision.target_level === 'mvp' ? 'MVP - Minimum Viable Product' : 
  vision.target_level === 'prototype' ? 'Prototype - Quick validation' :
  vision.target_level === 'production' ? 'Production - Full feature set' : 
  'MVP'}
${copilotInstructions ? `\n\n## Copilot AI Instructions (Codebase Analysis)\n${copilotInstructions.substring(0, 2000)}${copilotInstructions.length > 2000 ? '\n\n...(truncated - see .github/copilot-instructions.md for full content)' : ''}` : ''}
</prd_instructions>

Follow these steps to create the PRD:

1. Begin with a brief overview explaining the project and the purpose of the document.

2. Use sentence case for all headings except for the title of the document, which should be in title case.

3. Organize your PRD into the following sections:
   a. Introduction
   b. Product Overview
   c. Goals and Objectives
   d. Target Audience
   e. Features and Requirements
   f. User Stories and Acceptance Criteria
   g. Technical Requirements / Stack${copilotInstructions ? ' (use Copilot AI Instructions as ground truth for what actually exists)' : ''}
   h. Design and User Interface
${copilotInstructions ? '\n4. If Copilot AI Instructions are provided, use them as the authoritative source for:\n   - Technical stack and frameworks actually in use\n   - File organization patterns\n   - Coding conventions and patterns\n   - Architecture decisions already made' : ''}

4. For each section, provide detailed and relevant information based on the PRD instructions. Ensure that you:
   - Use clear and concise language
   - Provide specific details and metrics where required
   - Maintain consistency throughout the document
   - Address all points mentioned in each section

5. When creating user stories and acceptance criteria:
   - List ALL necessary user stories including primary, alternative, and edge-case scenarios
   - Assign a unique requirement ID (e.g., ST-101) to each user story for direct traceability
   - Include at least one user story specifically for secure access or authentication if the application requires user identification
   - Include at least one user story specifically for Database modelling if the application requires a database
   - Ensure no potential user interaction is omitted
   - Make sure each user story is testable

6. Format your PRD professionally:
   - Use consistent styles
   - Include numbered sections and subsections
   - Use bullet points and tables where appropriate to improve readability
   - Ensure proper spacing and alignment throughout the document

7. Review your PRD to ensure all aspects of the project are covered comprehensively and that there are no contradictions or ambiguities.

Present your final PRD within <PRD> tags. Begin with the title of the document in title case, followed by each section with its corresponding content. Use appropriate subheadings within each section as needed.

Remember to tailor the content to the specific project described in the PRD instructions, providing detailed and relevant information for each section based on the given context.

**Output the PRD as clean markdown that can be saved directly to scripts/prd.txt for TaskMaster AI integration.**`;
}

// ============================================================================
// Bolt Meta-Prompt Generator
// Creates a prompt for ChatGPT/Claude to generate an optimized Bolt.new prompt
// ============================================================================

export function generateBoltMetaPrompt(context: ProjectContext): string {
  const { projectName, vision, userProfile, features, techStack, outOfScope } = context;

  // Format features
  const mvpFeatures = features.filter(f => 
    (f.priority === 'must_have' || f.priority === 'should_have') && f.name
  );

  const formatFeature = (f: Feature, index: number): string => {
    const priority = f.priority === 'must_have' ? 'MUST HAVE' : 'SHOULD HAVE';
    let text = `${index + 1}. **${f.name}** [${priority}]`;
    if (f.userStory) {
      text += `\n   - User Story: ${f.userStory}`;
    }
    if (f.acceptanceCriteria.filter(c => c).length > 0) {
      text += '\n   - Acceptance Criteria:';
      f.acceptanceCriteria.filter(c => c).forEach(c => {
        text += `\n     - ${c}`;
      });
    }
    return text;
  };

  return `You are an expert at creating optimized prompts for Bolt.new (an AI-powered development environment). Your task is to take the following project requirements and generate a comprehensive, well-structured prompt that will help Bolt.new's AI create an excellent MVP application.

## Project Information

**Project Name:** ${projectName}

### Vision & Problem
- **Problem Being Solved:** ${vision.problem || 'Not specified'}
- **Target User:** ${vision.target_user || 'Not specified'}
- **Why Software:** ${vision.why_software || 'Not specified'}
- **Success Metrics:** ${vision.success_metrics || 'Not specified'}

### User Persona
- **Name:** ${userProfile.persona_name || 'User'}
- **Role:** ${userProfile.persona_role || 'End User'}
- **Primary User:** ${userProfile.primary_user || 'Not specified'}
- **Goal:** ${userProfile.goal || 'Not specified'}
- **Context:** ${userProfile.context || 'Not specified'}
- **Technical Comfort Level:** ${userProfile.technical_comfort || 'medium'}
- **Pain Points:** ${userProfile.frustrations || 'Not specified'}

### Technical Stack Requirements
${techStack || 'Not specified'}

### MVP Features (Priority Order)
${mvpFeatures.length > 0 ? mvpFeatures.map((f, i) => formatFeature(f, i)).join('\n\n') : 'No features defined'}

### Out of Scope (Do NOT Include)
${outOfScope || 'Nothing specified as out of scope'}

### Target Scope
${vision.target_level === 'mvp' ? 'MVP - Minimum Viable Product (focus on core functionality)' : 
  vision.target_level === 'prototype' ? 'Prototype - Quick validation (bare minimum to test concept)' :
  'MVP - Minimum Viable Product'}

---

## Your Task

Generate a **detailed, specific prompt for Bolt.new** that:

1. **Starts with a clear project title and one-sentence summary**

2. **Specifies the exact tech stack** with versions where relevant

3. **Lists features in implementation order** (core/critical features first)

4. **Includes specific UI/UX requirements** based on the user's technical comfort level (${userProfile.technical_comfort || 'medium'})

5. **Provides acceptance criteria** for each feature as implementation checkpoints

6. **Explicitly states what NOT to build** to prevent scope creep

7. **Includes development guidelines** such as:
   - Use TypeScript with strict mode
   - Include proper error handling
   - Add loading states for async operations
   - Make the UI responsive
   - Follow accessibility best practices

8. **Ends with a clear "Start Here" instruction** telling Bolt where to begin

Format the output as a ready-to-paste prompt that begins with "Build an application called ${projectName}..." 

The prompt should be comprehensive enough that Bolt.new can build a working MVP in one session, but focused enough to avoid over-engineering.

**Generate the Bolt.new prompt now:**`;
}

// ============================================================================
// TaskMaster Configuration Generator
// ============================================================================

export function generateTaskmasterConfig(projectName: string): string {
  const config = {
    models: {
      main: {
        provider: "anthropic",
        modelId: "claude-sonnet-4-20250514",
        maxTokens: 64000,
        temperature: 0.2
      },
      research: {
        provider: "anthropic",
        modelId: "claude-sonnet-4-20250514",
        maxTokens: 32000,
        temperature: 0.1
      },
      fallback: {
        provider: "anthropic",
        modelId: "claude-sonnet-4-20250514",
        maxTokens: 64000,
        temperature: 0.2
      }
    },
    global: {
      logLevel: "info",
      debug: false,
      defaultSubtasks: 5,
      defaultPriority: "medium",
      projectName: projectName,
      defaultTag: "master"
    }
  };

  return JSON.stringify(config, null, 2);
}

// ============================================================================
// MCP Server Configuration Generator
// ============================================================================

export function generateMCPConfig(): string {
  const config = {
    mcpServers: {
      "taskmaster-ai": {
        type: "stdio",
        command: "npx",
        args: ["-y", "--package=task-master-ai", "task-master-ai"],
        env: {}
      }
    }
  };

  return JSON.stringify(config, null, 2);
}

// ============================================================================
// PRD Template Placeholder
// A starter template for users to paste their AI-generated PRD
// ============================================================================

export function generatePRDPlaceholder(projectName: string): string {
  return `# ${projectName} - Product Requirements Document

> **Instructions:** 
> 1. Copy the "PRD Generator Prompt" from Orbit
> 2. Paste it into Claude or ChatGPT
> 3. Replace this file's contents with the generated PRD
> 4. Then run: "Initialize taskmaster and parse my PRD to create tasks"

---

## Placeholder

This file should contain your full PRD generated by Claude/ChatGPT.

The PRD should include:
- Introduction
- Product Overview
- Goals and Objectives
- Target Audience
- Features and Requirements
- User Stories and Acceptance Criteria
- Technical Requirements / Stack
- Design and User Interface

---

> Generated by Orbit - Mission Control for AI Development
> Project: ${projectName}
> Date: ${new Date().toISOString().split('T')[0]}
`;
}

// ============================================================================
// Vision Markdown Generator (0_vision.md)
// ============================================================================

export function generateVisionMarkdown(vision: VisionData, projectName: string): string {
  return `# Vision: ${projectName}

## Problem Statement

${vision.problem || '_Not yet defined_'}

## Target User

${vision.target_user || '_Not yet defined_'}

## Why Software?

${vision.why_software || '_Not yet defined_'}

## Success Metrics

${vision.success_metrics || '_Not yet defined_'}

## Target Scope

${vision.target_level === 'mvp' ? 'MVP - Minimum Viable Product' : 
  vision.target_level === 'prototype' ? 'Prototype - Quick validation' :
  vision.target_level === 'production' ? 'Production - Full feature set' : 
  vision.target_level || 'MVP'}

---

> Generated by Orbit - Mission Control for AI Development
> Date: ${new Date().toISOString().split('T')[0]}
`;
}

// ============================================================================
// User Profile Markdown Generator (1_user_profile.md)
// ============================================================================

export function generateUserProfileMarkdown(userProfile: UserProfileData, projectName: string): string {
  return `# User Profile: ${projectName}

## Persona

${userProfile.persona_name ? `**Name:** ${userProfile.persona_name}` : ''}
${userProfile.persona_role ? `**Role:** ${userProfile.persona_role}` : ''}

## Primary User

${userProfile.primary_user || '_Not yet defined_'}

## User Goal

${userProfile.goal || '_Not yet defined_'}

## Context of Use

${userProfile.context || '_Not specified_'}

## Technical Comfort Level

${userProfile.technical_comfort || 'medium'}

## Pain Points & Frustrations

${userProfile.frustrations ? userProfile.frustrations.split('\n').map(f => `- ${f.trim()}`).join('\n') : '_Not specified_'}

${userProfile.competitor_notes ? `## Competitor Notes

${userProfile.competitor_notes}` : ''}

---

> Generated by Orbit - Mission Control for AI Development
> Date: ${new Date().toISOString().split('T')[0]}
`;
}

// ============================================================================
// Download Helpers
// ============================================================================

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

