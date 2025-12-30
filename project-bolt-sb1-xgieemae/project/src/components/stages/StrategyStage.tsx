import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Button, Card, Input, Textarea, AIHelperButton } from '../ui';
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
  Folder,
  FileText,
  Download,
  Eye,
  Package,
  Settings,
  Zap,
} from 'lucide-react';
import {
  generatePRDPrompt,
  generateBoltMetaPrompt,
  generateTaskmasterConfig,
  generateMCPConfig,
  generatePRDPlaceholder,
  generateVisionMarkdown,
  generateUserProfileMarkdown,
  downloadFile,
  downloadJSON,
  type ProjectContext,
} from '../../lib/launchFileGenerators';
import { generateClaudeMd, fetchProjectData } from '../../lib/claudeExport';

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

type StrategyStep = 'tech_stack' | 'features' | 'out_of_scope' | 'prepare_launch';

const STEPS: { id: StrategyStep; label: string; description: string }[] = [
  { id: 'tech_stack', label: 'Tech Stack', description: 'Choose your technology stack' },
  { id: 'features', label: 'Features', description: 'Define your MVP features' },
  { id: 'out_of_scope', label: 'Out of Scope', description: 'What NOT to build' },
  { id: 'prepare_launch', label: 'Prepare for Launch', description: 'Generate files and prompts' },
];

