import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTerminal } from '../../../contexts/TerminalContext';
import { Button, AIHelperButton } from '../../ui';
import { FileCode, RefreshCw, Download, FolderOpen, CheckCircle } from 'lucide-react';
import {
  generateClaudeMd,
  generateCursorrules,
  generateCopilotInstructions,
  createDefaultGeneratorContext,
} from '../../../config/fileTemplates';
import { downloadFile, writeFileViaWebSocket } from '../../../utils/fileOutput';
import { getWebSocketClient } from '../../../lib/websocket';

type ActiveFile = 'claude' | 'cursorrules' | 'copilot';

interface ProjectFilesEditorProps {
  projectName: string;
  projectDescription: string;
  vision?: {
    problem: string;
    target_user: string;
    success_metrics: string;
  };
  userProfile?: {
    primary_user: string;
    goal: string;
    technical_comfort: string;
  };
  activeFile?: ActiveFile;
  onActiveFileChange?: (file: ActiveFile) => void;
  onFileGenerated?: (file: ActiveFile) => void;
}

export function ProjectFilesEditor({
  projectName,
  projectDescription,
  vision,
  userProfile,
  activeFile: controlledActiveFile,
  onActiveFileChange,
  onFileGenerated,
}: ProjectFilesEditorProps) {
  const { workingDirectory, isBackendConnected } = useTerminal();
  const [activeFile, setActiveFile] = useState<ActiveFile>(controlledActiveFile || 'claude');
  const [claudeContent, setClaudeContent] = useState('');
  const [cursorrulesContent, setCursorrulesContent] = useState('');
  const [copilotContent, setCopilotContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [writeSuccess, setWriteSuccess] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync with parent-controlled activeFile
  useEffect(() => {
    if (controlledActiveFile !== undefined && controlledActiveFile !== activeFile) {
      setActiveFile(controlledActiveFile);
    }
  }, [controlledActiveFile]);

  const handleSetActiveFile = (file: ActiveFile) => {
    setActiveFile(file);
    onActiveFileChange?.(file);
  };

  // Generate initial content when component mounts or foundation data changes
  useEffect(() => {
    if (isInitialized) return;

    const generatorContext = createDefaultGeneratorContext(
      projectName,
      projectDescription,
      vision,
      userProfile
    );

    if (!claudeContent) {
      setClaudeContent(generateClaudeMd(generatorContext));
    }
    if (!cursorrulesContent) {
      setCursorrulesContent(generateCursorrules(generatorContext));
    }
    if (!copilotContent) {
      setCopilotContent(generateCopilotInstructions(generatorContext));
    }

    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName, projectDescription, vision, userProfile]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const getCurrentContent = (): string => {
    switch (activeFile) {
      case 'claude':
        return claudeContent;
      case 'cursorrules':
        return cursorrulesContent;
      case 'copilot':
        return copilotContent;
    }
  };

  const setCurrentContent = (content: string) => {
    switch (activeFile) {
      case 'claude':
        setClaudeContent(content);
        break;
      case 'cursorrules':
        setCursorrulesContent(content);
        break;
      case 'copilot':
        setCopilotContent(content);
        break;
    }
  };

  const getCurrentFilename = (): string => {
    switch (activeFile) {
      case 'claude':
        return 'CLAUDE.md';
      case 'cursorrules':
        return '.cursorrules';
      case 'copilot':
        return '.github/copilot-instructions.md';
    }
  };

  const handleContentChange = (value: string) => {
    setCurrentContent(value);
    triggerAutoSave();
  };

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      // Auto-save is handled by parent component
      setLastSaved(new Date());
    }, 2000);
    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout]);

  const handleRegenerate = () => {
    const generatorContext = createDefaultGeneratorContext(
      projectName,
      projectDescription,
      vision,
      userProfile
    );

    switch (activeFile) {
      case 'claude':
        setClaudeContent(generateClaudeMd(generatorContext));
        break;
      case 'cursorrules':
        setCursorrulesContent(generateCursorrules(generatorContext));
        break;
      case 'copilot':
        setCopilotContent(generateCopilotInstructions(generatorContext));
        break;
    }
  };

  const handleDownload = () => {
    const content = getCurrentContent();
    const filename = getCurrentFilename();
    downloadFile(content, filename);
  };

  const handleWriteToProject = async () => {
    if (!isBackendConnected || !workingDirectory) {
      return;
    }

    setSaving(true);
    setWriteSuccess(false);

    try {
      const content = getCurrentContent();
      const filename = getCurrentFilename();
      const fullPath = `${workingDirectory}/${filename}`;

      const wsClient = getWebSocketClient(
        () => {},
        () => {}
      );

      const result = await writeFileViaWebSocket(wsClient, fullPath, content, {
        createDirectories: true,
      });

      if (result.success) {
        setWriteSuccess(true);
        setTimeout(() => setWriteSuccess(false), 3000);
        onFileGenerated?.(activeFile);
      }
    } catch (error) {
      console.error('Failed to write file:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAIImprove = (improvedContent: string) => {
    handleContentChange(improvedContent);
  };

  const currentContent = getCurrentContent();
  const filename = getCurrentFilename();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between -mx-6 px-6 py-3 bg-slate-800/50 border-b border-slate-700 rounded-t-lg">
        <div className="flex gap-2">
          <Button
            variant={activeFile === 'claude' ? 'primary' : 'ghost'}
            onClick={() => handleSetActiveFile('claude')}
          >
            <FileCode className="w-4 h-4 mr-2 text-purple-400" />
            CLAUDE.md
          </Button>
          <Button
            variant={activeFile === 'cursorrules' ? 'primary' : 'ghost'}
            onClick={() => handleSetActiveFile('cursorrules')}
          >
            <FileCode className="w-4 h-4 mr-2 text-blue-400" />
            .cursorrules
          </Button>
          <Button
            variant={activeFile === 'copilot' ? 'primary' : 'ghost'}
            onClick={() => handleSetActiveFile('copilot')}
          >
            <FileCode className="w-4 h-4 mr-2 text-green-400" />
            copilot-instructions.md
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-sm text-primary-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleRegenerate} title="Regenerate from foundation data">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 380px)', minHeight: '500px' }}>
        <div className="flex items-center gap-2 mb-2 px-1 flex-shrink-0">
          <FileCode className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-primary-300">
            Editor
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-primary-500">
              {currentContent.length} characters
            </span>
            <AIHelperButton
              content={currentContent}
              contentType="vision"
              onImprove={handleAIImprove}
              fieldLabel={activeFile === 'claude' ? 'CLAUDE.md' : activeFile === 'cursorrules' ? '.cursorrules' : 'copilot instructions'}
            />
          </div>
        </div>
        <textarea
          value={currentContent}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={`Start editing ${filename}...`}
          className="flex-1 w-full p-4 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 overflow-auto placeholder-primary-600"
          spellCheck={false}
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-primary-700">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {isBackendConnected && workingDirectory && (
            <Button
              variant="secondary"
              onClick={handleWriteToProject}
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Writing...
                </>
              ) : writeSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                  Written!
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Write to Project
                </>
              )}
            </Button>
          )}
        </div>
        {isBackendConnected && workingDirectory && (
          <span className="text-xs text-primary-500">
            Target: <code className="bg-primary-900 px-2 py-0.5 rounded">{workingDirectory}</code>
          </span>
        )}
      </div>
    </div>
  );
}

