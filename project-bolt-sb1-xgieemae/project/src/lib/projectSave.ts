/**
 * Global project save functionality
 * Collects all project state and saves to local backend
 */

import { supabase } from './supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface ProjectState {
  project: {
    id: string;
    user_id: string;
    name: string;
    description: string;
    current_stage: string;
    copilot_instructions?: string;
    bootstrap_complete?: boolean;
    created_at: string;
    updated_at: string;
  };
  vision: any | null;
  userProfile: any | null;
  successMetrics: any | null;
  prd: any | null;
  tasks: any[];
  projectConfig: any | null;
  prdFeatures: any[];
  researchApps: any[];
  researchSynthesis: any[];
  savedAt: string;
  version: string;
}

/**
 * Collects all project state from Supabase and returns complete project state
 */
export async function collectAndSaveProjectState(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Collect project metadata
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Project not found' };
    }

    // Collect vision
    const { data: vision } = await supabase
      .from('visions')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    // Collect user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    // Collect success metrics
    const { data: successMetrics } = await supabase
      .from('success_metrics')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    // Collect PRD
    const { data: prd } = await supabase
      .from('prds')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    // Collect tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    // Collect project config
    const { data: projectConfig } = await supabase
      .from('project_configs')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    // Collect PRD features
    const { data: prdFeatures } = await supabase
      .from('prd_features')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    // Collect research apps
    const { data: researchApps } = await supabase
      .from('research_apps')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    // Collect research synthesis
    const { data: researchSynthesis } = await supabase
      .from('research_synthesis')
      .select('*')
      .eq('project_id', projectId);

    // Build project state
    const projectState: ProjectState = {
      project: {
        id: project.id,
        user_id: project.user_id,
        name: project.name,
        description: project.description || '',
        current_stage: project.current_stage || 'setup',
        copilot_instructions: project.copilot_instructions || undefined,
        bootstrap_complete: project.bootstrap_complete || false,
        created_at: project.created_at,
        updated_at: project.updated_at,
      },
      vision: vision || null,
      userProfile: userProfile || null,
      successMetrics: successMetrics || null,
      prd: prd || null,
      tasks: tasks || [],
      projectConfig: projectConfig || null,
      prdFeatures: prdFeatures || [],
      researchApps: researchApps || [],
      researchSynthesis: researchSynthesis || [],
      savedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    // Save to backend
    const response = await fetch(`${BACKEND_URL}/api/project/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectState),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: errorData.error || 'Failed to save project state' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving project state:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

