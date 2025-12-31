/**
 * Global Save Hook
 * Manages global save state and automatic periodic saves
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { collectAndSaveProjectState } from '../lib/projectSave';

interface UseGlobalSaveReturn {
  saveProject: () => Promise<void>;
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function useGlobalSave(): UseGlobalSaveReturn {
  const { currentProject } = useApp();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const saveProject = useCallback(async () => {
    if (!currentProject || saving) return;

    setSaving(true);
    setError(null);

    try {
      const result = await collectAndSaveProjectState(currentProject.id);
      
      if (result.success) {
        setLastSaved(new Date());
        setError(null);
      } else {
        setError(result.error || 'Failed to save project state');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error in saveProject:', err);
    } finally {
      setSaving(false);
    }
  }, [currentProject, saving]);

  // Set up automatic periodic saves
  useEffect(() => {
    if (!currentProject) {
      // Clear interval if no project
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
      return;
    }

    // Initial save after a short delay
    const initialTimeout = setTimeout(() => {
      saveProject();
    }, 2000);

    // Set up periodic auto-save
    autoSaveIntervalRef.current = setInterval(() => {
      if (!saving) {
        saveProject();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    };
  }, [currentProject, saveProject, saving]);

  return {
    saveProject,
    saving,
    lastSaved,
    error,
  };
}

