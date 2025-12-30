import React, { useState } from 'react';
import { useApp } from './contexts/AppContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { Sidebar } from './components/layout/Sidebar';
import { ProjectSelector } from './components/layout/ProjectSelector';
import { VisionStage } from './components/stages/VisionStage';
import { ResearchStage } from './components/stages/ResearchStage';
import { WorkbenchStage } from './components/stages/WorkbenchStage';
import { PromptLibraryStage } from './components/stages/PromptLibraryStage';
import { TestingStage } from './components/stages/TestingStage';
import { SettingsStage } from './components/stages/SettingsStage';
import { AlertCircle } from 'lucide-react';

function App() {
  const { currentProject, currentStage, setCurrentStage } = useApp();
  const [localStage, setLocalStage] = useState(currentStage);

  const handleStageChange = (stage: string) => {
    setLocalStage(stage);
    setCurrentStage(stage);
  };

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
      case 'vision':
        return <VisionStage />;
      case 'research':
        return <ResearchStage />;
      case 'workbench':
        return <WorkbenchStage />;
      case 'promptlibrary':
        return <PromptLibraryStage />;
      case 'testing':
        return <TestingStage />;
      case 'settings':
        return <SettingsStage />;
      default:
        return <VisionStage />;
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:block">
          <Sidebar onStageChange={handleStageChange} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <ProjectSelector />

          <main className="flex-1 overflow-y-auto p-8">
            {renderStage()}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

export default App;
