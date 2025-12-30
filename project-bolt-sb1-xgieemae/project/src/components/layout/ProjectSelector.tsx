import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { useTerminal } from '../../contexts/TerminalContext';
import { Button } from '../ui';
import { FolderOpen, Plus, ChevronDown, CheckCircle2, Circle, Lightbulb, ListChecks, Code2, Rocket, ArrowLeft, Package, RotateCcw } from 'lucide-react';
import { TemplateSelector } from './TemplateSelector';
import { ProjectTemplate, getTemplateById } from '../../lib/projectTemplates';

interface Project {
  id: string;
  name: string;
  description: string;
  current_stage: string;
  created_at: string;
  updated_at: string;
}

interface StageProgress {
  setup: boolean;
  foundation: boolean;
  strategy: boolean;
  workbench: boolean;
  testing: boolean;
}

interface ProjectSelectorProps {
  showNewProjectModal?: boolean;
  onNewProjectModalClose?: () => void;
}

type NewProjectStep = 'template' | 'details';

export function ProjectSelector({ showNewProjectModal, onNewProjectModalClose }: ProjectSelectorProps) {
  const { user, currentProject, setCurrentProject, currentStage, setCurrentStage } = useApp();
  const { isBackendConnected, wsClient } = useTerminal();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectStep, setNewProjectStep] = useState<NewProjectStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [stageProgress, setStageProgress] = useState<StageProgress>({
    setup: false,
    foundation: false,
    strategy: false,
    workbench: false,
    testing: false,
  });

  // Sync with external trigger for new project modal
  useEffect(() => {
    if (showNewProjectModal) {
      setShowNewProject(true);
      setNewProjectStep('template');
    }
  }, [showNewProjectModal]);

  useEffect(() => {
    loadProjects();
  }, [user]);

  // Calculate stage completion whenever project changes
  useEffect(() => {
    if (currentProject) {
      calculateProgress();
    }
  }, [currentProject]);

  const calculateProgress = async () => {
    if (!currentProject) return;

    const progress: StageProgress = {
      setup: false,
      foundation: false,
      strategy: false,
      workbench: false,
      testing: false,
    };

    // Check Setup completion (from settings)
    const { data: setupData } = await supabase
      .from('settings')
      .select('value')
      .eq('user_id', user?.id)
      .eq('key', 'setup_prerequisites')
      .maybeSingle();

    if (setupData?.value) {
      const checkedItems = (setupData.value as { checkedItems?: Record<string, boolean> }).checkedItems || {};
      progress.setup = Object.values(checkedItems).every(Boolean);
    }

    // Check Foundation (Vision & User Profile)
    const { data: visionData } = await supabase
      .from('visions')
      .select('problem, target_user')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('primary_user, goal')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    progress.foundation = !!(
      visionData?.problem && 
      visionData?.target_user && 
      profileData?.primary_user && 
      profileData?.goal
    );

    // Check Strategy (PRD exists)
    const { data: prdData } = await supabase
      .from('prds')
      .select('content')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    progress.strategy = !!(prdData?.content && prdData.content.length > 100);

    // Check Workbench (tasks exist)
    const { data: taskData } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', currentProject.id)
      .limit(1);

    progress.workbench = (taskData?.length ?? 0) > 0;

    // Check Testing (checklist > 50%)
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('user_id', user?.id)
      .eq('key', `testing_checklist_${currentProject.id}`)
      .maybeSingle();

    if (settingsData?.value) {
      const checks = Object.values(settingsData.value as Record<number, boolean>);
      const completed = checks.filter(Boolean).length;
      progress.testing = completed >= 5; // At least 50%
    }


    setStageProgress(progress);
  };

  const loadProjects = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
      if (!currentProject && data.length > 0) {
        setCurrentProject(data[0]);
      }
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: newProjectName.trim(),
          description: newProjectDescription.trim(),
          current_stage: 'setup',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Apply template data if a template was selected (and it's not blank)
        if (selectedTemplate && selectedTemplate.id !== 'blank') {
          // Insert vision data
          await supabase.from('visions').insert({
            project_id: data.id,
            problem: selectedTemplate.vision.problem,
            target_user: selectedTemplate.vision.target_user,
            success_metrics: selectedTemplate.vision.success_metrics,
            why_software: selectedTemplate.vision.why_software,
            target_level: selectedTemplate.vision.target_level,
          });

          // Insert user profile data
          await supabase.from('user_profiles').insert({
            project_id: data.id,
            primary_user: selectedTemplate.userProfile.primary_user,
            goal: selectedTemplate.userProfile.goal,
            context: selectedTemplate.userProfile.context,
            frustrations: selectedTemplate.userProfile.frustrations,
            technical_comfort: selectedTemplate.userProfile.technical_comfort,
            time_constraints: selectedTemplate.userProfile.time_constraints,
            persona_name: selectedTemplate.userProfile.persona_name,
            persona_role: selectedTemplate.userProfile.persona_role,
          });
        }

        setProjects([data, ...projects]);
        setCurrentProject(data);
        resetNewProjectForm();
      }
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelected = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setNewProjectStep('details');
  };

  const resetNewProjectForm = () => {
    setShowNewProject(false);
    setNewProjectStep('template');
    setSelectedTemplate(null);
    setNewProjectName('');
    setNewProjectDescription('');
    onNewProjectModalClose?.();
  };

  const handleCancelNewProject = () => {
    resetNewProjectForm();
  };

  const handleBackToTemplates = () => {
    setNewProjectStep('template');
    setSelectedTemplate(null);
  };

  const resetProject = async () => {
    if (!currentProject || !user) return;

    setResetting(true);
    try {
      const projectId = currentProject.id;

      // Delete all related data from database tables
      const tablesToClean = [
        'visions',
        'user_profiles',
        'tasks',
        'prds',
        'terminal_sessions',
        'terminal_output',
        'research_apps',
        'research_notes',
        'research_images',
        'project_configs',
        'ai_sessions',
        'maintenance_reviews',
        'user_feedback',
        'technical_metrics',
      ];

      // Delete from all tables in parallel
      await Promise.all(
        tablesToClean.map((table) =>
          supabase.from(table).delete().eq('project_id', projectId)
        )
      );

      // Delete project-specific settings
      await supabase
        .from('settings')
        .delete()
        .eq('user_id', user.id)
        .like('key', `%_${projectId}`);

      // Reset project to initial state
      await supabase
        .from('projects')
        .update({
          current_stage: 'setup',
          description: '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      // Clear project folder via WebSocket if backend is connected
      if (isBackendConnected && wsClient) {
        try {
          wsClient.send({ type: 'project:clearFolder', projectId });
        } catch (error) {
          console.warn('[Reset] Failed to clear project folder via WebSocket:', error);
        }
      }

      // Reload projects to get updated state
      await loadProjects();

      // Refresh current project
      const { data: updatedProject } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (updatedProject) {
        setCurrentProject(updatedProject);
        setCurrentStage('setup');
      }

      setShowResetConfirm(false);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error resetting project:', error);
      alert('Failed to reset project. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  if (showNewProject) {
    return (
      <div className="p-4 border-b border-accent-800 bg-primary-900">
        {newProjectStep === 'template' ? (
          <TemplateSelector
            onSelectTemplate={handleTemplateSelected}
            onBack={handleCancelNewProject}
          />
        ) : (
          <form onSubmit={createProject} className="space-y-3">
            {selectedTemplate && selectedTemplate.id !== 'blank' && (
              <div className="flex items-center gap-2 p-2 bg-primary-800 rounded-lg mb-2">
                <span className="text-lg">{selectedTemplate.icon}</span>
                <div className="flex-1">
                  <span className="text-xs text-primary-400">Template:</span>
                  <span className="text-sm font-medium text-primary-200 ml-1">{selectedTemplate.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleBackToTemplates}
                  className="text-xs text-primary-400 hover:text-primary-200"
                >
                  Change
                </button>
              </div>
            )}
            
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="input text-sm"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              className="textarea text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToTemplates}
                className="text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button type="submit" loading={loading} className="text-sm flex-1">
                Create Project
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  const completedStages = Object.values(stageProgress).filter(Boolean).length;
  const totalStages = 6;
  const progressPercent = Math.round((completedStages / totalStages) * 100);

  const stages = [
    { key: 'setup', id: 'setup', label: 'Setup', icon: Package, complete: stageProgress.setup },
    { key: 'foundation', id: 'vision', label: 'Foundation', icon: Lightbulb, complete: stageProgress.foundation },
    { key: 'strategy', id: 'strategy', label: 'Strategy', icon: ListChecks, complete: stageProgress.strategy },
    { key: 'workbench', id: 'workbench', label: 'Workbench', icon: Code2, complete: stageProgress.workbench },
    { key: 'testing', id: 'testing', label: 'Testing', icon: Rocket, complete: stageProgress.testing },
  ];

  return (
    <div className="p-4 border-b border-accent-800 bg-primary-900 relative">
      <div className="flex items-center gap-4">
        {/* Project Selector */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-primary-800 transition-colors min-w-[200px]"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-primary-100">
                {currentProject?.name || 'No project'}
              </div>
              {currentProject?.description && (
                <div className="text-xs text-primary-400 truncate max-w-[160px]">
                  {currentProject.description}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-primary-400 ml-2" />
        </button>

        {/* Workflow Progress Indicator */}
        {currentProject && (
          <div className="flex-1 flex items-center gap-4">
            <div className="h-8 w-px bg-primary-700" />
            
            {/* Stage Icons */}
            <div className="flex items-center gap-1">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const isActive = currentStage === stage.id;
                return (
                  <button
                    key={stage.key}
                    onClick={() => setCurrentStage(stage.id)}
                    className={`group relative flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                      stage.complete
                        ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70'
                        : isActive
                        ? 'bg-primary-600 text-primary-100'
                        : 'bg-primary-800 text-primary-500 hover:bg-primary-700 hover:text-primary-300'
                    }`}
                    title={`${stage.label}${stage.complete ? ' (Complete)' : ''}`}
                  >
                    {stage.complete ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    
                    {/* Tooltip */}
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary-700 text-xs text-primary-100 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {stage.label}
                    </span>
                    
                    {/* Connector line */}
                    {index < stages.length - 1 && (
                      <div className={`absolute -right-1 w-2 h-0.5 ${
                        stage.complete ? 'bg-green-700' : 'bg-primary-700'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Progress Summary */}
            <div className="flex items-center gap-2 ml-2">
              <div className="w-16 h-1.5 bg-primary-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-primary-400 font-medium">{progressPercent}%</span>
            </div>
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 mx-4 bg-primary-800 border border-accent-700 rounded-lg shadow-soft-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => {
                setShowNewProject(true);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded hover:bg-primary-700 text-primary-200 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
          <div className="border-t border-accent-700">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setCurrentProject(project);
                  setShowDropdown(false);
                }}
                className={`w-full p-3 text-left hover:bg-primary-700 transition-colors ${
                  currentProject?.id === project.id ? 'bg-primary-700' : ''
                }`}
              >
                <div className="text-sm font-medium text-primary-100">{project.name}</div>
                {project.description && (
                  <div className="text-xs text-primary-400 mt-1">{project.description}</div>
                )}
              </button>
            ))}
          </div>
          {currentProject && (
            <>
              <div className="border-t border-accent-700 mt-2" />
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowResetConfirm(true);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-red-900/30 text-red-400 text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Project
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-primary-800 border border-accent-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-primary-100 mb-2">Reset Project</h3>
            <p className="text-sm text-primary-300 mb-6">
              This will delete all project data (visions, tasks, PRDs, research, etc.) and clear the project folder.
              The project record will be kept but reset to the initial setup stage.
            </p>
            <p className="text-sm text-red-400 mb-6 font-medium">
              This action cannot be undone. Are you sure you want to continue?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={resetProject}
                loading={resetting}
                className="text-sm bg-red-600 hover:bg-red-700"
              >
                Reset Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
