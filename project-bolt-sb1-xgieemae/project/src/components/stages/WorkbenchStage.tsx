import React, { useState } from 'react';
import { Code2, BookMarked, ExternalLink, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { TerminalPanel } from '../workbench/TerminalPanel';
import { Card, Button } from '../ui';
import { useApp } from '../../contexts/AppContext';
import { fetchProjectData, generateClaudeMd } from '../../lib/claudeExport';

export function WorkbenchStage() {
  const { setCurrentStage, currentProject } = useApp();
  const [copied, setCopied] = useState(false);
  const [isTaskMasterExpanded, setIsTaskMasterExpanded] = useState(false);

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

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary-100 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary-400" />
          Mission Control
        </h1>
        <p className="text-primary-400 mt-1 text-sm">
          Integrated terminal for AI-assisted development
        </p>
      </div>

      {/* TaskMaster Prompts Quick Access */}
      <Card className="mb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTaskMasterExpanded(!isTaskMasterExpanded)}
              className="p-1 hover:bg-primary-800/50 rounded transition-colors"
            >
              {isTaskMasterExpanded ? (
                <ChevronUp className="w-4 h-4 text-primary-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-primary-400" />
              )}
            </button>
            <div>
              <h2 className="text-base font-semibold text-primary-100">TaskMaster Commands</h2>
              <p className="text-xs text-primary-400">
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
          >
            <BookMarked className="mr-2 w-4 h-4" />
            View All
          </Button>
        </div>
        {isTaskMasterExpanded && (
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-3 rounded-lg bg-primary-800/50 border border-primary-700/50">
              <h3 className="text-sm font-medium text-primary-200 mb-1">Get Started</h3>
              <p className="text-xs text-primary-400 mb-2">
                Parse PRD and create initial tasks
              </p>
              <Button
                onClick={() => {
                  setCurrentStage('promptlibrary');
                  sessionStorage.setItem('promptLibraryFilter', 'taskmaster');
                  sessionStorage.setItem('promptLibrarySearch', 'Parse PRD');
                }}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                View Prompt
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-primary-800/50 border border-primary-700/50">
              <h3 className="text-sm font-medium text-primary-200 mb-1">Task Management</h3>
              <p className="text-xs text-primary-400 mb-2">
                Show tasks, get next task, analyze complexity
              </p>
              <Button
                onClick={() => {
                  setCurrentStage('promptlibrary');
                  sessionStorage.setItem('promptLibraryFilter', 'taskmaster');
                }}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                View Prompts
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-primary-800/50 border border-primary-700/50">
              <h3 className="text-sm font-medium text-primary-200 mb-1">Implementation</h3>
              <p className="text-xs text-primary-400 mb-2">
                Implement tasks, break down complex tasks
              </p>
              <Button
                onClick={() => {
                  setCurrentStage('promptlibrary');
                  sessionStorage.setItem('promptLibraryFilter', 'taskmaster');
                }}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                View Prompts
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Context Clipper */}
      <div className="mb-3 flex items-center justify-between px-3 py-2 rounded-lg bg-primary-900/30 border border-primary-800/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary-300">Context Clipper</span>
          <span className="text-xs text-primary-500">Copy project context for AI</span>
        </div>
        <Button
          onClick={handleCopyContext}
          variant="primary"
          size="sm"
          disabled={!currentProject}
          className="h-7 px-3 text-xs"
        >
          {copied ? (
            <>
              <Check className="mr-1.5 w-3.5 h-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-1.5 w-3.5 h-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <TerminalPanel />
      </div>
    </div>
  );
}
