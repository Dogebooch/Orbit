import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onStageChange?: (stage: string) => void;
  onNewProject?: () => void;
  onSave?: () => void;
  onCommandPalette?: () => void;
  onEscape?: () => void;
  onCopyContext?: () => void;
}

// Updated stages: removed research, added setup at the beginning, removed maintenance
const STAGES = ['dashboard', 'setup', 'vision', 'strategy', 'workbench', 'promptlibrary', 'testing'];

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const target = event.target as HTMLElement;
    
    // Don't trigger shortcuts when typing in inputs
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || 
                           target.isContentEditable;

    // Escape should always work
    if (event.key === 'Escape' && handlers.onEscape) {
      handlers.onEscape();
      return;
    }

    // Don't process other shortcuts when typing
    if (isInputFocused) return;

    // Ctrl/Cmd + 0-7: Switch stages
    if (isCtrlOrCmd && event.key >= '0' && event.key <= '7') {
      event.preventDefault();
      const stageIndex = parseInt(event.key);
      if (stageIndex < STAGES.length && handlers.onStageChange) {
        handlers.onStageChange(STAGES[stageIndex]);
      }
      return;
    }

    // Ctrl/Cmd + N: New project
    if (isCtrlOrCmd && event.key === 'n') {
      event.preventDefault();
      handlers.onNewProject?.();
      return;
    }

    // Ctrl/Cmd + S: Save
    if (isCtrlOrCmd && event.key === 's') {
      event.preventDefault();
      handlers.onSave?.();
      return;
    }

    // Ctrl/Cmd + K: Command palette
    if (isCtrlOrCmd && event.key === 'k') {
      event.preventDefault();
      handlers.onCommandPalette?.();
      return;
    }

    // Ctrl/Cmd + Shift + C: Copy context
    if (isCtrlOrCmd && event.shiftKey && event.key === 'C') {
      event.preventDefault();
      handlers.onCopyContext?.();
      return;
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl + 0-7', description: 'Switch between stages' },
  { keys: 'Ctrl + N', description: 'Create new project' },
  { keys: 'Ctrl + S', description: 'Force save' },
  { keys: 'Ctrl + K', description: 'Command palette' },
  { keys: 'Ctrl + Shift + C', description: 'Copy project context' },
  { keys: 'Escape', description: 'Close modals/dialogs' },
];
