import { supabase } from './supabase';

interface ProjectData {
  project: {
    id: string;
    name: string;
    description: string;
  };
  vision: {
    problem: string;
    target_user: string;
    success_metrics: string;
    why_software: string;
    target_level: string;
  } | null;
  userProfile: {
    primary_user: string;
    goal: string;
    context: string;
    frustrations: string;
    technical_comfort: string;
    time_constraints: string;
    persona_name: string;
    persona_role: string;
  } | null;
  prd: {
    content: string;
  } | null;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: number;
    acceptance_criteria: string;
    order_index: number;
  }>;
}

export async function fetchProjectData(projectId: string): Promise<ProjectData | null> {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, description')
      .eq('id', projectId)
      .single();

    if (!project) return null;

    const { data: vision } = await supabase
      .from('visions')
      .select('problem, target_user, success_metrics, why_software, target_level')
      .eq('project_id', projectId)
      .maybeSingle();

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('primary_user, goal, context, frustrations, technical_comfort, time_constraints, persona_name, persona_role')
      .eq('project_id', projectId)
      .maybeSingle();

    const { data: prd } = await supabase
      .from('prds')
      .select('content')
      .eq('project_id', projectId)
      .maybeSingle();

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, acceptance_criteria, order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    return {
      project,
      vision: vision || null,
      userProfile: userProfile || null,
      prd: prd || null,
      tasks: tasks || [],
    };
  } catch (err) {
    console.error('Error fetching project data:', err);
    return null;
  }
}

