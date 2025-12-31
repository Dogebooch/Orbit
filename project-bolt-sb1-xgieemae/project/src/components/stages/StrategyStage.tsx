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
  Package,
  Settings,
  Zap,
  BookMarked,
} from 'lucide-react';
import {
  generateTaskmasterConfig,
  generateMCPConfig,
  generatePRDPlaceholder,
  generateVisionMarkdown,
  generateUserProfileMarkdown,
  generateBoltMetaPrompt,
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

type TechStack = string;

interface ParsedTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  acceptanceCriteria: string[];
  selected: boolean;
}

type StrategyStep = 'features' | 'out_of_scope' | 'bootstrap' | 'copilot' | 'claude_md' | 'prd' | 'config';

const STEPS: { id: StrategyStep; label: string; description: string }[] = [
  { id: 'features', label: 'MVP Features', description: 'Define tech stack and features' },
  { id: 'out_of_scope', label: 'Out of Scope', description: 'What NOT to build' },
  { id: 'bootstrap', label: 'Bootstrap', description: 'Generate codebase with Bolt.new' },
  { id: 'copilot', label: 'Copilot Instructions', description: 'Generate AI instructions from codebase' },
  { id: 'claude_md', label: 'CLAUDE.md', description: 'Generate project guidelines' },
  { id: 'prd', label: 'PRD', description: 'Generate product requirements' },
  { id: 'config', label: 'Config Files', description: 'Download TaskMaster config' },
];


