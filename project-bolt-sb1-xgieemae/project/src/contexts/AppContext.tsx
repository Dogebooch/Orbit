import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Mock user for local/personal use (no authentication required)
const MOCK_USER: User = {
  id: 'local-user-00000000-0000-0000-0000-000000000001',
  email: 'local@personal.dev',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
} as User;

interface Project {
  id: string;
  name: string;
  description: string;
  current_stage: string;
  created_at: string;
  updated_at: string;
}

export interface StageCompletion {
  setup: boolean;
  vision: boolean;
  strategy: boolean;
  workbench: boolean;
  testing: boolean;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  currentProject: Project | null;
  currentStage: string;
  stageCompletion: StageCompletion;
  setCurrentProject: (project: Project | null) => void;
  setCurrentStage: (stage: string) => void;
  refreshStageCompletion: () => Promise<void>;
  signOut: () => Promise<void>;
  triggerProjectSelectorDropdown: () => void;
  projectSelectorDropdownTrigger: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_STAGE_COMPLETION: StageCompletion = {
  setup: false,
  vision: false,
  strategy: false,
  workbench: false,
  testing: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  // Use mock user - no authentication required
  const [user] = useState<User | null>(MOCK_USER);
  const [loading] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentStage, setCurrentStage] = useState('setup');
  const [stageCompletion, setStageCompletion] = useState<StageCompletion>(DEFAULT_STAGE_COMPLETION);
  const [triggerDropdown, setTriggerDropdown] = useState(0);

  // Check stage completion status
  const refreshStageCompletion = useCallback(async () => {
    if (!currentProject) {
      setStageCompletion(DEFAULT_STAGE_COMPLETION);
      return;
    }

    const completion: StageCompletion = {
      setup: false,
      vision: false,
      strategy: false,
      workbench: false,
      testing: false,
    };

    try {
      // Check Setup completion - all prerequisites checked
      const { data: setupData } = await supabase
        .from('settings')
        .select('value')
        .eq('user_id', user?.id)
        .eq('key', 'setup_prerequisites')
        .maybeSingle();

      if (setupData?.value) {
        const checkedItems = (setupData.value as { checkedItems?: Record<string, boolean> }).checkedItems || {};
        completion.setup = Object.values(checkedItems).every(Boolean);
      }

      // Check Vision stage - has problem and target_user defined
      const { data: visionData } = await supabase
        .from('visions')
        .select('problem, target_user')
        .eq('project_id', currentProject.id)
        .maybeSingle();
      
      completion.vision = !!(visionData?.problem && visionData?.target_user);

      // Check Strategy stage - has PRD content (at least 300 characters)
      const { data: prdData } = await supabase
        .from('prds')
        .select('content')
        .eq('project_id', currentProject.id)
        .maybeSingle();
      
      completion.strategy = !!(prdData?.content && prdData.content.length >= 300);

      // Check Workbench stage - has at least one task
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', currentProject.id);
      
      completion.workbench = (taskCount ?? 0) > 0;

      // Check Testing stage - this could be based on having completed tasks or test results
      // For now, check if at least 50% of tasks are completed
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', currentProject.id);
      
      if (tasksData && tasksData.length > 0) {
        const completedCount = tasksData.filter(t => t.status === 'completed').length;
        completion.testing = completedCount >= Math.ceil(tasksData.length / 2);
      }


      setStageCompletion(completion);
    } catch (error) {
      console.error('Error checking stage completion:', error);
    }
  }, [currentProject]);

  useEffect(() => {
    if (currentProject) {
      setCurrentStage(currentProject.current_stage);
      refreshStageCompletion();
    }
  }, [currentProject, refreshStageCompletion]);

  const signOut = async () => {
    // No-op for local use
    setCurrentProject(null);
    setCurrentStage('setup');
    setStageCompletion(DEFAULT_STAGE_COMPLETION);
  };

  const triggerProjectSelectorDropdown = useCallback(() => {
    setTriggerDropdown(prev => prev + 1);
  }, []);

  const value = {
    user,
    loading,
    currentProject,
    currentStage,
    stageCompletion,
    setCurrentProject,
    setCurrentStage,
    refreshStageCompletion,
    signOut,
    triggerProjectSelectorDropdown,
    projectSelectorDropdownTrigger: triggerDropdown,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
