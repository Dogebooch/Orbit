import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from './AppContext';

export interface AISession {
  id: string;
  project_id: string;
  user_id: string;
  session_name: string;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'archived';
  task_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type SessionHealthStatus = 'healthy' | 'warning' | 'critical';

export interface SessionHealth {
  status: SessionHealthStatus;
  reasons: string[];
  recommendations: string[];
}

interface SessionContextType {
  currentSession: AISession | null;
  sessionHealth: SessionHealth;
  recentSessions: AISession[];
  isLoading: boolean;
  
  // Actions
  startNewSession: (sessionName?: string, taskId?: string) => Promise<AISession | null>;
  endCurrentSession: () => Promise<void>;
  switchToSession: (sessionId: string) => Promise<void>;
  addTaskToSession: (taskId: string) => Promise<void>;
  removeTaskFromSession: (taskId: string) => Promise<void>;
  updateSessionName: (sessionName: string) => Promise<void>;
  archiveSession: (sessionId: string) => Promise<void>;
  loadRecentSessions: () => Promise<void>;
  
  // Detection
  checkSessionHealth: () => SessionHealth;
  shouldStartNewSession: (newTaskId: string) => boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const DEFAULT_SESSION_HEALTH: SessionHealth = {
  status: 'healthy',
  reasons: [],
  recommendations: [],
};

// Session health thresholds
const SESSION_DURATION_WARNING_MS = 2 * 60 * 60 * 1000; // 2 hours
const SESSION_DURATION_CRITICAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const TASK_COUNT_WARNING = 3;
const TASK_COUNT_CRITICAL = 5;

export function SessionProvider({ children }: { children: ReactNode }) {
  const { currentProject, user } = useApp();
  const [currentSession, setCurrentSession] = useState<AISession | null>(null);
  const [sessionHealth, setSessionHealth] = useState<SessionHealth>(DEFAULT_SESSION_HEALTH);
  const [recentSessions, setRecentSessions] = useState<AISession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load current active session when project changes
  useEffect(() => {
    if (currentProject) {
      loadCurrentSession();
      loadRecentSessions();
    } else {
      setCurrentSession(null);
      setRecentSessions([]);
    }
  }, [currentProject]);

  // Update session health whenever current session changes
  useEffect(() => {
    if (currentSession) {
      const health = checkSessionHealth();
      setSessionHealth(health);
    } else {
      setSessionHealth(DEFAULT_SESSION_HEALTH);
    }
  }, [currentSession]);

  const loadCurrentSession = async () => {
    if (!currentProject) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_sessions')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCurrentSession(data);
    } catch (error) {
      console.error('Error loading current session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentSessions = useCallback(async () => {
    if (!currentProject) return;

    try {
      const { data, error } = await supabase
        .from('ai_sessions')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  }, [currentProject]);

  const startNewSession = async (sessionName?: string, taskId?: string): Promise<AISession | null> => {
    if (!currentProject || !user) return null;

    setIsLoading(true);
    try {
      // End current session if exists
      if (currentSession) {
        await endCurrentSession();
      }

      // Generate default session name if not provided
      const defaultName = sessionName || `Session ${new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;

      const { data, error } = await supabase
        .from('ai_sessions')
        .insert({
          project_id: currentProject.id,
          user_id: user.id,
          session_name: defaultName,
          status: 'active',
          task_ids: taskId ? [taskId] : [],
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data);
      await loadRecentSessions();
      return data;
    } catch (error) {
      console.error('Error starting new session:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const endCurrentSession = async () => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from('ai_sessions')
        .update({
          ended_at: new Date().toISOString(),
          status: 'archived',
        })
        .eq('id', currentSession.id);

      if (error) throw error;
      setCurrentSession(null);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const switchToSession = async (sessionId: string) => {
    if (!currentProject) return;

    setIsLoading(true);
    try {
      // End current session
      if (currentSession && currentSession.id !== sessionId) {
        await endCurrentSession();
      }

      // Activate the selected session
      const { data, error } = await supabase
        .from('ai_sessions')
        .update({ status: 'active', ended_at: null })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(data);
    } catch (error) {
      console.error('Error switching session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTaskToSession = async (taskId: string) => {
    if (!currentSession) return;

    try {
      const updatedTaskIds = [...new Set([...currentSession.task_ids, taskId])];
      
      const { data, error } = await supabase
        .from('ai_sessions')
        .update({ task_ids: updatedTaskIds })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(data);

      // Update the task's current_session_id
      await supabase
        .from('tasks')
        .update({ current_session_id: currentSession.id })
        .eq('id', taskId);
    } catch (error) {
      console.error('Error adding task to session:', error);
    }
  };

  const removeTaskFromSession = async (taskId: string) => {
    if (!currentSession) return;

    try {
      const updatedTaskIds = currentSession.task_ids.filter(id => id !== taskId);
      
      const { data, error } = await supabase
        .from('ai_sessions')
        .update({ task_ids: updatedTaskIds })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(data);

      // Clear the task's current_session_id
      await supabase
        .from('tasks')
        .update({ current_session_id: null })
        .eq('id', taskId);
    } catch (error) {
      console.error('Error removing task from session:', error);
    }
  };

  const updateSessionName = async (sessionName: string) => {
    if (!currentSession) return;

    try {
      const { data, error } = await supabase
        .from('ai_sessions')
        .update({ session_name: sessionName })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(data);
    } catch (error) {
      console.error('Error updating session name:', error);
    }
  };

  const archiveSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('ai_sessions')
        .update({ 
          status: 'archived',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
      await loadRecentSessions();
    } catch (error) {
      console.error('Error archiving session:', error);
    }
  };

  const checkSessionHealth = useCallback((): SessionHealth => {
    if (!currentSession) {
      return DEFAULT_SESSION_HEALTH;
    }

    const reasons: string[] = [];
    const recommendations: string[] = [];
    let status: SessionHealthStatus = 'healthy';

    // Check session duration
    const startedAt = new Date(currentSession.started_at).getTime();
    const now = Date.now();
    const durationMs = now - startedAt;

    if (durationMs > SESSION_DURATION_CRITICAL_MS) {
      status = 'critical';
      reasons.push(`Session has been active for ${Math.round(durationMs / (60 * 60 * 1000))} hours`);
      recommendations.push('Start a new session to prevent context pollution');
    } else if (durationMs > SESSION_DURATION_WARNING_MS) {
      if (status !== 'critical') status = 'warning';
      reasons.push(`Session has been active for ${Math.round(durationMs / (60 * 60 * 1000))} hours`);
      recommendations.push('Consider starting a new session for the next feature');
    }

    // Check task count
    const taskCount = currentSession.task_ids.length;
    if (taskCount >= TASK_COUNT_CRITICAL) {
      status = 'critical';
      reasons.push(`${taskCount} tasks in current session`);
      recommendations.push('Too many tasks in one session - start fresh');
    } else if (taskCount >= TASK_COUNT_WARNING) {
      if (status !== 'critical') status = 'warning';
      reasons.push(`${taskCount} tasks in current session`);
      recommendations.push('Consider grouping related tasks in new sessions');
    }

    return { status, reasons, recommendations };
  }, [currentSession]);

  const shouldStartNewSession = useCallback((newTaskId: string): boolean => {
    if (!currentSession) return false;

    // If session is in critical health, always recommend new session
    const health = checkSessionHealth();
    if (health.status === 'critical') return true;

    // If task is already in current session, no need for new session
    if (currentSession.task_ids.includes(newTaskId)) return false;

    // If session has warning health and switching to different task, recommend new session
    if (health.status === 'warning') return true;

    return false;
  }, [currentSession, checkSessionHealth]);

  const value: SessionContextType = {
    currentSession,
    sessionHealth,
    recentSessions,
    isLoading,
    startNewSession,
    endCurrentSession,
    switchToSession,
    addTaskToSession,
    removeTaskFromSession,
    updateSessionName,
    archiveSession,
    loadRecentSessions,
    checkSessionHealth,
    shouldStartNewSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

