import React, { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { Button, Input } from '../ui';
import {
  X,
  Plus,
  Archive,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface SessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedTaskId?: string;
  suggestedSessionName?: string;
}

export function SessionManager({
  isOpen,
  onClose,
  suggestedTaskId,
  suggestedSessionName,
}: SessionManagerProps) {
  const {
    currentSession,
    recentSessions,
    sessionHealth,
    isLoading,
    startNewSession,
    endCurrentSession,
    switchToSession,
    updateSessionName,
    archiveSession,
    loadRecentSessions,
  } = useSession();

  const [newSessionName, setNewSessionName] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRecentSessions();
      if (suggestedSessionName) {
        setNewSessionName(suggestedSessionName);
      }
    }
  }, [isOpen, suggestedSessionName, loadRecentSessions]);

  const handleStartNewSession = async () => {
    const sessionName = newSessionName.trim() || undefined;
    await startNewSession(sessionName, suggestedTaskId);
    setNewSessionName('');
    onClose();
  };

  const handleEndSession = async () => {
    if (window.confirm('End the current session? You can always start a new one.')) {
      await endCurrentSession();
      onClose();
    }
  };

  const handleSwitchSession = async (sessionId: string) => {
    await switchToSession(sessionId);
    onClose();
  };

  const handleUpdateSessionName = async (sessionId: string) => {
    if (editingName.trim() && currentSession?.id === sessionId) {
      await updateSessionName(editingName.trim());
    }
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleArchiveSession = async (sessionId: string) => {
    if (window.confirm('Archive this session? You can view it later in archived sessions.')) {
      await archiveSession(sessionId);
    }
  };

  const formatDuration = (startedAt: string, endedAt: string | null) => {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const durationMs = end - start;

    const hours = Math.floor(durationMs / (60 * 60 * 1000));
    const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-primary-400" />;
    }
  };

  const activeSessions = recentSessions.filter(s => s.status === 'active');
  const archivedSessions = recentSessions.filter(s => s.status === 'archived');
  const displayedSessions = showArchived ? archivedSessions : activeSessions;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-900 border border-primary-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary-700">
          <div>
            <h2 className="text-xl font-semibold text-primary-100">AI Session Management</h2>
            <p className="text-sm text-primary-400 mt-1">
              Manage your AI conversation sessions to prevent context pollution
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Current Session */}
          {currentSession && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary-300 uppercase tracking-wide">
                Current Session
              </h3>
              <div className="p-4 bg-primary-800/40 border border-primary-700 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {editingSessionId === currentSession.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateSessionName(currentSession.id);
                            if (e.key === 'Escape') {
                              setEditingSessionId(null);
                              setEditingName('');
                            }
                          }}
                          className="flex-1 text-sm"
                          autoFocus
                        />
                        <Button
                          onClick={() => handleUpdateSessionName(currentSession.id)}
                          className="text-xs py-1 px-2"
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingSessionId(currentSession.id);
                          setEditingName(currentSession.session_name);
                        }}
                        className="text-left hover:text-primary-100 transition-colors"
                      >
                        <h4 className="text-base font-medium text-primary-100">
                          {currentSession.session_name}
                        </h4>
                      </button>
                    )}
                    <div className="flex items-center gap-3 text-xs text-primary-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(currentSession.started_at, currentSession.ended_at)}
                      </span>
                      <span>
                        {currentSession.task_ids.length} task{currentSession.task_ids.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {getHealthIcon(sessionHealth.status)}
                </div>

                {/* Health warnings */}
                {sessionHealth.status !== 'healthy' && (
                  <div className="pt-3 border-t border-primary-700/50 space-y-2">
                    <p className="text-xs font-medium text-primary-300">Session Health:</p>
                    <ul className="text-xs text-primary-400 space-y-1">
                      {sessionHealth.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary-500">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                    {sessionHealth.recommendations.length > 0 && (
                      <>
                        <p className="text-xs font-medium text-primary-300 mt-2">Recommendations:</p>
                        <ul className="text-xs text-primary-400 space-y-1">
                          {sessionHealth.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary-500">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-primary-700/50">
                  <Button
                    onClick={handleEndSession}
                    variant="secondary"
                    className="text-xs flex-1"
                  >
                    <Archive className="w-3 h-3 mr-1" />
                    End Session
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Start New Session */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary-300 uppercase tracking-wide">
              Start New Session
            </h3>
            <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg space-y-3">
              <p className="text-xs text-blue-300">
                Starting a fresh session helps prevent context pollution and ensures better AI responses.
              </p>
              <div className="flex gap-2">
                <Input
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Session name (optional)"
                  onKeyDown={(e) => e.key === 'Enter' && handleStartNewSession()}
                  className="flex-1"
                />
                <Button
                  onClick={handleStartNewSession}
                  disabled={isLoading}
                  className="whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Start Session
                </Button>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary-300 uppercase tracking-wide">
                {showArchived ? 'Archived Sessions' : 'Recent Sessions'}
              </h3>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                {showArchived ? 'Show Active' : 'Show Archived'}
              </button>
            </div>

            {displayedSessions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm text-primary-400">
                  {showArchived ? 'No archived sessions' : 'No recent sessions'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 bg-primary-800/40 border border-primary-700 rounded-lg hover:bg-primary-800/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-primary-100 truncate">
                          {session.session_name}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-primary-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.started_at, session.ended_at)}
                          </span>
                          <span>
                            {session.task_ids.length} task{session.task_ids.length !== 1 ? 's' : ''}
                          </span>
                          {session.status === 'archived' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-900/50 text-primary-500 uppercase">
                              Archived
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {session.status === 'active' && session.id !== currentSession?.id && (
                          <button
                            onClick={() => handleSwitchSession(session.id)}
                            className="p-1.5 hover:bg-primary-700 rounded transition-colors"
                            title="Switch to this session"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                        )}
                        <button
                          onClick={() => handleArchiveSession(session.id)}
                          className="p-1.5 hover:bg-primary-700 rounded transition-colors"
                          title="Archive session"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-primary-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-primary-700 flex justify-end">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

