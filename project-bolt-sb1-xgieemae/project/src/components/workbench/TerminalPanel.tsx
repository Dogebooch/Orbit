import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTerminal } from '../../contexts/TerminalContext';
import { TerminalOutput } from '../terminal/TerminalOutput';
import { CommandInput } from '../terminal/CommandInput';
import { ConnectionStatus } from '../terminal/ConnectionStatus';
import { TerminalToolbar } from '../terminal/TerminalToolbar';
import { TerminalSettings } from '../terminal/TerminalSettings';
import { FavoritesPanel } from '../terminal/FavoritesPanel';
import { XTerminal, XTerminalRef } from '../terminal/XTerminal';
import { GripVertical } from 'lucide-react';

const DEFAULT_TERMINAL_HEIGHT = 600; // pixels - increased for main focus
const MIN_TERMINAL_HEIGHT = 300;
const MAX_TERMINAL_HEIGHT = 1000;

export function TerminalPanel() {
  const {
    connectionStatus,
    isBackendConnected,
    outputBuffer,
    preferences,
    favoriteCommands,
    isExecuting,
    pendingCommand,
    workingDirectory,
    sendInput,
    resizeTerminal,
    setWorkingDirectory,
    executeCommand,
    clearOutput,
    navigateHistory,
    updatePreferences,
    addFavoriteCommand,
    removeFavoriteCommand,
    testConnection,
    setOnTerminalOutput,
  } = useTerminal();

  const [showSettings, setShowSettings] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showPathConfig, setShowPathConfig] = useState(false);
  const [pathInput, setPathInput] = useState(workingDirectory);
  const [hasCheckedPathConfig, setHasCheckedPathConfig] = useState(false);
  const xtermRef = useRef<(HTMLDivElement & XTerminalRef) | null>(null);
  
  // Terminal height state with localStorage persistence
  const [terminalHeight, setTerminalHeight] = useState(() => {
    const saved = localStorage.getItem('terminal-height');
    return saved ? parseInt(saved, 10) : DEFAULT_TERMINAL_HEIGHT;
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);

  // Update path input when working directory changes
  useEffect(() => {
    setPathInput(workingDirectory);
  }, [workingDirectory]);

  // Show path config on first visit if no working directory is set
  useEffect(() => {
    if (!hasCheckedPathConfig && !workingDirectory) {
      setShowPathConfig(true);
      setHasCheckedPathConfig(true);
    } else if (workingDirectory) {
      setHasCheckedPathConfig(true);
    }
  }, [workingDirectory, hasCheckedPathConfig]);

  // Set up terminal output callback
  useEffect(() => {
    setOnTerminalOutput((data: string) => {
      if (xtermRef.current?.terminalWrite) {
        xtermRef.current.terminalWrite(data);
      }
    });
  }, [setOnTerminalOutput]);

  // Handle terminal input (keystrokes)
  const handleTerminalData = useCallback((data: string) => {
    sendInput(data);
  }, [sendInput]);

  // Handle terminal resize
  const handleTerminalResize = useCallback((cols: number, rows: number) => {
    resizeTerminal(cols, rows);
  }, [resizeTerminal]);

  // Handle path configuration save
  const handleSavePath = () => {
    if (pathInput.trim()) {
      setWorkingDirectory(pathInput.trim());
      setShowPathConfig(false);
    }
  };

  const handleInitGit = async () => {
    if (!workingDirectory) {
      alert('Please set a working directory first');
      return;
    }

    if (isBackendConnected) {
      // Send git init command through terminal
      sendInput('git init\r');
    } else {
      // Fallback: execute command
      await executeCommand('git init');
    }
  };

  const handleOpenDirectory = async () => {
    if (!workingDirectory) {
      alert('Please set a working directory first');
      return;
    }

    // Check if we're in Electron
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const result = await (window as any).electronAPI.openDirectory(workingDirectory);
        if (!result.success) {
          console.error('Failed to open directory:', result.error);
          alert(`Failed to open directory: ${result.error}`);
        }
      } catch (error) {
        console.error('Error opening directory:', error);
        alert('Failed to open directory');
      }
    } else {
      // Fallback for web: show path in alert
      alert(`Working directory: ${workingDirectory}`);
    }
  };

  const handleCopyOutput = async () => {
    const text = outputBuffer
      .map((item) => `$ ${item.command}\n${item.output}`)
      .join('\n\n');

    await navigator.clipboard.writeText(text);
  };

  const handleExportSession = () => {
    const text = outputBuffer
      .map((item) => {
        const timestamp = item.executedAt.toISOString();
        return `[${timestamp}] $ ${item.command}\n${item.output}\n`;
      })
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-session-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (isBackendConnected && xtermRef.current?.terminalClear) {
      xtermRef.current.terminalClear();
    } else if (outputBuffer.length > 0) {
      const confirmed = window.confirm('Clear all terminal output?');
      if (confirmed) {
        clearOutput();
      }
    }
  };

  // Handle pending command (from TaskMaster commands)
  useEffect(() => {
    if (pendingCommand && isBackendConnected && xtermRef.current?.terminalWrite) {
      // Write the pending command to terminal but don't execute yet
      // User can see it and press Enter to execute
      xtermRef.current.terminalWrite(pendingCommand);
    }
  }, [pendingCommand, isBackendConnected]);

  // Save terminal height to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('terminal-height', terminalHeight.toString());
  }, [terminalHeight]);

  // Handle resize drag start
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = terminalHeight;
  }, [terminalHeight]);

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizeStartY.current;
      const newHeight = Math.max(
        MIN_TERMINAL_HEIGHT,
        Math.min(MAX_TERMINAL_HEIGHT, resizeStartHeight.current - deltaY)
      );
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Trigger terminal resize when height changes (for xterm)
  useEffect(() => {
    if (isBackendConnected && xtermRef.current?.terminalFit) {
      // Small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        xtermRef.current?.terminalFit();
      }, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [terminalHeight, isBackendConnected]);

  return (
    <div className="flex gap-4" style={{ height: `${terminalHeight}px`, minHeight: `${MIN_TERMINAL_HEIGHT}px` }}>
      {showFavorites && (
        <FavoritesPanel
          favorites={favoriteCommands}
          onExecute={executeCommand}
          onAdd={addFavoriteCommand}
          onRemove={removeFavoriteCommand}
          onClose={() => setShowFavorites(false)}
        />
      )}

      <div className="flex-1 flex flex-col bg-gray-950 rounded-lg border border-gray-800 shadow-2xl overflow-hidden relative">
        {/* Resize Handle - Top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:h-2 transition-all group z-50"
          onMouseDown={handleResizeStart}
          style={{ cursor: isResizing ? 'row-resize' : 'row-resize' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-0.5 bg-gray-700 group-hover:bg-gray-600 rounded-full transition-colors" />
          </div>
          <GripVertical className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="relative">
          <TerminalToolbar
            onClear={handleClear}
            onCopyOutput={handleCopyOutput}
            onExportSession={handleExportSession}
            onToggleSettings={() => setShowSettings(!showSettings)}
            onToggleFavorites={() => setShowFavorites(!showFavorites)}
            showSettings={showSettings}
            showFavorites={showFavorites}
            onTogglePathConfig={() => setShowPathConfig(!showPathConfig)}
            showPathConfig={showPathConfig}
            onInitGit={handleInitGit}
            onOpenDirectory={handleOpenDirectory}
            workingDirectory={workingDirectory}
          />

          {showSettings && (
            <TerminalSettings
              preferences={preferences}
              onUpdate={updatePreferences}
              onClose={() => setShowSettings(false)}
            />
          )}

          {showPathConfig && (
            <div className="absolute top-full left-0 right-0 bg-gray-900 border-b border-gray-700 p-4 z-20 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm text-gray-300 font-medium">Project Path:</label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pathInput}
                  onChange={(e) => setPathInput(e.target.value)}
                  placeholder="e.g., P:\Python Projects\MyApp"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSavePath}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                >
                  Set Path
                </button>
                <button
                  onClick={() => setShowPathConfig(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This sets the working directory for the terminal and file watcher.
              </p>
            </div>
          )}
        </div>

        <ConnectionStatus status={connectionStatus} onTestConnection={testConnection} />

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {isBackendConnected ? (
            // Real terminal with xterm.js when backend is connected
            <div className="flex-1 p-2 min-h-0 overflow-hidden">
              <XTerminal
                ref={xtermRef}
                onData={handleTerminalData}
                onResize={handleTerminalResize}
                fontSize={preferences.fontSize}
                colorScheme={preferences.colorScheme}
              />
            </div>
          ) : (
            // Simulated terminal when disconnected
            <>
              <TerminalOutput
                items={outputBuffer}
                showTimestamps={preferences.showTimestamps}
                autoScroll={preferences.autoScroll}
                fontSize={preferences.fontSize}
              />

              <CommandInput
                onExecute={executeCommand}
                onNavigateHistory={navigateHistory}
                isExecuting={isExecuting}
                fontSize={preferences.fontSize}
                initialCommand={pendingCommand}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
