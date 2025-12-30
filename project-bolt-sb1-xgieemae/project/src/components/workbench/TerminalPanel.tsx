import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTerminal } from '../../contexts/TerminalContext';
import { TerminalOutput } from '../terminal/TerminalOutput';
import { CommandInput } from '../terminal/CommandInput';
import { ConnectionStatus } from '../terminal/ConnectionStatus';
import { TerminalToolbar } from '../terminal/TerminalToolbar';
import { TerminalSettings } from '../terminal/TerminalSettings';
import { FavoritesPanel } from '../terminal/FavoritesPanel';
import { XTerminal, XTerminalRef } from '../terminal/XTerminal';

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
  const xtermRef = useRef<(HTMLDivElement & XTerminalRef) | null>(null);

  // Update path input when working directory changes
  useEffect(() => {
    setPathInput(workingDirectory);
  }, [workingDirectory]);

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

  return (
    <div className="h-full flex gap-4">
      {showFavorites && (
        <FavoritesPanel
          favorites={favoriteCommands}
          onExecute={executeCommand}
          onAdd={addFavoriteCommand}
          onRemove={removeFavoriteCommand}
          onClose={() => setShowFavorites(false)}
        />
      )}

      <div className="flex-1 flex flex-col bg-gray-950 rounded-lg border border-gray-800 shadow-2xl overflow-hidden">
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

        <div className="flex-1 flex flex-col overflow-hidden">
          {isBackendConnected ? (
            // Real terminal with xterm.js when backend is connected
            <div className="flex-1 p-2">
              <XTerminal
                ref={xtermRef as React.Ref<HTMLDivElement>}
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