export function StrategyStage() {
  const { currentProject, setCurrentStage } = useApp();
  const [currentStep, setCurrentStep] = useState<StrategyStep>('features');
  const [vision, setVision] = useState<VisionData>({ problem: '', target_user: '', success_metrics: '', target_level: 'mvp' });
  const [userProfile, setUserProfile] = useState<UserProfileData>({ primary_user: '', goal: '' });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Tech stack state
  const [techStack, setTechStack] = useState<TechStack>('');
  
  // Features state
  const [features, setFeatures] = useState<Feature[]>([
    { id: '1', name: '', userStory: '', priority: 'must_have', acceptanceCriteria: [''] },
  ]);
  const [expandedFeature, setExpandedFeature] = useState<string | null>('1');
  
  // Out of scope state
  const [outOfScope, setOutOfScope] = useState('');
  
  // Bootstrap state
  const [bootstrapComplete, setBootstrapComplete] = useState(false);
  
  // Copilot instructions state
  const [copilotInstructions, setCopilotInstructions] = useState('');
  
  // CLAUDE.md state
  const [claudeMdContent, setClaudeMdContent] = useState('');
  
  // PRD state
  const [prdContent, setPrdContent] = useState('');
  
  // Config files state
  const [copied, setCopied] = useState<string | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([]);

  // Research data state
  const [researchData, setResearchData] = useState<{
    apps: Array<{ name: string; what_does_well: string; what_does_poorly: string; key_insight: string }>;
    patterns_to_borrow: string;
    patterns_to_avoid: string;
    opportunity_gap: string;
  } | null>(null);

  useEffect(() => {
    if (currentProject) {
      setIsInitialLoad(true);
      loadData().then(() => {
        // Mark initial load as complete after a short delay to allow state to settle
        setTimeout(() => setIsInitialLoad(false), 500);
      });
    }
  }, [currentProject]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const loadData = async () => {
    if (!currentProject) return;

    // Load project data (for copilot_instructions and bootstrap_complete)
    const { data: projectData } = await supabase
      .from('projects')
      .select('copilot_instructions, bootstrap_complete')
      .eq('id', currentProject.id)
      .maybeSingle();

    if (projectData) {
      setCopilotInstructions(projectData.copilot_instructions || '');
      setBootstrapComplete(projectData.bootstrap_complete || false);
    }

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
      setTechStack(prdData.tech_stack || '');
    }

    // Load research data
    const { data: researchApps } = await supabase
      .from('research_apps')
      .select('name, what_does_well, what_does_poorly, key_insight')
      .eq('project_id', currentProject.id)
      .order('order_index', { ascending: true });

    const { data: researchNotes } = await supabase
      .from('research_notes')
      .select('section, content')
      .eq('project_id', currentProject.id)
      .is('app_id', null);

    if (researchApps || researchNotes) {
      const research: {
        apps: Array<{ name: string; what_does_well: string; what_does_poorly: string; key_insight: string }>;
        patterns_to_borrow: string;
        patterns_to_avoid: string;
        opportunity_gap: string;
      } = {
        apps: researchApps || [],
        patterns_to_borrow: '',
        patterns_to_avoid: '',
        opportunity_gap: '',
      };

      if (researchNotes) {
        researchNotes.forEach((note) => {
          if (note.section === 'patterns_to_borrow') {
            research.patterns_to_borrow = note.content || '';
          } else if (note.section === 'patterns_to_avoid') {
            research.patterns_to_avoid = note.content || '';
          } else if (note.section === 'opportunity_gap') {
            research.opportunity_gap = note.content || '';
          }
        });
      }

      setResearchData(research);
    }

    // Load features from prd_features table
    const { data: featuresData } = await supabase
      .from('prd_features')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('order_index', { ascending: true });

    if (featuresData && featuresData.length > 0) {
      const loadedFeatures: Feature[] = featuresData.map((f) => ({
        id: f.id,
        name: f.name || '',
        userStory: f.user_story || '',
        priority: (f.priority as Feature['priority']) || 'should_have',
        acceptanceCriteria: Array.isArray(f.acceptance_criteria) 
          ? f.acceptance_criteria 
          : f.acceptance_criteria ? [f.acceptance_criteria] : [''],
      }));
      setFeatures(loadedFeatures);
      // Set first feature as expanded if available
      if (loadedFeatures.length > 0) {
        setExpandedFeature(loadedFeatures[0].id);
      }
    } else {
      // Initialize with one empty feature if none exist
      setFeatures([{ id: Date.now().toString(), name: '', userStory: '', priority: 'must_have', acceptanceCriteria: [''] }]);
      setExpandedFeature(null);
    }

    // Load UI state from localStorage
    const savedStep = localStorage.getItem(`strategy_step_${currentProject.id}`);
    if (savedStep && STEPS.some(s => s.id === savedStep)) {
      setCurrentStep(savedStep as StrategyStep);
    }

    const savedExpanded = localStorage.getItem(`strategy_expanded_${currentProject.id}`);
    if (savedExpanded) {
      setExpandedFeature(savedExpanded);
    }

    const savedQuickStart = localStorage.getItem(`strategy_quickstart_${currentProject.id}`);
    if (savedQuickStart !== null) {
      setShowQuickStart(savedQuickStart === 'true');
    }
  };

  // Save strategy data with debouncing
  const saveStrategyData = useCallback(async (silent = false) => {
    if (!currentProject) return;

    if (!silent) setSaving(true);
    try {
      // Save tech stack and out of scope to PRD
      const { data: existingPrd } = await supabase
        .from('prds')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (existingPrd) {
        await supabase
          .from('prds')
          .update({ 
            tech_stack: techStack,
            out_of_scope: outOfScope,
            updated_at: new Date().toISOString() 
          })
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('prds').insert({
          project_id: currentProject.id,
          tech_stack: techStack,
          out_of_scope: outOfScope,
        });
      }

      // Save features to prd_features table
      if (features.length > 0) {
        // Get existing features to determine which to delete
        const { data: existingFeatures } = await supabase
          .from('prd_features')
          .select('id')
          .eq('project_id', currentProject.id);

        const existingIds = new Set(existingFeatures?.map(f => f.id) || []);
        const currentIds = new Set(features.map(f => f.id));

        // Delete features that are no longer in the list
        const idsToDelete = Array.from(existingIds).filter(id => !currentIds.has(id));
        if (idsToDelete.length > 0) {
          await supabase
            .from('prd_features')
            .delete()
            .in('id', idsToDelete);
        }

        // Upsert each feature
        for (let i = 0; i < features.length; i++) {
          const feature = features[i];
          const featureData = {
            project_id: currentProject.id,
            name: feature.name,
            user_story: feature.userStory,
            priority: feature.priority,
            acceptance_criteria: feature.acceptanceCriteria,
            order_index: i,
            updated_at: new Date().toISOString(),
          };

          // Check if feature exists (has UUID format) or is a new timestamp-based ID
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(feature.id);
          
          if (isUUID && existingIds.has(feature.id)) {
            // Update existing feature
            await supabase
              .from('prd_features')
              .update(featureData)
              .eq('id', feature.id);
          } else {
            // Insert new feature (will get new UUID from database)
            const { data: newFeature } = await supabase
              .from('prd_features')
              .insert(featureData)
              .select('id')
              .single();
            
            // Update local state with the new UUID if we got one
            if (newFeature) {
              setFeatures(prev => prev.map(f => 
                f.id === feature.id ? { ...f, id: newFeature.id } : f
              ));
            }
          }
        }
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving strategy data:', err);
    } finally {
      if (!silent) setSaving(false);
    }
  }, [currentProject, techStack, outOfScope, features]);

  // Save copilot instructions
  const saveCopilotInstructions = useCallback(async () => {
    if (!currentProject) return;
    
    try {
      await supabase
        .from('projects')
        .update({ 
          copilot_instructions: copilotInstructions,
          updated_at: new Date().toISOString() 
        })
        .eq('id', currentProject.id);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving copilot instructions:', err);
    }
  }, [currentProject, copilotInstructions]);

  // Save bootstrap status
  const saveBootstrapStatus = useCallback(async () => {
    if (!currentProject) return;
    
    try {
      await supabase
        .from('projects')
        .update({ 
          bootstrap_complete: bootstrapComplete,
          updated_at: new Date().toISOString() 
        })
        .eq('id', currentProject.id);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving bootstrap status:', err);
    }
  }, [currentProject, bootstrapComplete]);

  // Feature management
  const addFeature = async () => {
    const newFeature: Feature = {
      id: Date.now().toString(),
      name: '',
      userStory: '',
      priority: 'should_have',
      acceptanceCriteria: [''],
    };
    setFeatures([...features, newFeature]);
    setExpandedFeature(newFeature.id);
    // Trigger auto-save
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      saveStrategyData(true);
    }, 2000);
    setAutoSaveTimeout(timeout);
  };

  const removeFeature = async (id: string) => {
    const newFeatures = features.filter(f => f.id !== id);
    setFeatures(newFeatures);
    
    // Delete from database immediately
    if (currentProject) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        await supabase
          .from('prd_features')
          .delete()
          .eq('id', id);
      }
    }
  };

  const updateFeature = (id: string, updates: Partial<Feature>) => {
    setFeatures(features.map(f => f.id === id ? { ...f, ...updates } : f));
    // Trigger auto-save
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      saveStrategyData(true);
    }, 2000);
    setAutoSaveTimeout(timeout);
  };

  const addAcceptanceCriteria = (featureId: string) => {
    setFeatures(features.map(f => {
      if (f.id === featureId) {
        return { ...f, acceptanceCriteria: [...f.acceptanceCriteria, ''] };
      }
      return f;
    }));
    // Trigger auto-save
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      saveStrategyData(true);
    }, 2000);
    setAutoSaveTimeout(timeout);
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
    // Trigger auto-save
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      saveStrategyData(true);
    }, 2000);
    setAutoSaveTimeout(timeout);
  };

  const removeAcceptanceCriteria = (featureId: string, index: number) => {
    setFeatures(features.map(f => {
      if (f.id === featureId && f.acceptanceCriteria.length > 1) {
        return { ...f, acceptanceCriteria: f.acceptanceCriteria.filter((_, i) => i !== index) };
      }
      return f;
    }));
    // Trigger auto-save
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      saveStrategyData(true);
    }, 2000);
    setAutoSaveTimeout(timeout);
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

    return `# Product Requirements Document: ${currentProject?.name || 'Project'}

## Project Overview

### Problem Statement
${vision.problem || '_Define in Foundation tab_'}

### Target User
${vision.target_user || '_Define in Foundation tab_'}

### User Goal
${userProfile.goal || '_Define in Foundation tab_'}

## Technical Stack

${techStack || '_Define your tech stack below_'}

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
      // First save strategy data (tech stack, features, out of scope)
      await saveStrategyData(true);
      
      const { data: existing } = await supabase
        .from('prds')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('prds')
          .update({ 
            content, 
            out_of_scope: outOfScope, 
            tech_stack: techStack,
            updated_at: new Date().toISOString() 
          })
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('prds').insert({
          project_id: currentProject.id,
          content,
          out_of_scope: outOfScope,
          tech_stack: techStack,
        });
      }
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving PRD:', err);
    } finally {
      setSaving(false);
    }
  }, [currentProject, generatePRDContent, outOfScope, techStack, saveStrategyData]);

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
    research: researchData || undefined,
  };

  // Check if we have minimum required data
  const hasRequiredData = vision.problem && vision.target_user && userProfile.primary_user && userProfile.goal;


  // Navigation
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const canGoNext = currentStepIndex < STEPS.length - 1;
  const canGoPrev = currentStepIndex > 0;

  // Auto-save on data changes (skip during initial load)
  useEffect(() => {
    if (!currentProject || isInitialLoad) return;
    
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      saveStrategyData(true);
    }, 2000);
    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [techStack, outOfScope, features, currentProject, isInitialLoad]);

  // Save currentStep to localStorage
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem(`strategy_step_${currentProject.id}`, currentStep);
    }
  }, [currentStep, currentProject]);

  // Save expandedFeature to localStorage
  useEffect(() => {
    if (currentProject && expandedFeature !== null) {
      localStorage.setItem(`strategy_expanded_${currentProject.id}`, expandedFeature);
    }
  }, [expandedFeature, currentProject]);

  // Save showQuickStart to localStorage
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem(`strategy_quickstart_${currentProject.id}`, showQuickStart.toString());
    }
  }, [showQuickStart, currentProject]);

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

  // Helper function to format Target Level labels
  const formatTargetLevel = (level: string): { label: string; description: string } => {
    const levels: Record<string, { label: string; description: string }> = {
      poc: { label: 'Proof of Concept', description: 'Demonstrates core functionality. May have rough edges, limited error handling.' },
      mvp: { label: 'MVP (Minimum Viable Product)', description: 'Minimally viable for real users to test. Core features work reliably.' },
      demo: { label: 'Polished Demo', description: 'Ready for presentations or investor demos. Looks professional, handles common paths well.' },
      production: { label: 'Production Ready', description: 'Can handle real users and edge cases. Proper error handling, security, performance.' },
    };
    return levels[level] || { label: level, description: 'Target level not specified' };
  };

  // Generate AI prompt for MVP features generation
  const generateFeaturesPrompt = (): string => {
    const targetLevelInfo = formatTargetLevel(vision.target_level || 'mvp');
    
    return `You are an expert product manager helping to define MVP features for a software project. Based on the following foundation data, generate a comprehensive list of MVP features.