const TECH_OPTIONS = {
  frontend: [
    { value: 'react-vite', label: 'React + TypeScript + Vite', description: 'Fast, modern React setup with Vite bundler' },
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
    { value: 'sqlite-better', label: 'SQLite (better-sqlite3)', description: 'Fast native SQLite for Node.js/Electron' },
    { value: 'sqlite-sqljs', label: 'SQLite (sql.js)', description: 'SQLite compiled to WebAssembly for browsers' },
    { value: 'firebase', label: 'Firebase', description: 'NoSQL document database' },
  ],
  deployment: [
    { value: 'vercel', label: 'Vercel', description: 'Best for Next.js and React apps' },
    { value: 'netlify', label: 'Netlify', description: 'Great for static sites and serverless' },
    { value: 'railway', label: 'Railway', description: 'Good for full-stack apps with databases' },
    { value: 'electron', label: 'Electron', description: 'Desktop app with native OS integration' },
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
  
  // "Started in Bolt" checkbox state
  const [startedInBolt, setStartedInBolt] = useState(false);
  
  // Handle "Started in Bolt" checkbox change
  const handleBoltCheckboxChange = (checked: boolean) => {
    setStartedInBolt(checked);
    if (checked) {
      // Auto-populate with Bolt defaults
      setTechStack({
        frontend: 'react-vite',
        backend: 'none',
        database: 'none',
        deployment: 'local',
        additionalTools: 'TailwindCSS, Shadcn UI',
      });
    }
  };
  
  // Features state
  const [features, setFeatures] = useState<Feature[]>([
    { id: '1', name: '', userStory: '', priority: 'must_have', acceptanceCriteria: [''] },
  ]);
  const [expandedFeature, setExpandedFeature] = useState<string | null>('1');
  
  // Out of scope state
  const [outOfScope, setOutOfScope] = useState('');
  
  // Prepare for Launch state
  const [copied, setCopied] = useState<string | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [previewContent, setPreviewContent] = useState<{ title: string; content: string } | null>(null);
  
  // PRD state
  const [prdContent, setPrdContent] = useState('');

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

  // Generate project context for launch file generators
  const projectContext: ProjectContext = {
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
      persona_name: userProfile.persona_name || '',
      persona_role: userProfile.persona_role || '',
    },
    features,
    techStack,
    outOfScope,
  };

  // Check if we have minimum required data
  const hasRequiredData = vision.problem && vision.target_user && userProfile.primary_user && userProfile.goal;

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
    <div className="mx-auto space-y-8 max-w-5xl">
      <div>
        <h1 className="flex gap-3 items-center text-3xl font-bold text-primary-100">
          <ListChecks className="w-8 h-8 text-primary-400" />
          Strategy: PRD & Launch
        </h1>
        <p className="mt-2 text-primary-400">
          Define your tech stack, features, and choose how to build your project.
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex gap-2 items-center">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isPast = currentStepIndex > index;
          
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => goToStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-white bg-primary-600'
                    : isPast
                    ? 'text-green-400 border bg-green-900/30 border-green-700/50'
                    : 'bg-primary-800/50 text-primary-400 hover:bg-primary-800'
                }`}
              >
                {isPast ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="flex justify-center items-center w-5 h-5 text-xs rounded-full bg-primary-700">
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
              <h2 className="mb-2 text-xl font-semibold text-primary-100">Technical Stack</h2>
              <p className="text-sm text-primary-400">
                Choose your technology stack. These choices affect how AI generates code and what patterns it uses.
              </p>
            </div>

            {/* "Started in Bolt" checkbox */}
            <div className="flex items-center gap-2 p-3 bg-primary-800/50 rounded-lg border border-primary-700">
              <input
                type="checkbox"
                id="started-in-bolt"
                checked={startedInBolt}
                onChange={(e) => handleBoltCheckboxChange(e.target.checked)}
                className="w-4 h-4 rounded border-primary-600 bg-primary-900 text-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              <label htmlFor="started-in-bolt" className="text-sm text-primary-200 cursor-pointer">
                Started in Bolt.new
              </label>
              <span className="text-xs text-primary-400 ml-2">
                (Auto-populates recommended defaults for Bolt projects)
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(Object.keys(TECH_OPTIONS) as Array<keyof typeof TECH_OPTIONS>).map((category) => (
                <div key={category}>
                  <label className="block mb-2 text-sm font-medium capitalize text-primary-300">
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
            <div className="flex justify-between items-center">
              <div>
                <h2 className="mb-2 text-xl font-semibold text-primary-100">Features</h2>
                <p className="text-sm text-primary-400">
                  Define features with user stories and acceptance criteria. Prioritize for MVP.
                </p>
              </div>
              <Button onClick={addFeature} variant="secondary" size="sm">
                <Plus className="mr-1 w-4 h-4" />
                Add Feature
              </Button>
            </div>

            {/* Feature Table */}
            <div className="overflow-hidden rounded-lg border bg-primary-800/30 border-primary-700">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium border-b bg-primary-800/50 border-primary-700 text-primary-400">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-4">User Story</div>
                <div className="col-span-1 text-center">AC</div>
                <div className="col-span-1"></div>
              </div>

              {features.map((feature, index) => (
                <div key={feature.id} className="border-b border-primary-700/50 last:border-b-0">
                  <div className="grid grid-cols-12 gap-2 items-center px-3 py-2">
                    <div className="col-span-1 text-sm font-medium text-primary-400">
                      {index + 1}
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={feature.name}
                        onChange={(e) => updateFeature(feature.id, { name: e.target.value })}
                        placeholder="Feature name"
                        className="px-0 py-1 w-full text-sm bg-transparent border-0 border-b border-transparent hover:border-primary-600 focus:border-primary-500 text-primary-100 focus:outline-none focus:ring-0 placeholder:text-primary-600"
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
                    <div className="col-span-4 flex items-center gap-1">
                      <input
                        type="text"
                        value={feature.userStory}
                        onChange={(e) => updateFeature(feature.id, { userStory: e.target.value })}
                        placeholder="As a user, I want..."
                        className="px-0 py-1 w-full text-sm bg-transparent border-0 border-b border-transparent hover:border-primary-600 focus:border-primary-500 text-primary-300 focus:outline-none focus:ring-0 placeholder:text-primary-600"
                      />
                      <AIHelperButton
                        content={feature.userStory}
                        contentType="userStory"
                        onImprove={(improved) => updateFeature(feature.id, { userStory: improved })}
                        fieldLabel="user story"
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
                          className="p-1 transition-colors text-primary-500 hover:text-red-400"
                          title="Remove feature"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Acceptance Criteria */}
                  {expandedFeature === feature.id && (
                    <div className="px-3 pt-1 pb-3 bg-primary-800/30">
                      <div className="pl-6 space-y-1">
                        <label className="block mb-2 text-xs font-medium text-primary-400">
                          Acceptance Criteria
                        </label>
                        {feature.acceptanceCriteria.map((criteria, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <CheckCircle2 className="flex-shrink-0 w-3 h-3 text-primary-500" />
                            <input
                              type="text"
                              value={criteria}
                              onChange={(e) => updateAcceptanceCriteria(feature.id, i, e.target.value)}
                              placeholder="User can..."
                              className="flex-1 px-2 py-1 text-sm rounded border bg-primary-900/50 border-primary-700 text-primary-200 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-primary-600"
                            />
                            {feature.acceptanceCriteria.length > 1 && (
                              <button
                                onClick={() => removeAcceptanceCriteria(feature.id, i)}
                                className="p-1 transition-colors text-primary-500 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addAcceptanceCriteria(feature.id)}
                          className="flex gap-1 items-center mt-2 text-xs text-primary-400 hover:text-primary-300"
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
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-xl font-semibold text-primary-100">Out of Scope (MVP)</h2>
                <p className="text-sm text-primary-400">
                  Explicitly list what you're NOT building for MVP. This helps AI stay focused and prevents scope creep.
                </p>
              </div>
              <AIHelperButton
                content={outOfScope}
                contentType="outOfScope"
                onImprove={(improved) => setOutOfScope(improved)}
                fieldLabel="out of scope"
              />
            </div>

            <Textarea
              value={outOfScope}
              onChange={(e) => setOutOfScope(e.target.value)}
              placeholder="- Advanced analytics dashboard&#10;- Social login (Google, Facebook)&#10;- Mobile app (web only for MVP)&#10;- Multi-language support&#10;- Payment processing (v2)"
              rows={8}
              className="bg-primary-800"
            />

            <div className="p-4 rounded-lg border bg-amber-900/20 border-amber-700/50">
              <div className="flex gap-3 items-start">
                <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="mb-1 font-medium text-amber-300">Why This Matters</h4>
                  <p className="text-sm text-amber-200/80">
                    Being explicit about what you're NOT building is just as important as defining what you are building.
                    It helps AI focus on the core features and prevents unnecessary complexity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Prepare for Launch */}
        {currentStep === 'prepare_launch' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-primary-100">Prepare for Launch</h2>
              <p className="text-sm text-primary-400">
                Generate the prompts and files you need to build your project with AI.
              </p>
            </div>

            {/* Validation Warning */}
            {!hasRequiredData && (
              <div className="p-4 rounded-lg border bg-amber-900/20 border-amber-700/50">
                <div className="flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="mb-2 font-medium text-amber-300">Complete Required Fields</h4>
                    <p className="text-sm text-amber-200/80">
                      Go back to the Foundation tab and complete: Problem Statement, Target User, Primary User, and User Goal.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Start Guide (Collapsible) */}
            <div className="overflow-hidden rounded-xl border border-primary-700">
              <button
                onClick={() => setShowQuickStart(!showQuickStart)}
                className="flex justify-between items-center p-4 w-full bg-gradient-to-r transition-colors from-purple-900/30 to-cyan-900/30 hover:from-purple-900/40 hover:to-cyan-900/40"
              >
                <div className="flex gap-3 items-center">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <span className="font-medium text-primary-100">Quick Start Guide - Vibe Coding Workflow</span>
                </div>
                {showQuickStart ? (
                  <ChevronUp className="w-5 h-5 text-primary-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-primary-400" />
                )}
              </button>

              {showQuickStart && (
                <div className="p-4 space-y-3 bg-primary-800/30 animate-fade-in">
                  <div className="grid gap-3 text-center md:grid-cols-5">
                    <div className="p-3 rounded-lg bg-primary-900/50">
                      <div className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-purple-300 rounded-full bg-purple-600/30">1</div>
                      <p className="text-xs text-primary-300">Copy PRD Prompt → Paste in Claude</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary-900/50">
                      <div className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-purple-300 rounded-full bg-purple-600/30">2</div>
                      <p className="text-xs text-primary-300">Copy Bolt Prompt → Paste in Claude</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary-900/50">
                      <div className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-purple-300 rounded-full bg-purple-600/30">3</div>
                      <p className="text-xs text-primary-300">Paste generated prompt in Bolt.new</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary-900/50">
                      <div className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-cyan-300 rounded-full bg-cyan-600/30">4</div>
                      <p className="text-xs text-primary-300">Download project locally</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary-900/50">
                      <div className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-cyan-300 rounded-full bg-cyan-600/30">5</div>
                      <p className="text-xs text-primary-300">Use TaskMaster + Copilot</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section A: AI Prompts */}
            <div className="space-y-4">
              <h3 className="flex gap-2 items-center text-lg font-semibold text-primary-100">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Prompts
                <span className="ml-2 text-xs font-normal text-primary-400">Copy & paste into ChatGPT or Claude</span>
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* PRD Generator Prompt */}
                <div className="p-4 rounded-xl border bg-purple-900/20 border-purple-700/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="flex gap-2 items-center font-medium text-purple-200">
                        <FileText className="w-4 h-4 text-purple-400" />
                        PRD Generator Prompt
                      </h4>
                      <p className="mt-1 text-xs text-purple-300/70">
                        Generates a detailed PRD for TaskMaster
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setPreviewContent({ 
                          title: 'PRD Generator Prompt', 
                          content: generatePRDPrompt(projectContext) 
                        })}
                        variant="ghost"
                        size="sm"
                        disabled={!hasRequiredData}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(generatePRDPrompt(projectContext), 'prd-prompt')}
                        variant="secondary"
                        size="sm"
                        disabled={!hasRequiredData}
                      >
                        {copied === 'prd-prompt' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-purple-200/60">
                    Save the AI's output as <code className="px-1 rounded bg-purple-900/50">scripts/prd.txt</code>
                  </p>
                </div>

                {/* Bolt Meta-Prompt */}
                <div className="p-4 rounded-xl border bg-cyan-900/20 border-cyan-700/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="flex gap-2 items-center font-medium text-cyan-200">
                        <Rocket className="w-4 h-4 text-cyan-400" />
                        Bolt Prompt Generator
                      </h4>
                      <p className="mt-1 text-xs text-cyan-300/70">
                        Creates an optimized prompt for Bolt.new
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setPreviewContent({ 
                          title: 'Bolt Prompt Generator', 
                          content: generateBoltMetaPrompt(projectContext) 
                        })}
                        variant="ghost"
                        size="sm"
                        disabled={!hasRequiredData}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(generateBoltMetaPrompt(projectContext), 'bolt-meta')}
                        variant="secondary"
                        size="sm"
                        disabled={!hasRequiredData}
                      >
                        {copied === 'bolt-meta' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => window.open('https://bolt.new', '_blank')}
                      size="sm"
                      className="text-xs bg-cyan-600 hover:bg-cyan-500"
                    >
                      <ExternalLink className="mr-1 w-3 h-3" />
                      Open Bolt.new
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Project Files */}
            <div className="space-y-4">
              <h3 className="flex gap-2 items-center text-lg font-semibold text-primary-100">
                <FileText className="w-5 h-5 text-green-400" />
                Project Files
                <span className="ml-2 text-xs font-normal text-primary-400">Download for your project</span>
              </h3>

              <div className="p-4 rounded-xl border bg-primary-800/30 border-primary-700">
                <div className="grid gap-3 md:grid-cols-3">
                  {/* CLAUDE.md */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary-900/50">
                    <div className="flex gap-2 items-center">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-sm text-primary-200">CLAUDE.md</span>
                        <p className="text-xs text-primary-500">Project root</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={async () => {
                          if (currentProject) {
                            const data = await fetchProjectData(currentProject.id);
                            if (data) {
                              setPreviewContent({ title: 'CLAUDE.md', content: generateClaudeMd(data) });
                            }
                          }
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={async () => {
                          if (currentProject) {
                            const data = await fetchProjectData(currentProject.id);
                            if (data) {
                              downloadFile(generateClaudeMd(data), 'CLAUDE.md');
                            }
                          }
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 0_vision.md */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary-900/50">
                    <div className="flex gap-2 items-center">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-sm text-primary-200">0_vision.md</span>
                        <p className="text-xs text-primary-500">Project root</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setPreviewContent({ 
                          title: '0_vision.md', 
                          content: generateVisionMarkdown(projectContext.vision, projectContext.projectName) 
                        })}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => downloadFile(
                          generateVisionMarkdown(projectContext.vision, projectContext.projectName), 
                          '0_vision.md'
                        )}
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 1_user_profile.md */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary-900/50">
                    <div className="flex gap-2 items-center">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="text-sm text-primary-200">1_user_profile.md</span>
                        <p className="text-xs text-primary-500">Project root</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setPreviewContent({ 
                          title: '1_user_profile.md', 
                          content: generateUserProfileMarkdown(projectContext.userProfile, projectContext.projectName) 
                        })}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => downloadFile(
                          generateUserProfileMarkdown(projectContext.userProfile, projectContext.projectName), 
                          '1_user_profile.md'
                        )}
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section C: TaskMaster Setup Files */}
            <div className="space-y-4">
              <h3 className="flex gap-2 items-center text-lg font-semibold text-primary-100">
                <Settings className="w-5 h-5 text-cyan-400" />
                TaskMaster Setup
                <span className="ml-2 text-xs font-normal text-primary-400">For local development with Claude Code</span>
              </h3>

              <div className="p-4 rounded-xl border bg-cyan-900/20 border-cyan-700/50">
                <div className="grid gap-3 mb-4 md:grid-cols-2">
                  {/* .taskmaster/config.json */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary-900/50">
                    <div className="flex gap-2 items-center">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-sm text-primary-200">.taskmaster/config.json</span>
                        <p className="text-xs text-primary-500">.taskmaster/ folder</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setPreviewContent({ 
                          title: '.taskmaster/config.json', 
                          content: generateTaskmasterConfig(projectContext.projectName) 
                        })}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => downloadJSON(
                          generateTaskmasterConfig(projectContext.projectName), 
                          'config.json'
                        )}
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* .mcp.json */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary-900/50">
                    <div className="flex gap-2 items-center">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-sm text-primary-200">.mcp.json</span>
                        <p className="text-xs text-primary-500">Project root</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setPreviewContent({ 
                          title: '.mcp.json', 
                          content: generateMCPConfig() 
                        })}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => downloadJSON(generateMCPConfig(), '.mcp.json')}
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* scripts/prd.txt template */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary-900/50">
                    <div className="flex gap-2 items-center">
                      <ListChecks className="w-4 h-4 text-green-400" />
                      <div>
                        <span className="text-sm text-primary-200">scripts/prd.txt</span>
                        <p className="text-xs text-primary-500">scripts/ folder (template)</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setPreviewContent({ 
                          title: 'scripts/prd.txt (template)', 
                          content: generatePRDPlaceholder(projectContext.projectName) 
                        })}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => downloadFile(
                          generatePRDPlaceholder(projectContext.projectName), 
                          'prd.txt'
                        )}
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Download All as ZIP */}
                  <div className="flex justify-center items-center p-3 bg-gradient-to-r rounded-lg border from-purple-900/30 to-cyan-900/30 border-primary-600/50">
                    <Button
                      onClick={async () => {
                        const JSZip = (await import('jszip')).default;
                        const zip = new JSZip();
                        
                        // Add files
                        if (currentProject) {
                          const projectData = await fetchProjectData(currentProject.id);
                          if (projectData) {
                            zip.file('CLAUDE.md', generateClaudeMd(projectData));
                          }
                        }
                        zip.file('0_vision.md', generateVisionMarkdown(projectContext.vision, projectContext.projectName));
                        zip.file('1_user_profile.md', generateUserProfileMarkdown(projectContext.userProfile, projectContext.projectName));
                        
                        // TaskMaster files
                        const taskmaster = zip.folder('.taskmaster');
                        taskmaster?.file('config.json', generateTaskmasterConfig(projectContext.projectName));
                        zip.file('.mcp.json', generateMCPConfig());
                        
                        const scripts = zip.folder('scripts');
                        scripts?.file('prd.txt', generatePRDPlaceholder(projectContext.projectName));
                        
                        // Generate and download
                        const blob = await zip.generateAsync({ type: 'blob' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${projectContext.projectName.replace(/\s+/g, '-').toLowerCase()}-launch-files.zip`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
                    >
                      <Package className="mr-2 w-4 h-4" />
                      Download All as ZIP
                    </Button>
                  </div>
                </div>

                {/* Folder Structure Reference */}
                <div className="p-3 mt-4 rounded-lg bg-primary-900/50">
                  <div className="flex gap-2 items-center mb-2 text-primary-300">
                    <Folder className="w-4 h-4" />
                    <span className="text-sm font-medium">Target File Structure</span>
                  </div>
                  <pre className="pl-4 font-mono text-xs text-primary-400">
{`your-project/
├── CLAUDE.md                 <- Claude Code context
├── 0_vision.md               <- Vision document
├── 1_user_profile.md         <- User profile
├── .mcp.json                  <- MCP server config
├── .taskmaster/
│   └── config.json           <- TaskMaster config
├── scripts/
│   └── prd.txt               <- Your AI-generated PRD
└── tasks/
    └── tasks.json            <- Generated by TaskMaster`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Preview Modal */}
            {previewContent && (
              <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/70">
                <div className="bg-primary-900 border border-primary-700 rounded-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b border-primary-700">
                    <h3 className="font-semibold text-primary-100">{previewContent.title}</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => copyToClipboard(previewContent.content, 'preview')}
                        variant="secondary"
                        size="sm"
                      >
                        {copied === 'preview' ? <Check className="mr-1 w-4 h-4" /> : <Copy className="mr-1 w-4 h-4" />}
                        {copied === 'preview' ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button
                        onClick={() => setPreviewContent(null)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-auto flex-1 p-4">
                    <pre className="font-mono text-sm whitespace-pre-wrap text-primary-200">
                      {previewContent.content}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={goPrev}
          disabled={!canGoPrev}
          variant="ghost"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-3">
          {canGoNext ? (
            <Button onClick={goNext}>
              Next
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleContinue} disabled={!hasValidFeatures}>
              Continue to Workbench
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
