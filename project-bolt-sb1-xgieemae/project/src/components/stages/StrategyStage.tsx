import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Button, Card, Input, Textarea } from '../ui';
import {
  ListChecks,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Check,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  Terminal,
  Rocket,
  Copy,
  ExternalLink,
  AlertTriangle,
  Lightbulb,
  GitBranch,
  Search,
  BookOpen,
  Folder,
} from 'lucide-react';
import { generateBoltPrompt, validateBoltPromptData } from '../../lib/boltPromptGenerator';
import { TaskParser } from './strategy/TaskParser';

// Types
interface VisionData {
  problem: string;
  target_user: string;
  success_metrics: string;
  why_software?: string;
  target_level: string;
}

interface UserProfileData {
  primary_user: string;
  goal: string;
  frustrations?: string;
  technical_comfort?: string;
  persona_name?: string;
  persona_role?: string;
  context?: string;
}

interface Feature {
  id: string;
  name: string;
  userStory: string;
  priority: 'must_have' | 'should_have' | 'nice_to_have';
  acceptanceCriteria: string[];
}

interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  deployment: string;
  additionalTools: string;
}

interface ParsedTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  acceptanceCriteria: string[];
  selected: boolean;
}

type StrategyStep = 'tech_stack' | 'features' | 'out_of_scope' | 'choose_path';
type LaunchPath = 'bolt' | 'local' | null;

const STEPS: { id: StrategyStep; label: string; description: string }[] = [
  { id: 'tech_stack', label: 'Tech Stack', description: 'Choose your technology stack' },
  { id: 'features', label: 'Features', description: 'Define your MVP features' },
  { id: 'out_of_scope', label: 'Out of Scope', description: 'What NOT to build' },
  { id: 'choose_path', label: 'Choose Your Path', description: 'How to build it' },
];

const TECH_OPTIONS = {
  frontend: [
    { value: 'react-vite', label: 'React + Vite', description: 'Fast, modern React setup with Vite bundler' },
    { value: 'nextjs', label: 'Next.js', description: 'Full-stack React with SSR and API routes' },
    { value: 'vue', label: 'Vue 3', description: 'Progressive JavaScript framework' },
    { value: 'vanilla', label: 'Vanilla JS', description: 'Plain JavaScript, no framework' },
  ],
  backend: [
    { value: 'none', label: 'None (Client-only)', description: 'Frontend-only app, no backend needed' },
    { value: 'supabase', label: 'Supabase', description: 'Backend-as-a-service with Postgres' },
    { value: 'nodejs', label: 'Node.js + Express', description: 'Traditional Node.js server' },
    { value: 'edge', label: 'Edge Functions', description: 'Serverless functions at the edge' },
  ],
  database: [
    { value: 'none', label: 'None', description: 'No database needed for this project' },
    { value: 'supabase-postgres', label: 'Supabase (Postgres)', description: 'Hosted PostgreSQL with realtime' },
    { value: 'sqlite', label: 'SQLite', description: 'Local file-based database' },
    { value: 'firebase', label: 'Firebase', description: 'NoSQL document database' },
  ],
  deployment: [
    { value: 'vercel', label: 'Vercel', description: 'Best for Next.js and React apps' },
    { value: 'netlify', label: 'Netlify', description: 'Great for static sites and serverless' },
    { value: 'railway', label: 'Railway', description: 'Good for full-stack apps with databases' },
    { value: 'local', label: 'Local only', description: 'Development only, no deployment' },
  ],
};

