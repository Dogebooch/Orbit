/**
 * Global Save Button Component
 * Persistent, non-invasive save button for global project saves
 */

import { Save, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';

interface GlobalSaveButtonProps {
  onSave: () => Promise<void>;
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function GlobalSaveButton({ onSave, saving, lastSaved, error }: GlobalSaveButtonProps) {
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return 'Never saved';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  const getIcon = () => {
    if (saving) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (error) return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (lastSaved && Date.now() - lastSaved.getTime() < 2000) {
      return <Check className="w-4 h-4 text-green-400" />;
    }
    return <Save className="w-4 h-4" />;
  };

  const getTooltipText = () => {
    if (saving) return 'Saving...';
    if (error) return `Error: ${error}`;
    if (lastSaved) return `Last saved: ${formatLastSaved(lastSaved)}`;
    return 'Save project state (Ctrl+S)';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Tooltip content={getTooltipText()} position="left">
        <Button
          onClick={onSave}
          disabled={saving}
          className="w-10 h-10 p-0 rounded-full shadow-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Save project state"
        >
          {getIcon()}
        </Button>
      </Tooltip>
    </div>
  );
}

