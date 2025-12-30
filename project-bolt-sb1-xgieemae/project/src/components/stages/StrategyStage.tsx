import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Button, Card, Input } from '../ui';
import {
  FileText,
  Wand2,
  FileEdit,
  Download,
  Copy,
  CheckCircle,
  Terminal,
  Folder,
  ArrowRight,
  BookOpen,
  Lightbulb,
  ExternalLink,
  ListChecks,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GuidedPRD } from './strategy/GuidedPRD';
import { TaskParser } from './strategy/TaskParser';

interface VisionData {
  problem: string;
  target_user: string;
  success_metrics: string;
  why_software?: string;
}

interface UserProfileData {
  primary_user: string;
  goal: string;
  frustrations?: string;
  technical_comfort?: string;
  persona_name?: string;
  persona_role?: string;
}

type ActiveTab = 'prd' | 'integration';
type PrdMode = 'guided' | 'editor' | 'quick';

interface ParsedTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  acceptanceCriteria: string[];
  selected: boolean;
}

export function StrategyStage() {
  const { currentProject, setCurrentStage } = useApp();
  const [prdContent, setPrdContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('prd');
  const [prdMode, setPrdMode] = useState<PrdMode>('guided');
  const [vision, setVision] = useState<VisionData>({ problem: '', target_user: '', success_metrics: '' });
  const [userProfile, setUserProfile] = useState<UserProfileData>({ primary_user: '', goal: '' });
  const [copied, setCopied] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [existingTaskCount, setExistingTaskCount] = useState(0);
  const [tasksGenerated, setTasksGenerated] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  const loadData = async () => {
    if (!currentProject) return;

    const { data: visionData } = await supabase
      .from('visions')
      .select('problem, target_user, success_metrics, why_software')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (visionData) {
      setVision(visionData);
    }

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('primary_user, goal, frustrations, technical_comfort, persona_name, persona_role')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (profileData) {
      setUserProfile(profileData);
    }

    const { data: prdData } = await supabase
      .from('prds')
      .select('*')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (prdData) {
      setPrdContent(prdData.content);
      if (prdData.content && prdData.content.length > 100) {
        setPrdMode('editor');
      }
    }

    // Load existing task count
    const { data: taskData } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', currentProject.id);

    setExistingTaskCount(taskData?.length ?? 0);
  };

  // Handle tasks generated from PRD parser
  const handleTasksGenerated = async (tasks: ParsedTask[]) => {
    if (!currentProject || tasks.length === 0) return;

    const priorityMap = { high: 1, medium: 2, low: 3 };
    
    // Get current max order_index
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('project_id', currentProject.id)
      .order('order_index', { ascending: false })
      .limit(1);

    const startIndex = (existingTasks?.[0]?.order_index ?? -1) + 1;

    // Insert all tasks
    const tasksToInsert = tasks.map((task, index) => ({
      project_id: currentProject.id,
      title: task.title,
      description: task.description,
      status: 'pending' as const,
      priority: priorityMap[task.priority],
      acceptance_criteria: task.acceptanceCriteria.join('\n'),
      notes: '',
      order_index: startIndex + index,
    }));

    const { error } = await supabase.from('tasks').insert(tasksToInsert);

    if (!error) {
      setExistingTaskCount(prev => prev + tasks.length);
      setTasksGenerated(true);
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setTasksGenerated(false), 3000);
    }
  };

  // Auto-generate PRD from foundation data
  const autoGeneratePRD = () => {
    const hasFoundation = vision.problem && vision.target_user && userProfile.primary_user;
    if (!hasFoundation) return;

    const personaSection = userProfile.persona_name 
      ? `**Persona:** ${userProfile.persona_name}${userProfile.persona_role ? ` (${userProfile.persona_role})` : ''}`
      : '';

    const frustrationsList = userProfile.frustrations
      ? userProfile.frustrations.split('\n').map(f => `- ${f.trim()}`).join('\n')
      : '';

    const generatedPRD = `# Product Requirements Document: ${currentProject?.name || 'Project'}

## 1. Overview

### Problem Statement
${vision.problem}

### Why Software?
${vision.why_software || '_Define why a software solution is needed_'}

### Target User
${vision.target_user}

## 2. User Profile

${personaSection}

**Primary User:** ${userProfile.primary_user}

**User Goal:** ${userProfile.goal}

**Technical Comfort Level:** ${userProfile.technical_comfort || 'Medium'}

${frustrationsList ? `### Pain Points & Frustrations\n${frustrationsList}` : ''}

## 3. Success Criteria
${vision.success_metrics || '_Define measurable success criteria_'}

## 4. Core Features (MVP)

### Feature 1: [Primary Feature]
**User Story:** As a ${userProfile.primary_user}, I want to [action] so that [benefit].

**Acceptance Criteria:**
- [ ] User can...
- [ ] System validates...
- [ ] Feedback is provided...

### Feature 2: [Secondary Feature]
**User Story:** As a ${userProfile.primary_user}, I want to [action] so that [benefit].

**Acceptance Criteria:**
- [ ] User can...
- [ ] System handles...

## 5. Technical Stack

_Choose based on your project needs:_
- **Frontend:** React + Vite / Next.js / Vue
- **Backend:** Supabase / Node.js + Express / Edge Functions
- **Database:** Supabase (PostgreSQL) / SQLite / Firebase
- **Deployment:** Vercel / Netlify / Railway

## 6. Out of Scope (MVP)

- Advanced features for v2
- Complex integrations
- Performance optimizations beyond basics

## 7. Implementation Notes

### Design Guidelines
- Keep the interface simple and focused
- Match user's technical comfort level (${userProfile.technical_comfort || 'medium'})
- Provide clear feedback for all actions

### Development Priorities
1. Core user flow
2. Essential validation
3. Basic error handling
4. Minimal viable styling

---

> Generated from Foundation data in Orbit.
> Place this file at \`scripts/prd.txt\` for TaskMaster integration.
`;

    setPrdContent(generatedPRD);
    setPrdMode('editor');
    savePRD(generatedPRD);
  };

  const hasFoundationData = vision.problem && vision.target_user && userProfile.primary_user;

  const savePRD = useCallback(async (content?: string) => {
    if (!currentProject) return;

    const contentToSave = content ?? prdContent;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('prds')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('prds')
          .update({ content: contentToSave, updated_at: new Date().toISOString() })
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('prds').insert({
          project_id: currentProject.id,
          content: contentToSave,
        });
      }
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving PRD:', err);
    } finally {
      setSaving(false);
    }
  }, [currentProject, prdContent]);

  const handleGeneratePRD = (generatedPrd: string) => {
    setPrdContent(generatedPrd);
    setPrdMode('editor');
    savePRD(generatedPrd);
  };

  const downloadPRD = () => {
    const blob = new Blob([prdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '3_prd.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleContinue = async () => {
    await savePRD();
    await supabase
      .from('projects')
      .update({ current_stage: 'workbench' })
      .eq('id', currentProject?.id);
    setCurrentStage('workbench');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-primary-400" />
          Strategy: PRD & Tasks
        </h1>
        <p className="text-primary-400 mt-2">
          Create your Product Requirements Document and break it into development tasks.
        </p>
      </div>

      <div className="flex gap-2 border-b border-primary-700">
        <button
          onClick={() => setActiveTab('prd')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'prd'
              ? 'text-primary-100 border-b-2 border-primary-500'
              : 'text-primary-400 hover:text-primary-200'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          PRD Builder
        </button>
        <button
          onClick={() => setActiveTab('integration')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'integration'
              ? 'text-primary-100 border-b-2 border-primary-500'
              : 'text-primary-400 hover:text-primary-200'
          }`}
        >
          <Terminal className="w-4 h-4 inline mr-2" />
          Taskmaster Setup
        </button>
      </div>

      {activeTab === 'prd' && (
        <Card>
          {/* Quick Generate Banner */}
          {!prdContent && hasFoundationData && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-200">Auto-Generate PRD</h3>
                    <p className="text-xs text-blue-300/70">
                      Create a PRD draft instantly from your Foundation data
                    </p>
                  </div>
                </div>
                <Button onClick={autoGeneratePRD} variant="primary" className="bg-blue-600 hover:bg-blue-500">
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Draft
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <Button
                variant={prdMode === 'guided' ? 'primary' : 'ghost'}
                onClick={() => setPrdMode('guided')}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Guided Builder
              </Button>
              <Button
                variant={prdMode === 'editor' ? 'primary' : 'ghost'}
                onClick={() => setPrdMode('editor')}
              >
                <FileEdit className="w-4 h-4 mr-2" />
                Editor
              </Button>
              {hasFoundationData && (
                <Button
                  variant="ghost"
                  onClick={autoGeneratePRD}
                  title="Quick generate PRD from foundation data"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Quick Generate
                </Button>
              )}
            </div>

            {prdMode === 'editor' && (
              <div className="flex gap-3 items-center">
                {lastSaved && (
                  <span className="text-sm text-primary-500">
                    Saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                <Button variant="ghost" onClick={downloadPRD}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => savePRD()} loading={saving}>
                  Save PRD
                </Button>
              </div>
            )}
          </div>

          {prdMode === 'guided' ? (
            <GuidedPRD
              projectName={currentProject?.name || 'My Project'}
              visionProblem={vision.problem}
              visionTargetUser={vision.target_user}
              userGoal={userProfile.goal}
              successMetrics={vision.success_metrics}
              onGeneratePRD={handleGeneratePRD}
            />
          ) : (
            <div className="space-y-4">
              <textarea
                value={prdContent}
                onChange={(e) => setPrdContent(e.target.value)}
                className="w-full min-h-[400px] p-4 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="Your PRD will appear here after using the Guided Builder, or write it manually..."
                spellCheck={false}
              />

              {/* Task Parser */}
              <TaskParser
                prdContent={prdContent}
                onTasksGenerated={handleTasksGenerated}
                existingTaskCount={existingTaskCount}
              />

              {/* Success message */}
              {tasksGenerated && (
                <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg flex items-center gap-3 animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300">Tasks added successfully! View them in the Workbench.</span>
                  <Button
                    variant="ghost"
                    className="ml-auto text-green-300"
                    onClick={() => setCurrentStage('workbench')}
                  >
                    Go to Workbench
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <strong className="text-blue-300">Pro tip:</strong> Use the "Parse PRD" button above to extract tasks directly,
                    or save this file as{' '}
                    <code className="px-1.5 py-0.5 bg-blue-900/50 rounded text-blue-300">scripts/prd.txt</code>{' '}
                    for TaskMaster CLI integration.
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'integration' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary-100 mb-1">Taskmaster AI Setup</h2>
                <p className="text-primary-400">
                  Taskmaster is an AI-powered task manager that works with Claude Code to break down your PRD into actionable development tasks.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-300 mb-2">Prerequisites</h4>
                    <ul className="text-sm text-amber-200/80 space-y-1">
                      <li>- Node.js 18+ installed</li>
                      <li>- Claude Code CLI installed (<code className="px-1 py-0.5 bg-amber-900/50 rounded">npm i -g @anthropic-ai/claude-code</code>)</li>
                      <li>- Anthropic API key configured</li>
                      <li>- PRD document ready (use the PRD Builder tab)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary-100 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-sm">1</span>
                  Install Taskmaster MCP
                </h3>
                <p className="text-primary-400 mb-3">
                  First, install Taskmaster as a Model Context Protocol (MCP) server in your Claude Code configuration:
                </p>
                <div className="relative">
                  <pre className="bg-primary-900 border border-primary-700 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-primary-200">npx @anthropic-ai/claude-code mcp add task-master-ai</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard('npx @anthropic-ai/claude-code mcp add task-master-ai', 'install')}
                    className="absolute top-3 right-3 p-2 hover:bg-primary-700 rounded transition-colors"
                  >
                    {copied === 'install' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-primary-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary-100 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-sm">2</span>
                  Set Up Project Structure
                </h3>
                <p className="text-primary-400 mb-3">
                  Create a <code className="px-1.5 py-0.5 bg-primary-700 rounded">scripts</code> folder in your project root and add your PRD:
                </p>
                <div className="bg-primary-900 border border-primary-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-primary-300 mb-2">
                    <Folder className="w-4 h-4" />
                    <span className="text-sm font-medium">Project Structure</span>
                  </div>
                  <pre className="text-sm text-primary-400 pl-4">
{`your-project/
├── scripts/
│   └── prd.txt          <- Your PRD goes here
├── tasks/
│   └── tasks.json       <- Generated by Taskmaster
├── src/
│   └── ...
└── package.json`}
                  </pre>
                </div>
                <p className="text-sm text-primary-500 mt-3">
                  Download your PRD from the PRD Builder tab and save it as <code className="px-1 py-0.5 bg-primary-700 rounded">scripts/prd.txt</code>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary-100 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-sm">3</span>
                  Initialize Tasks
                </h3>
                <p className="text-primary-400 mb-3">
                  In Claude Code, ask it to initialize your tasks from the PRD:
                </p>
                <div className="relative">
                  <pre className="bg-primary-900 border border-primary-700 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-primary-200">"Initialize taskmaster and parse my PRD to create tasks"</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard('Initialize taskmaster and parse my PRD to create tasks', 'init')}
                    className="absolute top-3 right-3 p-2 hover:bg-primary-700 rounded transition-colors"
                  >
                    {copied === 'init' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-primary-400" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-primary-500 mt-3">
                  Taskmaster will analyze your PRD and create a structured task list in <code className="px-1 py-0.5 bg-primary-700 rounded">tasks/tasks.json</code>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary-100 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-sm">4</span>
                  Work Through Tasks
                </h3>
                <p className="text-primary-400 mb-3">
                  Use these prompts to work with Taskmaster in Claude Code:
                </p>
                <div className="space-y-3">
                  {[
                    { cmd: '"Show me the next task"', desc: 'Get the highest priority incomplete task' },
                    { cmd: '"What are all my current tasks?"', desc: 'List all tasks with their status' },
                    { cmd: '"Mark task 3 as complete"', desc: 'Update task status' },
                    { cmd: '"Expand task 5 into subtasks"', desc: 'Break down complex tasks' },
                    { cmd: '"Add a new task: Set up authentication"', desc: 'Create new tasks on the fly' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-primary-800/50 rounded-lg">
                      <div className="flex-1">
                        <code className="text-sm text-blue-300">{item.cmd}</code>
                        <p className="text-xs text-primary-500 mt-1">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.cmd.replace(/"/g, ''), `cmd-${i}`)}
                        className="p-1.5 hover:bg-primary-700 rounded transition-colors"
                      >
                        {copied === `cmd-${i}` ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-primary-400" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-700/50 rounded-xl p-6">
                <h4 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Pro Tips for Vibe Coding
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-blue-200">
                      <strong>Start Small:</strong> Begin with the simplest possible version. You can always add complexity later.
                    </p>
                    <p className="text-blue-200">
                      <strong>One Task at a Time:</strong> Focus on completing one task before moving to the next.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-blue-200">
                      <strong>Test Often:</strong> Run your app after each task to catch issues early.
                    </p>
                    <p className="text-blue-200">
                      <strong>Iterate:</strong> Don't aim for perfect. Ship, learn, and improve.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="text-primary-200 font-medium">Learn More</p>
                    <p className="text-sm text-primary-400">Full Taskmaster documentation and examples</p>
                  </div>
                </div>
                <a
                  href="https://github.com/eyaltoledano/claude-task-master"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary-700 hover:bg-primary-600 rounded-lg text-primary-200 text-sm transition-colors"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleContinue}>
          Continue to Workbench
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
