import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTerminal } from '../contexts/TerminalContext';
import { supabase } from '../lib/supabase';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDevelopmentLoop.ts:4',message:'supabase import',data:{supabaseDefined:supabase!==undefined&&supabase!==null,supabaseType:typeof supabase,hasChannel:typeof (supabase as any).channel==='function',hasFrom:typeof (supabase as any).from==='function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion
import type { LoopStep } from '../components/workbench/DevelopmentLoopHelper';
import {
  detectCurrentStep,
  getCompletedSteps,
  type LoopDetectionContext,
  type LoopState,
} from '../utils/developmentLoopUtils';

const STORAGE_KEY = 'development_loop_state';

export function useDevelopmentLoop() {
  const { currentProject } = useApp();
  const { outputBuffer, commandHistory } = useTerminal();
  const [loopState, setLoopState] = useState<LoopState>({
    currentStep: null,
    completedSteps: [],
    activeTaskId: null,
    lastStepChange: null,
    loopIteration: 0,
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [briefGenerated, setBriefGenerated] = useState(false);
  const [hasRecentCommit, setHasRecentCommit] = useState(false);

  // Load tasks
  useEffect(() => {
    if (!currentProject) return;

    const loadTasks = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('order_index', { ascending: true });

      if (data) {
        setTasks(data);
      }
    };

    loadTasks();

    // Subscribe to task changes
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDevelopmentLoop.ts:47',message:'BEFORE channel call POST-FIX',data:{supabaseDefined:supabase!==undefined&&supabase!==null,supabaseType:typeof supabase,hasChannel:typeof supabase.channel==='function',hasRemoveChannel:typeof (supabase as any).removeChannel==='function',supabaseKeys:supabase?Object.keys(supabase):'null',currentProjectId:currentProject?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const channel = supabase
      .channel(`tasks_${currentProject.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${currentProject.id}`,
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProject]);

  // Detect active task
  const activeTask = useMemo(() => {
    return tasks.find((t) => t.status === 'in_progress') || null;
  }, [tasks]);

  // Check for brief generation
  useEffect(() => {
    const lastCommand = commandHistory[commandHistory.length - 1];
    if (lastCommand && lastCommand.includes('/brief')) {
      setBriefGenerated(true);
      // Reset after some time
      setTimeout(() => setBriefGenerated(false), 5 * 60 * 1000); // 5 minutes
    }
  }, [commandHistory]);

  // Check for commits in terminal output
  useEffect(() => {
    const recentOutput = outputBuffer
      .slice(-10)
      .map((item) => item.output)
      .join('\n')
      .toLowerCase();

    if (
      recentOutput.includes('commit') &&
      (recentOutput.includes('git commit') || recentOutput.includes('[main'))
    ) {
      setHasRecentCommit(true);
      // Reset after some time
      setTimeout(() => setHasRecentCommit(false), 2 * 60 * 1000); // 2 minutes
    }
  }, [outputBuffer]);

  // Build detection context
  const detectionContext: LoopDetectionContext = useMemo(
    () => ({
      hasActiveTask: !!activeTask,
      hasPendingTasks: tasks.some((t) => t.status === 'pending'),
      lastCommand: commandHistory[commandHistory.length - 1] || null,
      terminalActive: outputBuffer.length > 0,
      hasRecentCommit,
      briefGenerated,
    }),
    [activeTask, tasks, commandHistory, outputBuffer, hasRecentCommit, briefGenerated]
  );

  // Detect current step
  useEffect(() => {
    const currentStep = detectCurrentStep(detectionContext);
    const completedSteps = getCompletedSteps(detectionContext, currentStep);

    setLoopState((prev) => {
      // Only update if step actually changed
      if (prev.currentStep !== currentStep) {
        return {
          ...prev,
          currentStep,
          completedSteps,
          activeTaskId: activeTask?.id || null,
          lastStepChange: new Date(),
          // Increment iteration if we completed a full loop
          loopIteration:
            completedSteps.includes('commit') &&
            prev.completedSteps.includes('commit')
              ? prev.loopIteration + 1
              : prev.loopIteration,
        };
      }

      // Update other fields even if step didn't change
      return {
        ...prev,
        completedSteps,
        activeTaskId: activeTask?.id || null,
      };
    });
  }, [detectionContext, activeTask]);

  // Load saved state from localStorage
  useEffect(() => {
    if (!currentProject) return;

    const storageKey = `${STORAGE_KEY}_${currentProject.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLoopState((prev) => ({
          ...prev,
          loopIteration: parsed.loopIteration || 0,
        }));
      } catch (e) {
        console.error('Failed to load loop state:', e);
      }
    }
  }, [currentProject]);

  // Save state to localStorage
  useEffect(() => {
    if (!currentProject) return;

    const storageKey = `${STORAGE_KEY}_${currentProject.id}`;
    localStorage.setItem(storageKey, JSON.stringify(loopState));
  }, [currentProject, loopState]);

  const resetLoop = useCallback(() => {
    setLoopState({
      currentStep: null,
      completedSteps: [],
      activeTaskId: null,
      lastStepChange: null,
      loopIteration: loopState.loopIteration + 1,
    });
    setBriefGenerated(false);
    setHasRecentCommit(false);
  }, [loopState.loopIteration]);

  const markStepComplete = useCallback(
    (step: LoopStep) => {
      setLoopState((prev) => ({
        ...prev,
        completedSteps: [...new Set([...prev.completedSteps, step])],
      }));
    },
    []
  );

  return {
    currentStep: loopState.currentStep,
    completedSteps: loopState.completedSteps,
    activeTaskId: loopState.activeTaskId,
    loopIteration: loopState.loopIteration,
    activeTask,
    detectionContext,
    resetLoop,
    markStepComplete,
  };
}

