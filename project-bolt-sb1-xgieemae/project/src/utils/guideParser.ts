export interface GuideItem {
  id: string;
  label: string;
  description?: string;
  anchorId?: string;
  isExternal?: boolean;
}

export interface GuideSection {
  id: string;
  title: string;
  anchorId: string;
  items: GuideItem[];
}

/**
 * Extract sections and structure from the guide markdown
 * Maps anchor IDs to checklist sections for scroll tracking
 */
export function parseGuideStructure(): GuideSection[] {
  return [
    {
      id: 'phase1',
      title: 'Phase 1: Foundation Documents',
      anchorId: 'phase-1-foundation-documents',
      items: [
        { 
          id: 'purpose_framework', 
          label: 'Complete Purpose Framework (3 questions)', 
          description: 'What problem? What change? Is it worth solving with software?',
          anchorId: 'purpose-framework'
        },
        { 
          id: 'vision_doc', 
          label: 'Create 0_vision.md', 
          description: 'Define problem, target user, MVP scope, and out of scope',
          anchorId: 'vision.md'
        },
        { 
          id: 'user_profile', 
          label: 'Create 1_user_profile.md', 
          description: 'Detailed character sketch of primary user',
          anchorId: 'user_profile.md'
        },
        { 
          id: 'success_metrics', 
          label: 'Create 2_success_metrics.md', 
          description: 'Define what "working" means in measurable terms',
          anchorId: 'success_metrics.md'
        },
        { 
          id: 'competitive_research', 
          label: 'Create Competitive Research Document', 
          description: 'Analyze 3-5 existing tools',
          anchorId: 'competitive-research-document'
        },
      ],
    },
    {
      id: 'phase2',
      title: 'Phase 2: Bolt Bootstrap',
      anchorId: 'phase-2-bolt-bootstrap',
      items: [
        { 
          id: 'bolt_scaffold', 
          label: 'Generate project scaffold on Bolt.new', 
          description: 'Use external tool: Bolt.new/Dyad. Include stack preferences (Next.js/Electron, React, TypeScript, Tailwind)',
          isExternal: true
        },
        { 
          id: 'verify_setup', 
          label: 'Verify dev server starts', 
          description: 'Run the project and confirm it works',
          isExternal: true
        },
      ],
    },
    {
      id: 'phase3',
      title: 'Phase 3: GitHub Copilot AI Instructions',
      anchorId: 'phase-3-github-copilot-ai-instructions',
      items: [
        { 
          id: 'copilot_instructions', 
          label: 'Generate Copilot AI Instructions', 
          description: 'Use external tool: VS Code Copilot. Use Copilot Chat to analyze codebase and save to .github/copilot-instructions.md',
          isExternal: true
        },
        { 
          id: 'claude_md', 
          label: 'Generate CLAUDE.md', 
          description: 'Combine foundation docs and copilot instructions into CLAUDE.md'
        },
        { 
          id: 'tool_curation', 
          label: 'Configure Tool Curation (Optional)', 
          description: 'Set up .claude/settings.json for permissions'
        },
      ],
    },
    {
      id: 'phase4',
      title: 'Phase 5: Generate PRD',
      anchorId: 'phase-5-generate-prd',
      items: [
        { 
          id: 'functional_reqs', 
          label: 'Generate Functional Requirements (Optional)', 
          description: 'Use /reqs command to create concise requirements'
        },
        { 
          id: 'generate_prd', 
          label: 'Generate PRD', 
          description: 'Use Claude to create comprehensive PRD from foundation docs'
        },
        { 
          id: 'save_prd', 
          label: 'Save PRD to scripts/prd.txt', 
          description: 'Store PRD for TaskMaster parsing'
        },
      ],
    },
    {
      id: 'phase5',
      title: 'Phase 6: TaskMaster Setup',
      anchorId: 'phase-6-taskmaster-setup',
      items: [
        { 
          id: 'taskmaster_config', 
          label: 'Create .taskmaster/config.json', 
          description: 'Configure TaskMaster with model settings'
        },
        { 
          id: 'mcp_config', 
          label: 'Create .mcp.json in project root', 
          description: 'Configure MCP server for TaskMaster'
        },
        { 
          id: 'init_git', 
          label: 'Initialize git and commit scaffold', 
          description: 'git init && git add . && git commit'
        },
        { 
          id: 'parse_prd', 
          label: 'Parse PRD with TaskMaster', 
          description: 'Ask Claude to parse scripts/prd.txt and set up tasks'
        },
        { 
          id: 'analyze_complexity', 
          label: 'Analyze task complexity', 
          description: 'Identify tasks that need breakdown'
        },
        { 
          id: 'breakdown_tasks', 
          label: 'Break down high-complexity tasks', 
          description: 'Create subtasks for complex items'
        },
      ],
    },
    {
      id: 'phase6',
      title: 'Phase 7: The Overseer Build Loop',
      anchorId: 'phase-7-daily-build-loop',
      items: [
        { 
          id: 'start_session', 
          label: 'Start Session', 
          description: 'Use /start command to begin'
        },
        { 
          id: 'view_tasks', 
          label: 'View Tasks', 
          description: 'Use /tasks to check project status'
        },
        { 
          id: 'select_task', 
          label: 'Select Next Task', 
          description: 'Use /next to get task recommendation'
        },
        { 
          id: 'generate_brief', 
          label: 'Generate Copilot Brief', 
          description: 'Use /brief [Task ID] to create prompt for Copilot'
        },
        { 
          id: 'implement_copilot', 
          label: 'Implement with Copilot', 
          description: 'Paste brief into VS Code Copilot Chat'
        },
        { 
          id: 'architectural_audit', 
          label: 'Architectural Audit', 
          description: 'Use /review to check Copilot\'s work'
        },
        { 
          id: 'commit', 
          label: 'Commit Changes', 
          description: 'Use /git-commit to generate commit message'
        },
      ],
    },
    {
      id: 'phase7',
      title: 'Phase 8: Testing and Validation',
      anchorId: 'phase-8-testing-and-validation',
      items: [
        { 
          id: 'functional_testing', 
          label: 'Complete Functional Testing', 
          description: 'Verify core functionality works end-to-end'
        },
        { 
          id: 'user_validation', 
          label: 'User Validation', 
          description: 'Get app in front of 1-3 real users'
        },
        { 
          id: 'analyze_feedback', 
          label: 'Analyze User Feedback', 
          description: 'Use /analyze-feedback to turn observations into action'
        },
      ],
    },
  ];
}

/**
 * Get anchor ID for a section
 */
export function getSectionAnchorId(sectionId: string): string | undefined {
  const sections = parseGuideStructure();
  const section = sections.find(s => s.id === sectionId);
  return section?.anchorId;
}

/**
 * Get section ID from anchor ID
 */
export function getSectionIdFromAnchor(anchorId: string): string | undefined {
  const sections = parseGuideStructure();
  const section = sections.find(s => s.anchorId === anchorId);
  return section?.id;
}