export function generateClaudeMd(data: ProjectData, copilotInstructions?: string): string {
  const { project, vision, userProfile, prd, tasks } = data;

  const currentTask = tasks.find(t => t.status === 'in_progress');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const sections: string[] = [];

  // Header - Project Overview (synthesized from vision)
  const projectOverview = vision?.problem 
    ? `${vision.problem.split('.')[0]}. For ${vision.target_user || 'users'}.`
    : `${project.name}${project.description ? ` - ${project.description}` : ''}`;
  
  sections.push(`# Project Guidelines for Claude

## Project Overview
${projectOverview}`);

  // Target User (summarized from user profile)
  if (userProfile) {
    const userSummary = userProfile.technical_comfort 
      ? `${userProfile.primary_user || 'User'} (${userProfile.technical_comfort} technical comfort)`
      : userProfile.primary_user || 'User';
    const userContext = userProfile.context 
      ? `. Context: ${userProfile.context.split('.')[0]}.`
      : '';
    sections.push(`
## Target User
${userSummary}${userContext}`);
  }

  // Technical Stack (from copilot instructions if available)
  if (copilotInstructions) {
    // Try to extract technical stack from copilot instructions
    const techStackMatch = copilotInstructions.match(/(?:tech|stack|framework|library|technology)[\s\S]{0,500}/i);
    if (techStackMatch) {
      sections.push(`
## Technical Stack
${techStackMatch[0].substring(0, 300)}${techStackMatch[0].length > 300 ? '...' : ''}`);
    }
  }

  // Vision & Problem (detailed)
  if (vision) {
    sections.push(`
## Problem Statement
${vision.problem || '_Not yet defined_'}

## Success Metrics
${vision.success_metrics || '_Not yet defined_'}

## Scope Level
${vision.target_level === 'mvp' ? 'MVP - Minimum Viable Product' : 
  vision.target_level === 'prototype' ? 'Prototype - Quick validation' :
  vision.target_level === 'production' ? 'Production - Full feature set' : 
  vision.target_level || 'MVP'}`);
  }

  // User Profile (detailed)
  if (userProfile) {
    sections.push(`
## User Profile

${userProfile.persona_name ? `**Persona:** ${userProfile.persona_name}${userProfile.persona_role ? ` (${userProfile.persona_role})` : ''}` : ''}

**Primary User:** ${userProfile.primary_user || '_Not yet defined_'}

**User Goal:** ${userProfile.goal || '_Not yet defined_'}

**Context of Use:** ${userProfile.context || '_Not specified_'}

**Technical Comfort Level:** ${userProfile.technical_comfort || 'medium'}

${userProfile.frustrations ? `### Pain Points & Frustrations
${userProfile.frustrations.split('\n').map(f => `- ${f.trim()}`).join('\n')}` : ''}`);
  }

  // Current Task
  if (currentTask) {
    sections.push(`
## Current Task

**${currentTask.title}**

${currentTask.description || '_No description_'}

${currentTask.acceptance_criteria ? `### Acceptance Criteria
${currentTask.acceptance_criteria.split('\n').map(c => `- [ ] ${c.trim()}`).join('\n')}` : ''}`);
  }

  // Task Progress
  if (tasks.length > 0) {
    sections.push(`
## Task Progress

- **Completed:** ${completedTasks.length}/${tasks.length}
- **In Progress:** ${currentTask ? 1 : 0}
- **Pending:** ${pendingTasks.length}

${pendingTasks.length > 0 ? `### Upcoming Tasks
${pendingTasks.slice(0, 5).map((t, i) => `${i + 1}. ${t.title}`).join('\n')}${pendingTasks.length > 5 ? `\n_...and ${pendingTasks.length - 5} more_` : ''}` : ''}`);
  }

  // Coding Standards (from copilot instructions if available)
  if (copilotInstructions) {
    // Try to extract coding standards/conventions from copilot instructions
    const codingStandardsMatch = copilotInstructions.match(/(?:coding|code|convention|pattern|standard|style)[\s\S]{0,800}/i);
    if (codingStandardsMatch) {
      sections.push(`
## Coding Standards
${codingStandardsMatch[0].substring(0, 500)}${codingStandardsMatch[0].length > 500 ? '...' : ''}`);
    }
  }

  // Coding Guidelines
  sections.push(`
## Coding Standards

### General Guidelines
- Keep code simple and readable
- Follow the project's existing patterns and conventions${copilotInstructions ? ' (see codebase analysis below)' : ''}
- Write meaningful commit messages
- Focus on the current task scope

### User Experience Guidelines
- Match the user's technical comfort level (${userProfile?.technical_comfort || 'medium'})
- Provide clear feedback for all actions
- Handle errors gracefully with user-friendly messages
${userProfile?.time_constraints ? `- Keep workflows efficient (user constraint: ${userProfile.time_constraints})` : ''}

### AI Instruction Guidelines
- Start with the simplest solution that works
- Only add complexity when specifically requested
- Highlight potential issues or edge cases
- Ask clarifying questions if requirements are ambiguous`);

  // Codebase Analysis (from Copilot Instructions)
  if (copilotInstructions) {
    sections.push(`
## Codebase Analysis

The following analysis was generated by GitHub Copilot from the actual codebase:

\`\`\`
${copilotInstructions.substring(0, 2000)}${copilotInstructions.length > 2000 ? '\n\n...(truncated - see .github/copilot-instructions.md for full content)' : ''}
\`\`\`

_Use this analysis to understand the actual project structure, frameworks, and conventions in use._`);
  }

  // PRD Summary (if exists)
  if (prd?.content && prd.content.length > 100) {
    // Extract just the key parts of the PRD
    const prdLines = prd.content.split('\n').slice(0, 50);
    sections.push(`
## PRD Reference

_Full PRD available in project. Key sections:_

\`\`\`
${prdLines.join('\n').substring(0, 1500)}${prd.content.length > 1500 ? '\n...(truncated)' : ''}
\`\`\``);
  }

  // Footer
  sections.push(`
---

> Generated by Orbit - Mission Control for AI Development
> Last updated: ${new Date().toISOString().split('T')[0]}`);

  return sections.join('\n');
}

export function downloadClaudeMd(content: string, filename = 'CLAUDE.md') {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function generateAndDownloadClaudeMd(projectId: string, copilotInstructions?: string): Promise<boolean> {
  const data = await fetchProjectData(projectId);
  if (!data) return false;
  
  const content = generateClaudeMd(data, copilotInstructions);
  downloadClaudeMd(content);
  return true;
}

