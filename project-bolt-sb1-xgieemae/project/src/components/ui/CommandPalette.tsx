import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Lightbulb, ListChecks, Code2, Rocket, BookMarked, Settings, FolderPlus, Copy, Keyboard } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const executeCommand = useCallback((cmd: Command) => {
    cmd.action();
    onClose();
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selectedEl = list.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Palette */}
      <div className="relative w-full max-w-lg bg-primary-900 border border-primary-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-primary-700">
          <Search className="w-5 h-5 text-primary-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-primary-100 placeholder-primary-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 bg-primary-800 border border-primary-600 rounded text-xs text-primary-400">
            esc
          </kbd>
        </div>

        {/* Commands List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-primary-500">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isSelected 
                      ? 'bg-primary-700 text-primary-100' 
                      : 'text-primary-300 hover:bg-primary-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-200' : 'text-primary-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{cmd.label}</div>
                    {cmd.description && (
                      <div className="text-xs text-primary-500 truncate">{cmd.description}</div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-primary-700 bg-primary-800/50 flex items-center gap-4 text-xs text-primary-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-primary-700 rounded">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-primary-700 rounded">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-primary-700 rounded">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}

// Default command icons export for use elsewhere
export const CommandIcons = {
  Search,
  Lightbulb,
  ListChecks,
  Code2,
  Rocket,
  BookMarked,
  Settings,
  FolderPlus,
  Copy,
  Keyboard,
};

