import React from 'react';
import { X } from 'lucide-react';

interface TerminalPreferences {
  fontSize: number;
  colorScheme: 'dark' | 'matrix' | 'ocean';
  autoScroll: boolean;
  showTimestamps: boolean;
}

interface TerminalSettingsProps {
  preferences: TerminalPreferences;
  onUpdate: (prefs: Partial<TerminalPreferences>) => void;
  onClose: () => void;
}

export function TerminalSettings({ preferences, onUpdate, onClose }: TerminalSettingsProps) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-gray-200">Terminal Preferences</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Font Size: {preferences.fontSize}px
          </label>
          <input
            type="range"
            min="10"
            max="20"
            value={preferences.fontSize}
            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Color Scheme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['dark', 'matrix', 'ocean'] as const).map((scheme) => (
              <button
                key={scheme}
                onClick={() => onUpdate({ colorScheme: scheme })}
                className={`px-3 py-2 rounded text-sm capitalize transition-colors ${
                  preferences.colorScheme === scheme
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {scheme}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.autoScroll}
              onChange={(e) => onUpdate({ autoScroll: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-300">Auto-scroll to bottom</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.showTimestamps}
              onChange={(e) => onUpdate({ showTimestamps: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-300">Show timestamps</span>
          </label>
        </div>
      </div>
    </div>
  );
}