## Project Foundation

### Problem Statement
${vision.problem || 'Not specified'}

### Target User
${vision.target_user || 'Not specified'}

### User Profile
- **Primary User:** ${userProfile.primary_user || 'Not specified'}
- **User Goal:** ${userProfile.goal || 'Not specified'}
- **Context of Use:** ${userProfile.context || 'Not specified'}
- **Key Frustrations:** ${userProfile.frustrations || 'Not specified'}
- **Technical Comfort Level:** ${userProfile.technical_comfort || 'medium'}

### Technical Stack
${techStack || 'Not specified'}

### Target Level
${targetLevelInfo.label}: ${targetLevelInfo.description}

## Your Task

Generate MVP features that:
1. **Directly address the problem statement** - Each feature should solve a specific aspect of the core problem
2. **Support the user's goal** - Features should help the user achieve their stated goal
3. **Consider user context** - Take into account when, where, and how the user will use this
4. **Respect technical comfort level** - Match the complexity to the user's technical comfort
5. **Prioritize appropriately** - Essential features for solving the core problem should be "must_have", supporting features "should_have", and enhancements "nice_to_have"

## Output Format

Return a JSON array of features with this EXACT structure (no markdown, just JSON):

[
  {
    "name": "Feature name (concise, action-oriented)",
    "priority": "must_have" | "should_have" | "nice_to_have",
    "userStory": "As a [user type], I want to [action] so that [benefit]",
    "acceptanceCriteria": [
      "Specific, testable criterion 1",
      "Specific, testable criterion 2",
      "Specific, testable criterion 3"
    ]
  }
]

