import React, { useState } from 'react';
import { useTerminal } from '../../contexts/TerminalContext';
import { TerminalOutput } from '../terminal/TerminalOutput';
import { CommandInput } from '../terminal/CommandInput';
import { ConnectionStatus } from '../terminal/ConnectionStatus';
import { TerminalToolbar } from '../terminal/TerminalToolbar';
import { TerminalSettings } from '../terminal/TerminalSettings';
import { FavoritesPanel } from '../terminal/FavoritesPanel';

export function TerminalPanel() {
  const {
    connectionStatus,
    outputBuffer,
    commandHistory,
    preferences,
    favoriteCommands,
    isExecuting,
    pendingCommand,
    executeCommand,
    clearOutput,
    navigateHistory,
    updatePreferences,
    addFavoriteCommand,
    removeFavoriteCommand,
    testConnection,
  } = useTerminal();

  const [showSettings, setShowSettings] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

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
    if (outputBuffer.length > 0) {
      const confirmed = window.confirm('Clear all terminal output?');
      if (confirmed) {
        clearOutput();
      }
    }
  };

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
          />

          {showSettings && (
            <TerminalSettings
              preferences={preferences}
              onUpdate={updatePreferences}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>

        <ConnectionStatus status={connectionStatus} onTestConnection={testConnection} />

        <div className="flex-1 flex flex-col overflow-hidden">
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
        </div>
      </div>
    </div>
  );
}
