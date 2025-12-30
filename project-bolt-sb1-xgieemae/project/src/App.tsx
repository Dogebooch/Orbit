import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from './contexts/AppContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { Sidebar } from './components/layout/Sidebar';
import { ProjectSelector } from './components/layout/ProjectSelector';
import { SetupStage } from './components/stages/SetupStage';
import { VisionStage } from './components/stages/VisionStage';
import { StrategyStage } from './components/stages/StrategyStage';
import { WorkbenchStage } from './components/stages/WorkbenchStage';
import { PromptLibraryStage } from './components/stages/PromptLibraryStage';
import { TestingStage } from './components/stages/TestingStage';
import { SettingsStage } from './components/stages/SettingsStage';
import { DashboardStage } from './components/stages/DashboardStage';
import { CommandPalette, CommandIcons } from './components/ui';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { AlertCircle, LayoutDashboard, Package } from 'lucide-react';

function App() {
  const { currentProject, currentStage, setCurrentStage } = useApp();
  const [localStage, setLocalStage] = useState(currentStage);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const projectSelectorRef = useRef<{ triggerNewProject: () => void } | null>(null);

  // Sync localStage when currentStage changes from context (e.g., "Continue to Strategy" buttons)
  useEffect(() => {
    setLocalStage(currentStage);
  }, [currentStage]);

  const handleStageChange = useCallback((stage: string) => {
    setLocalStage(stage);
    setCurrentStage(stage);
  }, [setCurrentStage]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onStageChange: handleStageChange,
    onNewProject: () => setShowNewProject(true),
    onCommandPalette: () => setShowCommandPalette(true),
    onEscape: () => {
      setShowCommandPalette(false);
      setShowNewProject(false);
    },
  });

  // Commands for command palette
  const commands = [
    { id: 'dashboard', label: 'Go to Dashboard', description: 'View project overview', icon: LayoutDashboard, action: () => handleStageChange('dashboard'), keywords: ['home', 'overview'] },
    { id: 'setup', label: 'Go to Setup', description: 'Prerequisites', icon: Package, action: () => handleStageChange('setup'), keywords: ['prerequisites', 'start'] },
    { id: 'vision', label: 'Go to Foundation', description: 'Vision & User Profile', icon: CommandIcons.Lightbulb, action: () => handleStageChange('vision'), keywords: ['foundation'] },
    { id: 'strategy', label: 'Go to Strategy', description: 'PRD & Launch', icon: CommandIcons.ListChecks, action: () => handleStageChange('strategy'), keywords: ['prd', 'tasks', 'launch'] },
    { id: 'workbench', label: 'Go to Workbench', description: 'Build & Code', icon: CommandIcons.Code2, action: () => handleStageChange('workbench'), keywords: ['code', 'terminal'] },
    { id: 'promptlibrary', label: 'Go to Prompt Library', description: 'Saved Prompts', icon: CommandIcons.BookMarked, action: () => handleStageChange('promptlibrary'), keywords: ['prompts'] },
    { id: 'testing', label: 'Go to Testing', description: 'Ship & Deploy', icon: CommandIcons.Rocket, action: () => handleStageChange('testing'), keywords: ['deploy', 'ship'] },
    { id: 'settings', label: 'Go to Settings', description: 'Configuration', icon: CommandIcons.Settings, action: () => handleStageChange('settings'), keywords: ['config'] },
    { id: 'new-project', label: 'Create New Project', description: 'Start a new project', icon: CommandIcons.FolderPlus, action: () => setShowNewProject(true), keywords: ['create', 'add'] },
  ];

  const renderStage = () => {
    if (!currentProject) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-primary-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary-100 mb-2">No Project Selected</h2>
            <p className="text-primary-400">
              Create a new project or select an existing one from the dropdown above to get started
              with Orbit.
            </p>
          </div>
        </div>
      );
    }

    switch (localStage) {
      case 'dashboard':
        return <DashboardStage onNavigate={handleStageChange} />;
      case 'setup':
        return <SetupStage />;
      case 'vision':
        return <VisionStage />;
      case 'strategy':
        return <StrategyStage />;
      case 'workbench':
        return <WorkbenchStage />;
      case 'promptlibrary':
        return <PromptLibraryStage />;
      case 'testing':
        return <TestingStage />;
      case 'settings':
        return <SettingsStage />;
      default:
        return <DashboardStage onNavigate={handleStageChange} />;
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:block">
          <Sidebar onStageChange={handleStageChange} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <ProjectSelector 
            showNewProjectModal={showNewProject}
            onNewProjectModalClose={() => setShowNewProject(false)}
          />

          <main className="flex-1 overflow-y-auto p-8">
            {renderStage()}
          </main>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />
    </AuthGuard>
  );
}

export default App;
