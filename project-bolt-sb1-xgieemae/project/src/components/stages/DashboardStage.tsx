import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui';
import {
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Check,
  FileText,
  Zap,
  Code2,
  FileCode,
  ListChecks,
  PlayCircle,
  TestTube,
} from 'lucide-react';

interface DashboardStageProps {
  onNavigate: (stage: string) => void;
}

interface GuideItem {
  id: string;
  label: string;
  description?: string;
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: GuideItem[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DashboardStage({ onNavigate }: DashboardStageProps) {
  const { currentProject } = useApp();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    phase1: true,
    phase2: false,
    phase3: false,
    phase4: false,
    phase5: false,
    phase6: false,
    phase7: false,
    phase8: false,
  });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Load checkbox states from localStorage
  useEffect(() => {
    if (currentProject) {
      const storageKey = `guide_${currentProject.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setCheckedItems(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load guide progress:', e);
        }
      }
    }
  }, [currentProject]);

  // Save checkbox states to localStorage
  const toggleCheckbox = (itemId: string) => {
    if (!currentProject) return;
    const newChecked = { ...checkedItems, [itemId]: !checkedItems[itemId] };
    setCheckedItems(newChecked);
    const storageKey = `guide_${currentProject.id}`;
    localStorage.setItem(storageKey, JSON.stringify(newChecked));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const guideSections: GuideSection[] = [
    {
      id: 'phase1',
      title: 'Phase 1: Foundation Documents',
      icon: FileText,
      items: [
        { id: 'purpose_framework', label: 'Complete Purpose Framework (3 questions)', description: 'What problem? What change? Is it worth solving with software?' },
        { id: 'vision_doc', label: 'Create 0_vision.md', description: 'Define problem, target user, MVP scope, and out of scope' },
        { id: 'user_profile', label: 'Create 1_user_profile.md', description: 'Detailed character sketch of primary user' },
        { id: 'success_metrics', label: 'Create 2_success_metrics.md', description: 'Define what "working" means in measurable terms' },
        { id: 'competitive_research', label: 'Create Competitive Research Document', description: 'Analyze 3-5 existing tools' },
      ],
    },
    {
      id: 'phase2',
      title: 'Phase 2: Bolt Bootstrap',
      icon: Zap,
      items: [
        { id: 'bolt_scaffold', label: 'Generate project scaffold on Bolt.new', description: 'Include stack preferences (Next.js/Electron, React, TypeScript, Tailwind)' },
        { id: 'verify_setup', label: 'Verify dev server starts', description: 'Run the project and confirm it works' },
      ],
    },
    {
      id: 'phase3',
      title: 'Phase 3: GitHub Copilot AI Instructions',
      icon: Code2,
      items: [
        { id: 'copilot_instructions', label: 'Generate Copilot AI Instructions', description: 'Use Copilot Chat to analyze codebase and save to .github/copilot-instructions.md' },
        { id: 'claude_md', label: 'Generate CLAUDE.md', description: 'Combine foundation docs and copilot instructions into CLAUDE.md' },
        { id: 'tool_curation', label: 'Configure Tool Curation (Optional)', description: 'Set up .claude/settings.json for permissions' },
      ],
    },
    {
      id: 'phase4',
      title: 'Phase 5: Generate PRD',
      icon: FileCode,
      items: [
        { id: 'functional_reqs', label: 'Generate Functional Requirements (Optional)', description: 'Use /reqs command to create concise requirements' },
        { id: 'generate_prd', label: 'Generate PRD', description: 'Use Claude to create comprehensive PRD from foundation docs' },
        { id: 'save_prd', label: 'Save PRD to scripts/prd.txt', description: 'Store PRD for TaskMaster parsing' },
      ],
    },
    {
      id: 'phase5',
      title: 'Phase 6: TaskMaster Setup',
      icon: ListChecks,
      items: [
        { id: 'taskmaster_config', label: 'Create .taskmaster/config.json', description: 'Configure TaskMaster with model settings' },
        { id: 'mcp_config', label: 'Create .mcp.json in project root', description: 'Configure MCP server for TaskMaster' },
        { id: 'init_git', label: 'Initialize git and commit scaffold', description: 'git init && git add . && git commit' },
        { id: 'parse_prd', label: 'Parse PRD with TaskMaster', description: 'Ask Claude to parse scripts/prd.txt and set up tasks' },
        { id: 'analyze_complexity', label: 'Analyze task complexity', description: 'Identify tasks that need breakdown' },
        { id: 'breakdown_tasks', label: 'Break down high-complexity tasks', description: 'Create subtasks for complex items' },
      ],
    },
    {
      id: 'phase6',
      title: 'Phase 7: The Overseer Build Loop',
      icon: PlayCircle,
      items: [
        { id: 'start_session', label: 'Start Session', description: 'Use /start command to begin' },
        { id: 'view_tasks', label: 'View Tasks', description: 'Use /tasks to check project status' },
        { id: 'select_task', label: 'Select Next Task', description: 'Use /next to get task recommendation' },
        { id: 'generate_brief', label: 'Generate Copilot Brief', description: 'Use /brief [Task ID] to create prompt for Copilot' },
        { id: 'implement_copilot', label: 'Implement with Copilot', description: 'Paste brief into VS Code Copilot Chat' },
        { id: 'architectural_audit', label: 'Architectural Audit', description: 'Use /review to check Copilot\'s work' },
        { id: 'commit', label: 'Commit Changes', description: 'Use /git-commit to generate commit message' },
      ],
    },
    {
      id: 'phase7',
      title: 'Phase 8: Testing and Validation',
      icon: TestTube,
      items: [
        { id: 'functional_testing', label: 'Complete Functional Testing', description: 'Verify core functionality works end-to-end' },
        { id: 'user_validation', label: 'User Validation', description: 'Get app in front of 1-3 real users' },
        { id: 'analyze_feedback', label: 'Analyze User Feedback', description: 'Use /analyze-feedback to turn observations into action' },
      ],
    },
  ];

  return (
    <div className="mx-auto space-y-4 max-w-6xl">
      <div>
        <h1 className="flex gap-3 items-center text-3xl font-bold text-primary-100">
          <LayoutDashboard className="w-8 h-8 text-primary-400" />
          Project Setup Guide
        </h1>
        <p className="mt-2 text-primary-400">
          Interactive checklist following the DougHub Project Setup Guide
        </p>
      </div>

      <div className="space-y-3">
        {guideSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections[section.id];
          const completedCount = section.items.filter((item) => checkedItems[item.id]).length;
          const totalCount = section.items.length;

          return (
            <Card key={section.id} className="overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex justify-between items-center p-4 w-full transition-colors hover:bg-primary-800/50"
              >
                <div className="flex gap-3 items-center">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-primary-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-primary-400" />
                  )}
                  <div className={`p-2 rounded-lg bg-primary-800`}>
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-primary-100">{section.title}</h3>
                    <p className="text-xs text-primary-500">
                      {completedCount}/{totalCount} completed
                    </p>
                  </div>
                </div>
                {completedCount === totalCount && completedCount > 0 && (
                  <div className="flex gap-2 items-center">
                    <div className="flex justify-center items-center w-6 h-6 rounded-full bg-green-900/50">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pt-4 pb-4 space-y-2 border-t border-primary-800">
                  {section.items.map((item) => {
                    const isChecked = checkedItems[item.id] || false;
                    return (
                      <label
                        key={item.id}
                        className="flex gap-3 items-start p-3 rounded-lg transition-colors cursor-pointer hover:bg-primary-800/30"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheckbox(item.id)}
                          className="mt-1 w-4 h-4 rounded border-primary-600 bg-primary-800 text-primary-400 focus:ring-primary-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${isChecked ? 'line-through text-primary-300' : 'text-primary-100'}`}>
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="mt-1 text-xs text-primary-500">{item.description}</div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

