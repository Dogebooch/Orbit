import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../ui';
import { Lightbulb, Download, CheckCircle, ChevronRight, FileCode, Sparkles, X } from 'lucide-react';
import { MarkdownEditor } from './vision/MarkdownEditor';
import { ProjectFilesEditor } from './vision/ProjectFilesEditor';
import { ResearchTab } from './vision/ResearchTab';
import { visionToMarkdown, userProfileToMarkdown, successMetricsToMarkdown, markdownToSuccessMetrics } from '../../utils/markdownUtils';
import { hashFoundationData } from '../../config/fileTemplates';

type ActiveDocument = 'vision' | 'profile' | 'metrics' | 'research';

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
  persona_name: string;
  persona_role: string;
  competitor_notes: string;
}

export function VisionStage() {
  const { currentProject, setCurrentStage } = useApp();
  const [vision, setVision] = useState<VisionData>({
    problem: '',
    target_user: '',
    success_metrics: '',
    why_software: '',
    target_level: 'mvp',
  });
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    primary_user: '',
    goal: '',
    context: '',
    frustrations: '',
    technical_comfort: 'medium',
    persona_name: '',
    persona_role: '',
    competitor_notes: '',
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saving, setSaving] = useState(false); // Used in saveData for auto-save
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activeDocument, setActiveDocument] = useState<ActiveDocument>('vision');
  
  // Per-document saving state
  const [savingVision, setSavingVision] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [savingResearch, setSavingResearch] = useState(false);
  const [lastSavedVision, setLastSavedVision] = useState<Date | undefined>();
  const [lastSavedProfile, setLastSavedProfile] = useState<Date | undefined>();
  const [lastSavedMetrics, setLastSavedMetrics] = useState<Date | undefined>();
  const [lastSavedResearch, setLastSavedResearch] = useState<Date | undefined>();
  
  // Success metrics markdown state (used when saving)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [successMetricsMarkdown, setSuccessMetricsMarkdown] = useState<string>(''); // Used in saveData and handleSaveMetrics
  
  // Project Files Generator state
  type ProjectFileType = 'claude' | 'cursorrules' | 'copilot';
  const [activeProjectFile, setActiveProjectFile] = useState<ProjectFileType | null>(null);
  const [projectFilesGenerated, setProjectFilesGenerated] = useState<Set<ProjectFileType>>(new Set());

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const { data: visionData } = await supabase
      .from('visions')
      .select('*')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (visionData) {
      setVision({
        problem: visionData.problem || '',
        target_user: visionData.target_user || '',
        success_metrics: visionData.success_metrics || '',
        why_software: visionData.why_software || '',
        target_level: visionData.target_level || 'mvp',
      });
    }

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (profileData) {
      setUserProfile({
        primary_user: profileData.primary_user || '',
        goal: profileData.goal || '',
        context: profileData.context || '',
        frustrations: profileData.frustrations || '',
        technical_comfort: profileData.technical_comfort || 'medium',
        persona_name: profileData.persona_name || '',
        persona_role: profileData.persona_role || '',
        competitor_notes: profileData.competitor_notes || '',
      });
    }

    // Load success_metrics table data
    const { data: successMetricsData } = await supabase
      .from('success_metrics')
      .select('*')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (successMetricsData) {
      // Load markdown content if available
      if (successMetricsData.markdown_content) {
        setSuccessMetricsMarkdown(successMetricsData.markdown_content);
      }
      // Update vision with target_level from success_metrics if available
      if (successMetricsData.target_level) {
        setVision(prev => ({ ...prev, target_level: successMetricsData.target_level || 'mvp' }));
      }
    }

    // Note: Project config loading is handled elsewhere
    // This section can be expanded to load generated file status if needed
  };

  const saveData = useCallback(async (silent = false) => {
    if (!currentProject) return;

    if (!silent) setSaving(true);
    try {
      const visionMarkdown = visionToMarkdown(vision);
      const profileMarkdown = userProfileToMarkdown(userProfile);
      const metricsMarkdown = successMetricsToMarkdown(vision);

      const { data: existingVision } = await supabase
        .from('visions')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (existingVision) {
        await supabase
          .from('visions')
          .update({
            ...vision,
            markdown_content: visionMarkdown,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('visions').insert({
          project_id: currentProject.id,
          ...vision,
          markdown_content: visionMarkdown,
        });
      }

      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from('user_profiles')
          .update({
            ...userProfile,
            markdown_content: profileMarkdown,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('user_profiles').insert({
          project_id: currentProject.id,
          ...userProfile,
          markdown_content: profileMarkdown,
        });
      }

      // Save success_metrics
      const parsed = markdownToSuccessMetrics(metricsMarkdown);
      const criteria = vision.success_metrics 
        ? vision.success_metrics.split('\n').filter(line => line.trim()).map(line => line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
        : [];
      
      const { data: existingMetrics } = await supabase
        .from('success_metrics')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      const metricsData = {
        project_id: currentProject.id,
        target_level: parsed.target_level || vision.target_level || 'mvp',
        criteria: criteria,
        validation_methods: [],
        timeline: '',
        markdown_content: metricsMarkdown,
        updated_at: new Date().toISOString(),
      };

      if (existingMetrics) {
        await supabase
          .from('success_metrics')
          .update(metricsData)
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('success_metrics').insert(metricsData);
      }

      setSuccessMetricsMarkdown(metricsMarkdown);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving data:', err);
    } finally {
      if (!silent) setSaving(false);
    }
  }, [currentProject, vision, userProfile]);

  // Save vision document
  const handleSaveVision = useCallback(async () => {
    if (!currentProject) return;
    
    setSavingVision(true);
    try {
      const visionMarkdown = visionToMarkdown(vision);
      
      const { data: existingVision } = await supabase
        .from('visions')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (existingVision) {
        await supabase
          .from('visions')
          .update({
            ...vision,
            markdown_content: visionMarkdown,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('visions').insert({
          project_id: currentProject.id,
          ...vision,
          markdown_content: visionMarkdown,
        });
      }
      
      setLastSavedVision(new Date());
    } catch (err) {
      console.error('Error saving vision:', err);
    } finally {
      setSavingVision(false);
    }
  }, [currentProject, vision]);

  // Save user profile document
  const handleSaveProfile = useCallback(async () => {
    if (!currentProject) return;
    
    setSavingProfile(true);
    try {
      const profileMarkdown = userProfileToMarkdown(userProfile);
      
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from('user_profiles')
          .update({
            ...userProfile,
            markdown_content: profileMarkdown,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('user_profiles').insert({
          project_id: currentProject.id,
          ...userProfile,
          markdown_content: profileMarkdown,
        });
      }
      
      setLastSavedProfile(new Date());
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSavingProfile(false);
    }
  }, [currentProject, userProfile]);

  // Save success metrics document
  const handleSaveMetrics = useCallback(async () => {
    if (!currentProject) return;
    
    setSavingMetrics(true);
    try {
      const metricsMarkdown = successMetricsToMarkdown(vision);
      
      // Parse metrics markdown to extract structured data
      const parsed = markdownToSuccessMetrics(metricsMarkdown);
      const criteria = vision.success_metrics 
        ? vision.success_metrics.split('\n').filter(line => line.trim()).map(line => line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
        : [];
      
      const { data: existingMetrics } = await supabase
        .from('success_metrics')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      const metricsData = {
        project_id: currentProject.id,
        target_level: parsed.target_level || vision.target_level || 'mvp',
        criteria: criteria,
        validation_methods: [],
        timeline: '',
        markdown_content: metricsMarkdown,
        updated_at: new Date().toISOString(),
      };

      if (existingMetrics) {
        await supabase
          .from('success_metrics')
          .update(metricsData)
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('success_metrics').insert(metricsData);
      }
      
      setSuccessMetricsMarkdown(metricsMarkdown);
      setLastSavedMetrics(new Date());
    } catch (err) {
      console.error('Error saving metrics:', err);
    } finally {
      setSavingMetrics(false);
    }
  }, [currentProject, vision]);

  // Save research document
  const handleSaveResearch = useCallback(async () => {
    if (!currentProject) return;
    
    setSavingResearch(true);
    try {
      // Research data is saved by ResearchTab component itself
      // This is just a callback to update the save state
      setLastSavedResearch(new Date());
    } catch (err) {
      console.error('Error saving research:', err);
    } finally {
      setSavingResearch(false);
    }
  }, [currentProject]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      saveData(true);
    }, 2000);
    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout, saveData]);

  const handleVisionChange = useCallback((newVision: VisionData) => {
    setVision(newVision);
    triggerAutoSave();
  }, [triggerAutoSave]);

  const handleUserProfileChange = useCallback((newProfile: UserProfileData) => {
    setUserProfile(newProfile);
    triggerAutoSave();
  }, [triggerAutoSave]);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadVision = () => {
    downloadFile(visionToMarkdown(vision), '0_vision.md');
  };

  const downloadUserProfile = () => {
    downloadFile(userProfileToMarkdown(userProfile), '1_user_profile.md');
  };

  const downloadSuccessMetrics = () => {
    downloadFile(successMetricsToMarkdown(vision), '2_success_metrics.md');
  };

  const downloadAll = () => {
    downloadVision();
    setTimeout(() => downloadUserProfile(), 100);
    setTimeout(() => downloadSuccessMetrics(), 200);
  };

  const handleContinue = async () => {
    await saveData();
    await supabase
      .from('projects')
      .update({ current_stage: 'strategy' })
      .eq('id', currentProject?.id);
    setCurrentStage('strategy');
  };

  const isComplete = vision.problem && vision.target_user && userProfile.primary_user && userProfile.goal;

  const handleNextDocument = () => {
    const documentOrder: ActiveDocument[] = ['vision', 'profile', 'metrics', 'research'];
    const currentIndex = documentOrder.indexOf(activeDocument);
    const nextIndex = (currentIndex + 1) % documentOrder.length;
    setActiveDocument(documentOrder[nextIndex]);
  };

  const getNextDocumentLabel = (): string => {
    switch (activeDocument) {
      case 'vision':
        return 'Next: 1_user_profile.md';
      case 'profile':
        return 'Next: 2_success_metrics.md';
      case 'metrics':
        return 'Next: Research';
      case 'research':
        return 'Back to: 0_vision.md';
    }
  };

  const handleGenerateProjectFile = (fileType: ProjectFileType) => {
    setActiveProjectFile(fileType);
  };

  const handleNextProjectFile = () => {
    if (!activeProjectFile) return;
    
    const fileOrder: ProjectFileType[] = ['claude', 'cursorrules', 'copilot'];
    const currentIndex = fileOrder.indexOf(activeProjectFile);
    const nextIndex = (currentIndex + 1) % fileOrder.length;
    setActiveProjectFile(fileOrder[nextIndex]);
  };

  const handleProjectFileGenerated = async (fileType: ProjectFileType) => {
    setProjectFilesGenerated(prev => new Set([...prev, fileType]));
    
    // Save project config
    if (currentProject) {
      const hash = hashFoundationData(vision, userProfile);
      const { data: existing } = await supabase
        .from('project_configs')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      const configData = {
        project_id: currentProject.id,
        tech_stack_id: 'react-ts-vite', // Default stack
        coding_standards: {},
        ai_instructions: {},
        foundation_data_hash: hash,
        generated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase
          .from('project_configs')
          .update({ ...configData, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('project_configs').insert(configData);
      }
    }
  };

  const getNextProjectFileLabel = (): string => {
    if (!activeProjectFile) return '';
    
    switch (activeProjectFile) {
      case 'claude':
        return 'Next: .cursorrules';
      case 'cursorrules':
        return 'Next: copilot-instructions.md';
      case 'copilot':
        return 'All files complete!';
    }
  };

  const allProjectFilesComplete = projectFilesGenerated.size === 3;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-primary-400" />
            Foundation: Vision & User
          </h1>
          <p className="text-primary-400 mt-2">
            Before building anything, define what you're solving and who it's for.
          </p>
        </div>

        {isComplete && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-300">Foundation Complete</span>
          </div>
        )}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6 -mx-6 -mt-6 px-6 py-4 bg-slate-800/50 border-b border-slate-700 rounded-t-lg">
          <div className="flex gap-2">
            <Button
              variant={activeDocument === 'vision' ? 'primary' : 'ghost'}
              onClick={() => setActiveDocument('vision')}
              size="sm"
            >
              <FileCode className="w-4 h-4 mr-2 text-amber-400" />
              0_vision.md
            </Button>
            <Button
              variant={activeDocument === 'profile' ? 'primary' : 'ghost'}
              onClick={() => setActiveDocument('profile')}
              size="sm"
            >
              <FileCode className="w-4 h-4 mr-2 text-blue-400" />
              1_user_profile.md
            </Button>
            <Button
              variant={activeDocument === 'metrics' ? 'primary' : 'ghost'}
              onClick={() => setActiveDocument('metrics')}
              size="sm"
            >
              <FileCode className="w-4 h-4 mr-2 text-green-400" />
              2_success_metrics.md
            </Button>
            <Button
              variant={activeDocument === 'research' ? 'primary' : 'ghost'}
              onClick={() => setActiveDocument('research')}
              size="sm"
            >
              <FileCode className="w-4 h-4 mr-2 text-purple-400" />
              Research
            </Button>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={downloadAll}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Foundation Files
            </Button>
            <Button onClick={handleContinue} disabled={!isComplete}>
              Continue to Strategy
            </Button>
          </div>
        </div>

        {activeDocument === 'research' ? (
          <ResearchTab
            onSave={handleSaveResearch}
            saving={savingResearch}
            lastSaved={lastSavedResearch}
          />
        ) : (
          <MarkdownEditor
            vision={vision}
            userProfile={userProfile}
            onVisionChange={handleVisionChange}
            onUserProfileChange={handleUserProfileChange}
            lastSaved={lastSaved}
            activeDocument={activeDocument}
            onActiveDocumentChange={setActiveDocument}
            onSaveVision={handleSaveVision}
            onSaveProfile={handleSaveProfile}
            onSaveMetrics={handleSaveMetrics}
            savingVision={savingVision}
            savingProfile={savingProfile}
            savingMetrics={savingMetrics}
            lastSavedVision={lastSavedVision}
            lastSavedProfile={lastSavedProfile}
            lastSavedMetrics={lastSavedMetrics}
          />
        )}
      </Card>

      {!isComplete && (
        <div className="flex items-center justify-center p-4 bg-primary-800/50 border border-primary-700 rounded-lg">
          <Button onClick={handleNextDocument} variant="primary">
            {getNextDocumentLabel()}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Project Files Generator Section */}
      {isComplete && (
        <Card>
          <div className="flex items-center justify-between mb-6 -mx-6 -mt-6 px-6 py-4 bg-slate-800/50 border-b border-slate-700 rounded-t-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <div>
                <h2 className="text-xl font-semibold text-primary-100">Project Files Generator</h2>
                <p className="text-sm text-primary-400">
                  Generate CLAUDE.md, .cursorrules, and copilot-instructions.md for AI assistants
                </p>
              </div>
            </div>
            {allProjectFilesComplete && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-700 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-green-300">All Files Generated</span>
              </div>
            )}
          </div>

          {activeProjectFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary-100">
                  Editing {activeProjectFile === 'claude' ? 'CLAUDE.md' : activeProjectFile === 'cursorrules' ? '.cursorrules' : 'copilot-instructions.md'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveProjectFile(null)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Close Editor
                </Button>
              </div>
              <ProjectFilesEditor
                projectName={currentProject?.name || 'My Project'}
                projectDescription={currentProject?.description || ''}
                vision={{
                  problem: vision.problem,
                  target_user: vision.target_user,
                  success_metrics: vision.success_metrics,
                }}
                userProfile={{
                  primary_user: userProfile.primary_user,
                  goal: userProfile.goal,
                  technical_comfort: userProfile.technical_comfort,
                }}
                activeFile={activeProjectFile}
                onActiveFileChange={setActiveProjectFile}
                onFileGenerated={handleProjectFileGenerated}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-primary-800/50 rounded-lg border border-primary-700">
                <p className="text-sm text-primary-300 mb-4">
                  These files help AI assistants understand your project's coding standards, architecture, and guidelines.
                  Generate them in order, or jump to any file you need.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant={projectFilesGenerated.has('claude') ? 'secondary' : 'primary'}
                    onClick={() => handleGenerateProjectFile('claude')}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <FileCode className="w-6 h-6 text-purple-400" />
                    <span className="font-medium">CLAUDE.md</span>
                    <span className="text-xs opacity-75">Claude Code & Desktop</span>
                    {projectFilesGenerated.has('claude') && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </Button>
                  <Button
                    variant={projectFilesGenerated.has('cursorrules') ? 'secondary' : 'primary'}
                    onClick={() => handleGenerateProjectFile('cursorrules')}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <FileCode className="w-6 h-6 text-blue-400" />
                    <span className="font-medium">.cursorrules</span>
                    <span className="text-xs opacity-75">Cursor IDE</span>
                    {projectFilesGenerated.has('cursorrules') && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </Button>
                  <Button
                    variant={projectFilesGenerated.has('copilot') ? 'secondary' : 'primary'}
                    onClick={() => handleGenerateProjectFile('copilot')}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <FileCode className="w-6 h-6 text-green-400" />
                    <span className="font-medium">copilot-instructions.md</span>
                    <span className="text-xs opacity-75">GitHub Copilot</span>
                    {projectFilesGenerated.has('copilot') && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeProjectFile && !allProjectFilesComplete && (
            <div className="flex items-center justify-center p-4 bg-primary-800/50 border border-primary-700 rounded-lg mt-4">
              <Button onClick={handleNextProjectFile} variant="primary">
                {getNextProjectFileLabel()}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
