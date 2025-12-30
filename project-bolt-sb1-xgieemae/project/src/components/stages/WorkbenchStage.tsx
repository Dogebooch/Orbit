import React, { useState, useEffect, useCallback } from 'react';
import { Code2, BookMarked, ExternalLink, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { TerminalPanel } from '../workbench/TerminalPanel';
import { TaskList } from '../workbench/TaskList';
import { DevelopmentLoopHelper } from '../workbench/DevelopmentLoopHelper';
import { Card, Button, Tooltip } from '../ui';
import { useApp } from '../../contexts/AppContext';
import { useTerminal } from '../../contexts/TerminalContext';
import { useDevelopmentLoop } from '../../hooks/useDevelopmentLoop';
import { supabase } from '../../lib/supabase';
import { fetchProjectData, generateClaudeMd } from '../../lib/claudeExport';
import { 
  groupPromptsByType, 
  getTaskTypeLabel, 
  generateTooltipText,
  getTaskTypeColors,
  type Prompt as TaskMasterPrompt 
} from '../../utils/taskMasterUtils';

export function WorkbenchStage() {
  const { setCurrentStage, currentProject, user } = useApp();
  const { setCommandInput } = useTerminal();
  const {
    currentStep,
    completedSteps,
    activeTaskId,
    loopIteration,
  } = useDevelopmentLoop();
  const [copied, setCopied] = useState(false);
  const [isTaskMasterExpanded, setIsTaskMasterExpanded] = useState(true);
  const [taskMasterPrompts, setTaskMasterPrompts] = useState<TaskMasterPrompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  const handleCopyContext = async () => {
    if (!currentProject) return;

    try {
      const data = await fetchProjectData(currentProject.id);
      if (data) {
        const context = generateClaudeMd(data);
        await navigator.clipboard.writeText(context);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy context:', error);
    }
  };

  const loadTaskMasterPrompts = useCallback(async () => {
    if (!user) return;

    setIsLoadingPrompts(true);
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'taskmaster')
        .order('title', { ascending: true });

      if (error) {
        console.error('Error loading TaskMaster prompts:', error);
      } else if (data) {
        setTaskMasterPrompts(data);
      }
    } catch (error) {
      console.error('Failed to load TaskMaster prompts:', error);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [user]);

  useEffect(() => {
    if (currentProject && user) {
      loadTaskMasterPrompts();
    }
  }, [currentProject, user, loadTaskMasterPrompts]);

  const handlePromptClick = (prompt: TaskMasterPrompt) => {
    setCommandInput(prompt.content);
  };

  const groupedPrompts = groupPromptsByType(taskMasterPrompts);

  const handleStepAction = useCallback((step: string, command: string) => {
    // Replace [Task ID] with actual task ID if available
    let finalCommand = command;
    if (command.includes('[Task ID]') && activeTaskId) {
      finalCommand = command.replace('[Task ID]', activeTaskId);
    }
    setCommandInput(finalCommand);
  }, [activeTaskId, setCommandInput]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-primary-100 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary-400" />
          Mission Control
        </h1>
        <p className="text-primary-400 mt-1 text-sm">
          Integrated terminal for AI-assisted development
          {loopIteration > 0 && (
            <span className="ml-2 text-primary-500">
              • Loop #{loopIteration}
            </span>
          )}
        </p>
      </div>

      {/* Development Loop Helper */}
      <div className="mb-4 flex-shrink-0">
        <DevelopmentLoopHelper
          currentStep={currentStep || undefined}
          completedSteps={completedSteps}
          onStepAction={handleStepAction}
          activeTaskId={activeTaskId}
        />
      </div>

      {/* Main Content Area: Terminal (main, left) | Task List (right column) */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Left Column: Terminal (main focus) */}
        <div className="flex-[2] flex flex-col gap-3 overflow-hidden min-w-0">
          {/* Terminal - Main Focus */}
          <div className="flex-1 min-h-0">
            <TerminalPanel />
          </div>

          {/* Context Clipper and TaskMaster Commands */}
          <div className="flex gap-3 items-start flex-shrink-0">
            {/* Context Clipper */}
            <Card className="flex-shrink-0 p-4" style={{ width: 'fit-content' }}>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-primary-100">Context Clipper</h2>
                <p className="text-xs text-primary-400">
                  Copy project context for AI assistants
                </p>
              </div>
              <div className="mt-3">
                <Button
                  onClick={handleCopyContext}
                  variant="primary"
                  size="sm"
                  disabled={!currentProject}
                  className="text-xs w-full"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 w-3.5 h-3.5" />
                      Copy Project Context
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* TaskMaster Prompts Quick Access */}
            <Card className="flex-1 min-w-0 p-4">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => setIsTaskMasterExpanded(!isTaskMasterExpanded)}
              className="p-1 hover:bg-primary-800/50 rounded transition-colors flex-shrink-0"
            >
              {isTaskMasterExpanded ? (
                <ChevronUp className="w-4 h-4 text-primary-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-primary-400" />
              )}
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-primary-100 truncate">TaskMaster Commands</h2>
              <p className="text-xs text-primary-400 truncate">
                Quick access to TaskMaster prompts
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setCurrentStage('promptlibrary');
              sessionStorage.setItem('promptLibraryFilter', 'taskmaster');
            }}
            variant="secondary"
            size="sm"
            className="flex-shrink-0"
          >
            <BookMarked className="mr-2 w-4 h-4" />
            View All
          </Button>
        </div>
        {isTaskMasterExpanded && (
          <div className="mt-4 space-y-6">
            {isLoadingPrompts ? (
              <div className="text-center py-4 text-primary-400 text-sm">Loading TaskMaster commands...</div>
            ) : groupedPrompts.size === 0 ? (
              <div className="text-center py-4 text-primary-400 text-sm">
                No TaskMaster commands found. Add some in the Prompt Library!
              </div>
            ) : (
              Array.from(groupedPrompts.entries()).map(([taskType, prompts]) => {
                const colors = getTaskTypeColors(taskType);
                return (
                  <div key={taskType} className="space-y-3">
                    <h3 className="text-sm font-semibold text-primary-400 px-1">
                      {getTaskTypeLabel(taskType)}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {prompts.map((prompt) => {
                        const tooltipText = generateTooltipText(prompt);
                        return (
                          <Tooltip key={prompt.id} content={tooltipText} position="top" maxWidth={350}>
                            <button
                              onClick={() => handlePromptClick(prompt)}
                              className={`px-3 py-2 rounded-lg ${colors.bg} ${colors.border} ${colors.hoverBg} ${colors.hoverBorder} transition-colors cursor-pointer text-xs whitespace-nowrap text-primary-200 hover:text-primary-100`}
                            >
                              {prompt.title}
                            </button>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        </Card>
          </div>
        </div>

        {/* Right Column: Task List (narrow) */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 max-w-md">
          <TaskList />
        </div>
      </div>
    </div>
  );
}