## Guidelines

- Generate 5-8 features total
- Focus on features that solve the core problem first (must_have)
- Each feature should have 2-4 acceptance criteria
- User stories should be specific and user-focused
- Acceptance criteria should be testable and measurable
- Consider the target level when determining feature completeness

Return ONLY the JSON array, no additional text or markdown code blocks.`;
  };

  const hasValidFeatures = features.some(f => f.name.trim() !== '');

  return (
    <div className="mx-auto space-y-8 max-w-5xl">
      <div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="flex gap-3 items-center text-3xl font-bold text-primary-100">
              <ListChecks className="w-8 h-8 text-primary-400" />
              Strategy: PRD & Launch
            </h1>
            <p className="mt-2 text-primary-400">
              Define your tech stack, features, and choose how to build your project.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {saving && (
              <div className="flex items-center gap-2 text-sm text-primary-400">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Saving...</span>
              </div>
            )}
            {lastSaved && !saving && (
              <div className="text-xs text-primary-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
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
        {/* Step 1: Features */}
        {currentStep === 'features' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-primary-100">Tech Stack</h2>
              <p className="text-sm text-primary-400 mb-3">
                Describe your technology stack (e.g., React + Vite, Next.js, Supabase, etc.)
              </p>
              <Textarea
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g., React + TypeScript + Vite, Supabase, TailwindCSS, Shadcn UI"
                rows={3}
                className="bg-primary-800"
              />
            </div>

            {/* AI Prompt Generator for MVP Features */}
            <div className="p-4 rounded-lg border bg-blue-900/20 border-blue-700/50">
              <div className="flex gap-3 items-start mb-4">
                <Sparkles className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="mb-2 font-medium text-blue-300">Generate MVP Features with AI</h4>
                  <p className="text-sm text-blue-200/80 mb-3">
                    Copy the prompt below and paste it into Gemini or Claude to automatically generate MVP features based on your Foundation data.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-primary-300">AI Features Generation Prompt</label>
                <Button
                  onClick={() => {
                    const prompt = generateFeaturesPrompt();
                    navigator.clipboard.writeText(prompt);
                    setCopied('features');
                    setTimeout(() => setCopied(null), 2000);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  {copied === 'features' ? (
                    <>
                      <Check className="mr-1 w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 w-4 h-4" />
                      Copy Prompt
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={generateFeaturesPrompt()}
                readOnly
                rows={25}
                className="font-mono text-xs bg-primary-900/50 border-primary-700"
              />
              <p className="mt-2 text-xs text-primary-400">
                Paste this prompt into Gemini or Claude. The AI will return a JSON array of features that you can then import into the table below.
              </p>
            </div>

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

        {/* Step 3: Bootstrap with Bolt */}
        {currentStep === 'bootstrap' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-primary-100">Bootstrap with Bolt.new</h2>
              <p className="text-sm text-primary-400">
                Generate your codebase scaffold using Bolt.new. This creates a working project with your tech stack already configured.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-cyan-900/20 border-cyan-700/50">
              <div className="flex gap-3 items-start mb-4">
                <Rocket className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="mb-2 font-medium text-cyan-300">Instructions</h4>
                  <ol className="space-y-2 text-sm text-cyan-200/80 list-decimal list-inside">
                    <li>Copy the prompt below</li>
                    <li>Paste it into Claude.ai or ChatGPT</li>
                    <li>Copy Claude's optimized Bolt.new prompt</li>
                    <li>Paste into Bolt.new and generate your project</li>
                    <li>Download the generated project and extract it</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Target Level Display */}
            <div className="p-4 rounded-lg border bg-purple-900/20 border-purple-700/50">
              <div className="flex gap-3 items-start">
                <Settings className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-purple-300">Target Level</h4>
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-800/50 text-purple-200 border border-purple-700/50">
                      {formatTargetLevel(vision.target_level || 'mvp').label}
                    </span>
                  </div>
                  <p className="text-sm text-purple-200/80 mb-2">
                    {formatTargetLevel(vision.target_level || 'mvp').description}
                  </p>
                  <div className="space-y-1 text-xs text-purple-200/70">
                    <p><strong className="text-purple-300">Source:</strong> Set in the Vision stage (0_vision.md)</p>
                    <p><strong className="text-purple-300">Impact:</strong> This affects how Bolt.new generates code - the level determines code completeness, error handling, and production readiness.</p>
                    <p className="mt-2 italic">
                      Need to change it? Go back to the Vision stage and update your Target Level setting.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-primary-300">Bolt Meta-Prompt</label>
                <Button
                  onClick={() => {
                    const prompt = generateBoltMetaPrompt(projectContext);
                    navigator.clipboard.writeText(prompt);
                    setCopied('bolt');
                    setTimeout(() => setCopied(null), 2000);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  {copied === 'bolt' ? (
                    <>
                      <Check className="mr-1 w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 w-4 h-4" />
                      Copy Prompt
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={generateBoltMetaPrompt(projectContext)}
                readOnly
                rows={15}
                className="font-mono text-xs bg-primary-900/50 border-primary-700"
              />
            </div>

            <div className="flex gap-3 items-center">
              <Button
                onClick={() => window.open('https://bolt.new', '_blank')}
                className="bg-cyan-600 hover:bg-cyan-500"
              >
                <ExternalLink className="mr-2 w-4 h-4" />
                Open Bolt.new
              </Button>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bootstrapComplete}
                  onChange={(e) => {
                    setBootstrapComplete(e.target.checked);
                    saveBootstrapStatus();
                  }}
                  className="w-4 h-4 rounded border-primary-600 bg-primary-800 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-primary-300">I have downloaded my Bolt project</span>
              </label>
            </div>

            <div className="p-4 rounded-lg border bg-amber-900/20 border-amber-700/50">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="mb-1 font-medium text-amber-300">Important</h4>
                  <p className="text-sm text-amber-200/80">
                    Make sure you've downloaded and extracted your Bolt project before continuing. 
                    You'll need the actual codebase for the next step (Copilot Instructions).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Generate Copilot Instructions */}
        {currentStep === 'copilot' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-primary-100">Generate Copilot AI Instructions</h2>
              <p className="text-sm text-primary-400">
                Use GitHub Copilot to analyze your actual codebase and generate AI instructions describing what it found.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-purple-900/20 border-purple-700/50">
              <div className="flex gap-3 items-start mb-4">
                <Terminal className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="mb-2 font-medium text-purple-300">Instructions</h4>
                  <ol className="space-y-2 text-sm text-purple-200/80 list-decimal list-inside">
                    <li>Open your Bolt-generated project in VS Code</li>
                    <li>Open the Copilot Chat panel (or use Command Palette)</li>
                    <li>Find and run "Generate AI Instructions"</li>
                    <li>Save the output to <code className="px-1 bg-primary-800 rounded">.github/copilot-instructions.md</code></li>
                    <li>Paste the content below or upload the file</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-primary-300">
                Copilot Instructions Content
              </label>
              <Textarea
                value={copilotInstructions}
                onChange={(e) => {
                  setCopilotInstructions(e.target.value);
                  // Auto-save after 2 seconds
                  if (autoSaveTimeout) {
                    clearTimeout(autoSaveTimeout);
                  }
                  const timeout = setTimeout(() => {
                    saveCopilotInstructions();
                  }, 2000);
                  setAutoSaveTimeout(timeout);
                }}
                placeholder="Paste the content from .github/copilot-instructions.md here..."
                rows={12}
                className="font-mono text-xs bg-primary-800"
              />
              <p className="mt-2 text-xs text-primary-400">
                This document describes your codebase's actual patterns, frameworks, and conventions.
                It will be used to generate CLAUDE.md and improve PRD quality.
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <Button
                onClick={saveCopilotInstructions}
                variant="secondary"
                size="sm"
              >
                Save Instructions
              </Button>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copilotInstructions.length > 100}
                  disabled
                  className="w-4 h-4 rounded border-primary-600 bg-primary-800 text-purple-600"
                />
                <span className="text-sm text-primary-300">
                  {copilotInstructions.length > 100 ? 'Instructions saved' : 'Paste instructions to continue'}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Generate CLAUDE.md */}
        {currentStep === 'claude_md' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-primary-100">Generate CLAUDE.md</h2>
              <p className="text-sm text-primary-400">
                Create your project guidelines file that Claude Code will automatically load into every conversation.
              </p>
            </div>

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

            <div className="p-4 rounded-lg border bg-green-900/20 border-green-700/50">
              <div className="flex gap-3 items-start mb-4">
                <FileText className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="mb-2 font-medium text-green-300">What is CLAUDE.md?</h4>
                  <p className="text-sm text-green-200/80 mb-2">
                    CLAUDE.md is your project's persistent context file. Claude Code automatically loads it into every conversation,
                    so you don't have to re-explain your tech stack, coding standards, and constraints.
                  </p>
                  <p className="text-sm text-green-200/80">
                    This file combines your foundation documents (vision, user profile, success metrics) with your actual codebase
                    analysis (from Copilot instructions) to create comprehensive project guidelines.
                  </p>
                </div>
              </div>
            </div>

            {copilotInstructions && (
              <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                <div className="flex gap-2 items-center text-sm text-blue-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Copilot instructions detected - will be included in CLAUDE.md</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  if (!currentProject) return;
                  const projectData = await fetchProjectData(currentProject.id);
                  if (projectData) {
                    const content = generateClaudeMd(projectData, copilotInstructions || undefined);
                    setClaudeMdContent(content);
                    // Download the file
                    const blob = new Blob([content], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'CLAUDE.md';
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                disabled={!hasRequiredData}
                className="bg-green-600 hover:bg-green-500"
              >
                <Download className="mr-2 w-4 h-4" />
                Generate & Download CLAUDE.md
              </Button>
            </div>

            {claudeMdContent && (
              <div>
                <label className="block mb-2 text-sm font-medium text-primary-300">Preview</label>
                <Textarea
                  value={claudeMdContent}
                  readOnly
                  rows={20}
                  className="font-mono text-xs bg-primary-900/50 border-primary-700"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 6: Generate PRD */}
        {currentStep === 'prd' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-primary-100">Generate PRD</h2>
              <p className="text-sm text-primary-400">
                Create your Product Requirements Document that TaskMaster will use to generate your task list.
              </p>
            </div>

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

            {copilotInstructions && (
              <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                <div className="flex gap-2 items-center text-sm text-blue-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Copilot instructions will be included in PRD generation prompt</span>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg border bg-purple-900/20 border-purple-700/50">
              <div className="flex gap-3 items-start mb-4">
                <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="mb-2 font-medium text-purple-300">PRD Generation</h4>
                  <p className="text-sm text-purple-200/80 mb-3">
                    Use the PRD Generator Prompt from the Prompt Library. It will combine your foundation documents
                    {copilotInstructions && ' and copilot instructions'} to create a comprehensive PRD.
                  </p>
                  <Button
                    onClick={() => {
                      setCurrentStage('promptlibrary');
                      sessionStorage.setItem('promptLibraryFilter', 'prd');
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <BookMarked className="mr-2 w-4 h-4" />
                    View PRD Generator Prompt
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-primary-300">PRD Content</label>
                <Button
                  onClick={savePRD}
                  variant="secondary"
                  size="sm"
                  disabled={!hasValidFeatures}
                >
                  Save PRD
                </Button>
              </div>
              <Textarea
                value={prdContent}
                onChange={(e) => setPrdContent(e.target.value)}
                placeholder="Paste your generated PRD here, or use the PRD Generator Prompt from the Prompt Library..."
                rows={20}
                className="font-mono text-xs bg-primary-800"
              />
              <p className="mt-2 text-xs text-primary-400">
                Save this PRD to <code className="px-1 bg-primary-800 rounded">scripts/prd.txt</code> in your project for TaskMaster integration.
              </p>
            </div>
          </div>
        )}

        {/* Step 7: Download Config Files */}
        {currentStep === 'config' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-primary-100">Download Config Files</h2>
              <p className="text-sm text-primary-400">
                Download TaskMaster and MCP configuration files for your project.
              </p>
            </div>

            {/* Quick Start Guide (Collapsible) */}
            <div className="overflow-hidden rounded-xl border border-primary-700">
              <button
                onClick={() => setShowQuickStart(!showQuickStart)}
                className="flex justify-between items-center p-4 w-full bg-gradient-to-r transition-colors from-purple-900/30 to-cyan-900/30 hover:from-purple-900/40 hover:to-cyan-900/40"
              >
                <div className="flex gap-3 items-center">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <span className="font-medium text-primary-100">Quick Start Guide - DougHub Workflow</span>
                </div>
                {showQuickStart ? (
                  <ChevronUp className="w-5 h-5 text-primary-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-primary-400" />
                )}
              </button>

              {showQuickStart && (
                <div className="p-4 bg-primary-800/30 animate-fade-in">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 p-3 bg-primary-900/50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center flex-shrink-0">1</span>
                      <div>
                        <p className="text-primary-200 font-medium">Define MVP features and tech stack</p>
                        <p className="text-xs text-primary-400">Complete the Features and Out of Scope steps</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-primary-900/50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center flex-shrink-0">2</span>
                      <div>
                        <p className="text-primary-200 font-medium">Generate Bolt prompt → Use Bolt.new → Download project</p>
                        <p className="text-xs text-primary-400">Extract the project before continuing</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-primary-900/50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center flex-shrink-0">3</span>
                      <div>
                        <p className="text-primary-200 font-medium">Open project in VSCode → Generate Copilot instructions</p>
                        <p className="text-xs text-primary-400">Save to .github/copilot-instructions.md</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-primary-900/50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0">4</span>
                      <div>
                        <p className="text-primary-200 font-medium">Generate CLAUDE.md</p>
                        <p className="text-xs text-primary-400">Using foundation docs + copilot instructions</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-primary-900/50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0">5</span>
                      <div>
                        <p className="text-primary-200 font-medium">Generate PRD</p>
                        <p className="text-xs text-primary-400">Using foundation docs + copilot instructions</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-primary-900/50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center flex-shrink-0">6</span>
                      <div>
                        <p className="text-primary-200 font-medium">Download config files → Place in project</p>
                        <p className="text-xs text-primary-400">Then run <code className="px-1 bg-primary-800 rounded">claude</code> in terminal</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Download Project Files */}
            <div className="space-y-4">
              <h3 className="flex gap-2 items-center text-lg font-semibold text-primary-100">
                <FileText className="w-5 h-5 text-green-400" />
                Project Files
                <span className="ml-2 text-xs font-normal text-primary-400">Download all files for your project</span>
              </h3>

              <div className="p-4 rounded-xl border bg-cyan-900/20 border-cyan-700/50">
                <div className="flex justify-center items-center mb-4">
                  <Button
                    onClick={async () => {
                      const JSZip = (await import('jszip')).default;
                      const zip = new JSZip();
                      
                      // Add files
                      if (currentProject) {
                        const projectData = await fetchProjectData(currentProject.id);
                        if (projectData) {
                          zip.file('CLAUDE.md', generateClaudeMd(projectData, copilotInstructions || undefined));
                        }
                      }
                      zip.file('0_vision.md', generateVisionMarkdown(projectContext.vision, projectContext.projectName));
                      zip.file('1_user_profile.md', generateUserProfileMarkdown(projectContext.userProfile, projectContext.projectName));
                      
                      // TaskMaster files
                      const taskmaster = zip.folder('.taskmaster');
                      taskmaster?.file('config.json', generateTaskmasterConfig(projectContext.projectName));
                      zip.file('.mcp.json', generateMCPConfig());
                      
                      const scripts = zip.folder('scripts');
                      scripts?.file('prd.txt', prdContent || generatePRDPlaceholder(projectContext.projectName));
                      
                      // Generate and download
                      const blob = await zip.generateAsync({ type: 'blob' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${projectContext.projectName.replace(/\s+/g, '-').toLowerCase()}-launch-files.zip`;
                      a.click();
                      URL.revokeObjectURL(url);
                      
                      // Track downloaded files for success message
                      setDownloadedFiles(['CLAUDE.md', '0_vision.md', '1_user_profile.md', '.taskmaster/config.json', '.mcp.json', 'scripts/prd.txt']);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
                  >
                    <Package className="mr-2 w-4 h-4" />
                    Download All as ZIP
                  </Button>
                </div>

                {/* Post-Download Success Message */}
                {downloadedFiles.length > 0 && (
                  <div className="mt-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                    <p className="text-sm text-green-300 font-medium mb-1">Files Downloaded!</p>
                    <p className="text-xs text-green-400">
                      Extract the ZIP and place files in your project root. Then restart Claude Code.
                    </p>
                  </div>
                )}

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
          </div>
        )}

        {/* Legacy step removed - replaced by bootstrap, copilot, claude_md, prd, and config steps */}
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
