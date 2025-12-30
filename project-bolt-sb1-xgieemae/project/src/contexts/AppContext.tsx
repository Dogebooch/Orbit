import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

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

interface AppContextType {
  user: User | null;
  loading: boolean;
  currentProject: Project | null;
  currentStage: string;
  setCurrentProject: (project: Project | null) => void;
  setCurrentStage: (stage: string) => void;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Use mock user - no authentication required
  const [user] = useState<User | null>(MOCK_USER);
  const [loading] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentStage, setCurrentStage] = useState('vision');

  useEffect(() => {
    if (currentProject) {
      setCurrentStage(currentProject.current_stage);
    }
  }, [currentProject]);

  const signOut = async () => {
    // No-op for local use
    setCurrentProject(null);
    setCurrentStage('vision');
  };

  const value = {
    user,
    loading,
    currentProject,
    currentStage,
    setCurrentProject,
    setCurrentStage,
    signOut,
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
