import React, { useState } from 'react';
import { Code2, BookMarked, ExternalLink, Copy, Check } from 'lucide-react';
import { TerminalPanel } from '../workbench/TerminalPanel';
import { Card, Button } from '../ui';
import { useApp } from '../../contexts/AppContext';
import { fetchProjectData, generateClaudeMd } from '../../lib/claudeExport';

export function WorkbenchStage() {
  const { setCurrentStage, currentProject } = useApp();
  const [copied, setCopied] = useState(false);

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
          <Code2 className="w-8 h-8 text-primary-400" />
          Mission Control
        </h1>
        <p className="text-primary-400 mt-2">
          Integrated terminal for AI-assisted development
        </p>
      </div>

      {/* TaskMaster Prompts Quick Access */}
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-100 mb-1">TaskMaster Commands</h2>
            <p className="text-sm text-primary-400">
              Quick access to TaskMaster prompts for managing your project tasks
            </p>
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
            View All TaskMaster Prompts
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
      </Card>

      {/* Context Clipper */}
      <Card className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-primary-100 mb-1">Context Clipper</h2>
            <p className="text-sm text-primary-400">
              Copy complete project context (Vision, User Profile, Guidelines, Current Task) for AI assistants
            </p>
          </div>
          <Button
            onClick={handleCopyContext}
            variant="primary"
            size="sm"
            disabled={!currentProject}
          >
            {copied ? (
              <>
                <Check className="mr-2 w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 w-4 h-4" />
                Copy Context
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="flex-1 min-h-0 overflow-hidden">
        <TerminalPanel />
      </div>
    </div>
  );
}