export function StrategyStage() {
  const { currentProject, setCurrentStage } = useApp();
  const [currentStep, setCurrentStep] = useState<StrategyStep>('tech_stack');
  const [vision, setVision] = useState<VisionData>({ problem: '', target_user: '', success_metrics: '', target_level: 'mvp' });
  const [userProfile, setUserProfile] = useState<UserProfileData>({ primary_user: '', goal: '' });
  const [saving, setSaving] = useState(false);
  
  // Tech stack state
  const [techStack, setTechStack] = useState<TechStack>({
    frontend: 'react-vite',
    backend: 'supabase',
    database: 'supabase-postgres',
    deployment: 'vercel',
    additionalTools: '',
  });
  
  // Features state
  const [features, setFeatures] = useState<Feature[]>([
    { id: '1', name: '', userStory: '', priority: 'must_have', acceptanceCriteria: [''] },
  ]);
  const [expandedFeature, setExpandedFeature] = useState<string | null>('1');
  
  // Out of scope state
  const [outOfScope, setOutOfScope] = useState('');
  
  // Path selection state
  const [selectedPath, setSelectedPath] = useState<LaunchPath>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showTaskmasterSetup, setShowTaskmasterSetup] = useState(false);
  
  // PRD state
  const [prdContent, setPrdContent] = useState('');
  const [existingTaskCount, setExistingTaskCount] = useState(0);
  const [tasksGenerated, setTasksGenerated] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  const loadData = async () => {
    if (!currentProject) return;

    // Load vision
    const { data: visionData } = await supabase
      .from('visions')
      .select('problem, target_user, success_metrics, why_software, target_level')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (visionData) {
      setVision(visionData);
    }

    // Load user profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('primary_user, goal, frustrations, technical_comfort, persona_name, persona_role, context')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (profileData) {
      setUserProfile(profileData);
    }

    // Load existing PRD
    const { data: prdData } = await supabase
      .from('prds')
      .select('*')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (prdData) {
      setPrdContent(prdData.content || '');
      setOutOfScope(prdData.out_of_scope || '');
    }

    // Load existing task count
    const { data: taskData } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', currentProject.id);

    setExistingTaskCount(taskData?.length ?? 0);
  };

  // Feature management
  const addFeature = () => {
    const newFeature: Feature = {
      id: Date.now().toString(),
      name: '',
      userStory: '',
      priority: 'should_have',
      acceptanceCriteria: [''],
    };
    setFeatures([...features, newFeature]);
    setExpandedFeature(newFeature.id);
  };

  const removeFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id));
  };

  const updateFeature = (id: string, updates: Partial<Feature>) => {
    setFeatures(features.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const addAcceptanceCriteria = (featureId: string) => {
    setFeatures(features.map(f => {
      if (f.id === featureId) {
        return { ...f, acceptanceCriteria: [...f.acceptanceCriteria, ''] };
      }
      return f;
    }));
  };

  const updateAcceptanceCriteria = (featureId: string, index: number, value: string) => {
    setFeatures(features.map(f => {
      if (f.id === featureId) {
        const newCriteria = [...f.acceptanceCriteria];
        newCriteria[index] = value;
        return { ...f, acceptanceCriteria: newCriteria };
      }
      return f;
    }));
  };

  const removeAcceptanceCriteria = (featureId: string, index: number) => {
    setFeatures(features.map(f => {
      if (f.id === featureId && f.acceptanceCriteria.length > 1) {
        return { ...f, acceptanceCriteria: f.acceptanceCriteria.filter((_, i) => i !== index) };
      }
      return f;
    }));
  };

  // Generate PRD content
  const generatePRDContent = useCallback(() => {
    const mustHave = features.filter(f => f.priority === 'must_have' && f.name);
    const shouldHave = features.filter(f => f.priority === 'should_have' && f.name);
    const niceToHave = features.filter(f => f.priority === 'nice_to_have' && f.name);

    const formatFeature = (f: Feature, index: number) => {
      const lines = [`### ${index + 1}. ${f.name}`];
      if (f.userStory) {
        lines.push('', `**User Story:** ${f.userStory}`);
      }
      if (f.acceptanceCriteria.filter(c => c).length > 0) {
        lines.push('', '**Acceptance Criteria:**');
        f.acceptanceCriteria.filter(c => c).forEach(c => {
          lines.push(`- [ ] ${c}`);
        });
      }
      return lines.join('\n');
    };

    const getTechLabel = (category: keyof typeof TECH_OPTIONS, value: string) => {
      return TECH_OPTIONS[category].find(o => o.value === value)?.label || value;
    };

    return `# Product Requirements Document: ${currentProject?.name || 'Project'}

## Project Overview

### Problem Statement
${vision.problem || '_Define in Foundation tab_'}

### Target User
${vision.target_user || '_Define in Foundation tab_'}

### User Goal
${userProfile.goal || '_Define in Foundation tab_'}

## Technical Stack

- **Frontend:** ${getTechLabel('frontend', techStack.frontend)}
- **Backend:** ${getTechLabel('backend', techStack.backend)}
- **Database:** ${getTechLabel('database', techStack.database)}
- **Deployment:** ${getTechLabel('deployment', techStack.deployment)}
${techStack.additionalTools ? `- **Additional Tools:** ${techStack.additionalTools}` : ''}

## Core Features

${mustHave.length > 0 ? `### Must Have (MVP)
${mustHave.map((f, i) => formatFeature(f, i)).join('\n\n')}` : ''}

${shouldHave.length > 0 ? `### Should Have
${shouldHave.map((f, i) => formatFeature(f, i)).join('\n\n')}` : ''}

${niceToHave.length > 0 ? `### Nice to Have (Future)
${niceToHave.map((f, i) => formatFeature(f, i)).join('\n\n')}` : ''}

## Success Criteria

${vision.success_metrics || '_Define in Foundation tab_'}

## Out of Scope (MVP)

${outOfScope || '- _No items marked as out of scope_'}

---

> This PRD was generated to work with TaskMaster AI and Claude Code.
> Place this file at \`scripts/prd.txt\` for TaskMaster integration.
`;
  }, [currentProject, vision, userProfile, techStack, features, outOfScope]);

  // Save PRD
  const savePRD = useCallback(async () => {
    if (!currentProject) return;
    
    setSaving(true);
    const content = generatePRDContent();
    setPrdContent(content);
    
    try {
      const { data: existing } = await supabase
        .from('prds')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('prds')
          .update({ content, out_of_scope: outOfScope, updated_at: new Date().toISOString() })
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('prds').insert({
          project_id: currentProject.id,
          content,
          out_of_scope: outOfScope,
        });
      }
    } catch (err) {
      console.error('Error saving PRD:', err);
    } finally {
      setSaving(false);
    }
  }, [currentProject, generatePRDContent, outOfScope]);

  // Generate Bolt prompt
  const boltPromptData = {
    projectName: currentProject?.name || 'My Project',
    vision: {
      problem: vision.problem,
      target_user: vision.target_user,
      success_metrics: vision.success_metrics,
      why_software: vision.why_software || '',
      target_level: vision.target_level || 'mvp',
    },
    userProfile: {
      primary_user: userProfile.primary_user,
      goal: userProfile.goal,
      context: userProfile.context || '',
      frustrations: userProfile.frustrations || '',
      technical_comfort: userProfile.technical_comfort || 'medium',
      time_constraints: '',
      persona_name: userProfile.persona_name || '',
      persona_role: userProfile.persona_role || '',
    },
    features: features.filter(f => f.name).map(f => ({
      name: f.name,
      userStory: f.userStory,
      acceptanceCriteria: f.acceptanceCriteria.filter(ac => ac.trim() !== ''),
      priority: f.priority === 'must_have' ? 'must-have' as const : 
                f.priority === 'should_have' ? 'should-have' as const : 
                'nice-to-have' as const,
    })),
    techStack,
    outOfScope,
  };

  const validation = validateBoltPromptData(boltPromptData);
  const generatedBoltPrompt = validation.valid ? generateBoltPrompt(boltPromptData) : '';

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Navigation
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const canGoNext = currentStepIndex < STEPS.length - 1;
  const canGoPrev = currentStepIndex > 0;

  const goToStep = (step: StrategyStep) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    if (canGoNext) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (canGoPrev) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  // Task generation
  const handleTasksGenerated = async (tasks: ParsedTask[]) => {
    if (!currentProject || tasks.length === 0) return;

    const priorityMap = { high: 1, medium: 2, low: 3 };
    
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('project_id', currentProject.id)
      .order('order_index', { ascending: false })
      .limit(1);

    const startIndex = (existingTasks?.[0]?.order_index ?? -1) + 1;

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
      setTimeout(() => setTasksGenerated(false), 3000);
    }
  };

  const handleContinue = async () => {
    await savePRD();
    await supabase
      .from('projects')
      .update({ current_stage: 'workbench' })
      .eq('id', currentProject?.id);
    setCurrentStage('workbench');
  };

  const priorityLabels = {
    must_have: { label: 'Must Have', color: 'text-red-400 bg-red-900/30 border-red-700/50' },
    should_have: { label: 'Should Have', color: 'text-amber-400 bg-amber-900/30 border-amber-700/50' },
    nice_to_have: { label: 'Nice to Have', color: 'text-green-400 bg-green-900/30 border-green-700/50' },
  };

  const hasValidFeatures = features.some(f => f.name.trim() !== '');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-primary-400" />
          Strategy: PRD & Launch
        </h1>
        <p className="text-primary-400 mt-2">
          Define your tech stack, features, and choose how to build your project.
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isPast = currentStepIndex > index;
          
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => goToStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : isPast
                    ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                    : 'bg-primary-800/50 text-primary-400 hover:bg-primary-800'
                }`}
              >
                {isPast ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-primary-700 flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                )}
                <span className="text-sm font-medium">{step.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${isPast ? 'bg-green-600' : 'bg-primary-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="min-h-[400px]">
        {/* Step 1: Tech Stack */}
        {currentStep === 'tech_stack' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-primary-100 mb-2">Technical Stack</h2>
              <p className="text-sm text-primary-400">
                Choose your technology stack. These choices affect how AI generates code and what patterns it uses.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {(Object.keys(TECH_OPTIONS) as Array<keyof typeof TECH_OPTIONS>).map((category) => (
                <div key={category}>
                  <label className="block text-sm font-medium text-primary-300 mb-2 capitalize">
                    {category === 'additionalTools' ? 'Additional Tools' : category}
                  </label>
                  {category === 'additionalTools' ? (
                    <Input
                      value={techStack.additionalTools}
                      onChange={(e) => setTechStack({ ...techStack, additionalTools: e.target.value })}
                      placeholder="e.g., TailwindCSS, Zod, React Query"
                      className="bg-primary-800"
                    />
                  ) : (
                    <select
                      value={techStack[category as keyof TechStack]}
                      onChange={(e) => setTechStack({ ...techStack, [category]: e.target.value })}
                      className="w-full bg-primary-800 border border-primary-600 rounded-lg px-4 py-2.5 text-primary-100"
                    >
                      {TECH_OPTIONS[category].map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Features */}
        {currentStep === 'features' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary-100 mb-2">Features</h2>
                <p className="text-sm text-primary-400">
                  Define features with user stories and acceptance criteria. Prioritize for MVP.
                </p>
              </div>
              <Button onClick={addFeature} variant="secondary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Feature
              </Button>
            </div>

            {/* Feature Table */}
            <div className="bg-primary-800/30 border border-primary-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-primary-800/50 border-b border-primary-700 text-xs font-medium text-primary-400">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-4">User Story</div>
                <div className="col-span-1 text-center">AC</div>
                <div className="col-span-1"></div>
              </div>

              {features.map((feature, index) => (
                <div key={feature.id} className="border-b border-primary-700/50 last:border-b-0">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                    <div className="col-span-1 text-sm text-primary-400 font-medium">
                      {index + 1}
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={feature.name}
                        onChange={(e) => updateFeature(feature.id, { name: e.target.value })}
                        placeholder="Feature name"
                        className="w-full bg-transparent border-0 border-b border-transparent hover:border-primary-600 focus:border-primary-500 text-sm text-primary-100 px-0 py-1 focus:outline-none focus:ring-0 placeholder:text-primary-600"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={feature.priority}
                        onChange={(e) => updateFeature(feature.id, { priority: e.target.value as Feature['priority'] })}
                        className={`w-full bg-transparent border-0 text-xs px-1 py-1 rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 ${priorityLabels[feature.priority].color}`}
                      >
                        <option value="must_have" className="bg-primary-900 text-primary-100">Must Have</option>
                        <option value="should_have" className="bg-primary-900 text-primary-100">Should Have</option>
                        <option value="nice_to_have" className="bg-primary-900 text-primary-100">Nice to Have</option>
                      </select>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={feature.userStory}
                        onChange={(e) => updateFeature(feature.id, { userStory: e.target.value })}
                        placeholder="As a user, I want..."
                        className="w-full bg-transparent border-0 border-b border-transparent hover:border-primary-600 focus:border-primary-500 text-sm text-primary-300 px-0 py-1 focus:outline-none focus:ring-0 placeholder:text-primary-600"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          expandedFeature === feature.id 
                            ? 'bg-primary-600 text-primary-100' 
                            : 'bg-primary-700/50 text-primary-400 hover:bg-primary-700'
                        }`}
                        title="Acceptance Criteria"
                      >
                        {feature.acceptanceCriteria.filter(c => c).length}
                        {expandedFeature === feature.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="col-span-1 text-right">
                      {features.length > 1 && (
                        <button
                          onClick={() => removeFeature(feature.id)}
                          className="p-1 text-primary-500 hover:text-red-400 transition-colors"
                          title="Remove feature"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Acceptance Criteria */}
                  {expandedFeature === feature.id && (
                    <div className="px-3 pb-3 pt-1 bg-primary-800/30">
                      <div className="pl-6 space-y-1">
                        <label className="block text-xs font-medium text-primary-400 mb-2">
                          Acceptance Criteria
                        </label>
                        {feature.acceptanceCriteria.map((criteria, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <CheckCircle2 className="w-3 h-3 text-primary-500 flex-shrink-0" />
                            <input
                              type="text"
                              value={criteria}
                              onChange={(e) => updateAcceptanceCriteria(feature.id, i, e.target.value)}
                              placeholder="User can..."
                              className="flex-1 bg-primary-900/50 border border-primary-700 rounded px-2 py-1 text-sm text-primary-200 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-primary-600"
                            />
                            {feature.acceptanceCriteria.length > 1 && (
                              <button
                                onClick={() => removeAcceptanceCriteria(feature.id, i)}
                                className="p-1 text-primary-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addAcceptanceCriteria(feature.id)}
                          className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 mt-2"
                        >
                          <Plus className="w-3 h-3" />
                          Add criteria
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Out of Scope */}
        {currentStep === 'out_of_scope' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-primary-100 mb-2">Out of Scope (MVP)</h2>
              <p className="text-sm text-primary-400">
                Explicitly list what you're NOT building for MVP. This helps AI stay focused and prevents scope creep.
              </p>
            </div>

            <Textarea
              value={outOfScope}
              onChange={(e) => setOutOfScope(e.target.value)}
              placeholder="- Advanced analytics dashboard&#10;- Social login (Google, Facebook)&#10;- Mobile app (web only for MVP)&#10;- Multi-language support&#10;- Payment processing (v2)"
              rows={8}
              className="bg-primary-800"
            />

            <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-300 mb-1">Why This Matters</h4>
                  <p className="text-sm text-amber-200/80">
                    Being explicit about what you're NOT building is just as important as defining what you are building.
                    It helps AI focus on the core features and prevents unnecessary complexity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Choose Your Path */}
        {currentStep === 'choose_path' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-primary-100 mb-2">Choose Your Path</h2>
              <p className="text-sm text-primary-400">
                How would you like to build your project?
              </p>
            </div>

            {/* Validation Errors */}
            {!validation.valid && (
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-300 mb-2">Complete Required Fields</h4>
                    <ul className="text-sm text-amber-200/80 space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Path Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Bolt.new Path */}
              <button
                onClick={() => setSelectedPath('bolt')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  selectedPath === 'bolt'
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-primary-700 bg-primary-800/30 hover:border-primary-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-primary-100">Bolt.new</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-purple-600/30 border border-purple-500/50 rounded-full text-purple-300">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-primary-400">
                      Start in Bolt.new with AI-assisted scaffolding and live preview. Best for new projects.
                    </p>
                  </div>
                  {selectedPath === 'bolt' && (
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  )}
                </div>
              </button>

              {/* Local + TaskMaster Path */}
              <button
                onClick={() => setSelectedPath('local')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  selectedPath === 'local'
                    ? 'border-cyan-500 bg-cyan-900/20'
                    : 'border-primary-700 bg-primary-800/30 hover:border-primary-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl">
                    <Terminal className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary-100 mb-2">Local + TaskMaster</h3>
                    <p className="text-sm text-primary-400">
                      Generate a PRD and use TaskMaster AI with Claude Code locally. Best if you already have a codebase.
                    </p>
                  </div>
                  {selectedPath === 'local' && (
                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
              </button>
            </div>

            {/* Bolt.new Content */}
            {selectedPath === 'bolt' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-purple-900/20 border border-purple-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-purple-200 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Your Bolt.new MVP Prompt
                  </h3>
                  
                  {generatedBoltPrompt ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <textarea
                          value={generatedBoltPrompt}
                          readOnly
                          className="w-full h-64 bg-primary-900 border border-primary-700 rounded-lg p-4 text-sm text-primary-200 font-mono resize-none focus:outline-none"
                        />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <Button
                            onClick={() => copyToClipboard(generatedBoltPrompt, 'bolt-prompt')}
                            variant="secondary"
                            size="sm"
                          >
                            {copied === 'bolt-prompt' ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={() => window.open('https://bolt.new', '_blank')}
                          className="bg-purple-600 hover:bg-purple-500"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Bolt.new
                        </Button>
                        <p className="text-sm text-purple-300/70 flex items-center">
                          Copy the prompt, then paste it into Claude Code in Bolt.new
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-purple-300/70">
                      Complete the required fields above to generate your prompt.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Local + TaskMaster Content */}
            {selectedPath === 'local' && (
              <div className="space-y-4 animate-fade-in">
                {/* PRD Display */}
                <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-cyan-200 flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-cyan-400" />
                      Generated PRD
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => copyToClipboard(generatePRDContent(), 'prd')}
                        variant="ghost"
                        size="sm"
                      >
                        {copied === 'prd' ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button onClick={savePRD} loading={saving} size="sm">
                        Save PRD
                      </Button>
                    </div>
                  </div>
                  
                  <textarea
                    value={generatePRDContent()}
                    readOnly
                    className="w-full h-48 bg-primary-900 border border-primary-700 rounded-lg p-4 text-sm text-primary-200 font-mono resize-none focus:outline-none"
                  />
                </div>

                {/* Task Parser */}
                <TaskParser
                  prdContent={generatePRDContent()}
                  onTasksGenerated={handleTasksGenerated}
                  existingTaskCount={existingTaskCount}
                />

                {/* Success message */}
                {tasksGenerated && (
                  <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg flex items-center gap-3 animate-fade-in">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-300">Tasks added successfully! View them in the Workbench.</span>
                  </div>
                )}

                {/* TaskMaster Setup (Collapsible) */}
                <div className="border border-primary-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowTaskmasterSetup(!showTaskmasterSetup)}
                    className="w-full flex items-center justify-between p-4 bg-primary-800/50 hover:bg-primary-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Terminal className="w-5 h-5 text-cyan-400" />
                      <span className="font-medium text-primary-100">TaskMaster AI Setup Instructions</span>
                    </div>
                    {showTaskmasterSetup ? (
                      <ChevronUp className="w-5 h-5 text-primary-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-primary-400" />
                    )}
                  </button>

                  {showTaskmasterSetup && (
                    <div className="p-6 space-y-6 animate-fade-in">
                      {/* Critical Warning */}
                      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-red-300 mb-1">Don't Start from Scratch!</h4>
                            <p className="text-sm text-red-200/80">
                              Do NOT let AI bootstrap your codebase from an empty project. Use a CLI, template, or starter kit first.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Step 1 */}
                      <div>
                        <h4 className="text-sm font-semibold text-primary-100 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs">1</span>
                          Install TaskMaster MCP
                        </h4>
                        <div className="relative">
                          <pre className="bg-primary-900 border border-primary-700 rounded-lg p-3 overflow-x-auto">
                            <code className="text-sm text-primary-200">npx @anthropic-ai/claude-code mcp add task-master-ai</code>
                          </pre>
                          <button
                            onClick={() => copyToClipboard('npx @anthropic-ai/claude-code mcp add task-master-ai', 'install')}
                            className="absolute top-2 right-2 p-1.5 hover:bg-primary-700 rounded"
                          >
                            {copied === 'install' ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-primary-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div>
                        <h4 className="text-sm font-semibold text-primary-100 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs">2</span>
                          Save PRD to scripts/prd.txt
                        </h4>
                        <div className="bg-primary-900 border border-primary-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-primary-300 mb-2">
                            <Folder className="w-4 h-4" />
                            <span className="text-sm font-medium">Project Structure</span>
                          </div>
                          <pre className="text-sm text-primary-400 pl-4">
{`your-project/
├── scripts/
│   └── prd.txt          <- Your PRD goes here
├── tasks/
│   └── tasks.json       <- Generated by TaskMaster
└── ...`}
                          </pre>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div>
                        <h4 className="text-sm font-semibold text-primary-100 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs">3</span>
                          Initialize Tasks in Claude Code
                        </h4>
                        <div className="relative">
                          <pre className="bg-primary-900 border border-primary-700 rounded-lg p-3">
                            <code className="text-sm text-primary-200">"Initialize taskmaster and parse my PRD to create tasks"</code>
                          </pre>
                          <button
                            onClick={() => copyToClipboard('Initialize taskmaster and parse my PRD to create tasks', 'init')}
                            className="absolute top-2 right-2 p-1.5 hover:bg-primary-700 rounded"
                          >
                            {copied === 'init' ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-primary-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* JSON Parsing Workaround Warning */}
                      <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-sm font-semibold text-amber-300 mb-2">Known Issue: JSON Parsing Error</h5>
                            <p className="text-xs text-amber-200/80 mb-3">
                              Claude Code may encounter a JSON parsing error when trying to parse the PRD file directly:
                            </p>
                            <pre className="bg-amber-950/50 border border-amber-800/50 rounded p-2 mb-3 overflow-x-auto">
                              <code className="text-xs text-amber-200/70">taskmaster-ai:parse_prd (MCP) Error: Unterminated string in JSON at position 14000</code>
                            </pre>
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-amber-300">Workaround:</p>
                              <ol className="text-xs text-amber-200/80 space-y-1 list-decimal list-inside">
                                <li>Use Cursor (or another AI coding tool) to generate initial tasks from your PRD</li>
                                <li>Then switch back to Claude Code and continue with task implementation</li>
                              </ol>
                              <p className="text-xs text-amber-200/60 italic mt-2">
                                This is a temporary limitation that may be resolved in future updates.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Search className="w-4 h-4 text-cyan-400 mt-0.5" />
                            <div>
                              <h5 className="text-xs font-medium text-cyan-300">Analyze Complexity</h5>
                              <p className="text-xs text-cyan-200/70 mt-1">
                                Ask Claude to analyze task complexity and break down high-complexity tasks.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <GitBranch className="w-4 h-4 text-green-400 mt-0.5" />
                            <div>
                              <h5 className="text-xs font-medium text-green-300">Commit Often!</h5>
                              <p className="text-xs text-green-200/70 mt-1">
                                Claude Code doesn't auto-checkpoint. Commit after each task.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <a
                        href="https://github.com/eyaltoledano/claude-task-master"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
                      >
                        <BookOpen className="w-4 h-4" />
                        View TaskMaster documentation
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={goPrev}
          disabled={!canGoPrev}
          variant="ghost"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-3">
          {canGoNext ? (
            <Button onClick={goNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleContinue} disabled={!hasValidFeatures}>
              Continue to Workbench
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
