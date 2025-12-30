import React from 'react';
import { Trash2, Copy, Download, Settings, Star, FolderOpen } from 'lucide-react';

interface TerminalToolbarProps {
  onClear: () => void;
  onCopyOutput: () => void;
  onExportSession: () => void;
  onToggleSettings: () => void;
  onToggleFavorites: () => void;
  showSettings: boolean;
  showFavorites: boolean;
  onTogglePathConfig?: () => void;
  showPathConfig?: boolean;
}

export function TerminalToolbar({
  onClear,
  onCopyOutput,
  onExportSession,
  onToggleSettings,
  onToggleFavorites,
  showSettings,
  showFavorites,
  onTogglePathConfig,
  showPathConfig,
}: TerminalToolbarProps) {
  return (
    <div className="border-b border-gray-700 bg-gray-900 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300">Terminal</span>
        </div>

        <div className="flex items-center gap-1">
          {onTogglePathConfig && (
            <button
              onClick={onTogglePathConfig}
              className={`p-2 rounded transition-colors ${
                showPathConfig
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
              }`}
              title="Set project path"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleFavorites}
            className={`p-2 rounded transition-colors ${
              showFavorites
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
            }`}
            title="Toggle favorites"
          >
            <Star className="w-4 h-4" />
          </button>

          <button
            onClick={onCopyOutput}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
            title="Copy all output"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={onExportSession}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
            title="Export session"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClear}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
            title="Clear terminal (Ctrl+L)"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSettings}
            className={`p-2 rounded transition-colors ${
              showSettings
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
            }`}
            title="Terminal settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
