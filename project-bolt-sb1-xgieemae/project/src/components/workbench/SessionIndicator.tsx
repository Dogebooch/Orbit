import React, { useEffect, useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { Clock, AlertCircle, CheckCircle, Activity } from 'lucide-react';

interface SessionIndicatorProps {
  onManageClick?: () => void;
  className?: string;
}

export function SessionIndicator({ onManageClick, className = '' }: SessionIndicatorProps) {
  const { currentSession, sessionHealth } = useSession();
  const [duration, setDuration] = useState<string>('');

  // Update duration display every minute
  useEffect(() => {
    if (!currentSession) return;

    const updateDuration = () => {
      const startedAt = new Date(currentSession.started_at).getTime();
      const now = Date.now();
      const durationMs = now - startedAt;

      const hours = Math.floor(durationMs / (60 * 60 * 1000));
      const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));

      if (hours > 0) {
        setDuration(`${hours}h ${minutes}m`);
      } else {
        setDuration(`${minutes}m`);
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentSession]);

  if (!currentSession) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-primary-800/40 border border-primary-700 rounded-lg ${className}`}>
        <Activity className="w-4 h-4 text-primary-500" />
        <div className="flex-1">
          <p className="text-xs text-primary-400">No active session</p>
        </div>
        {onManageClick && (
          <button
            onClick={onManageClick}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Start Session
          </button>
        )}
      </div>
    );
  }

  const getHealthIcon = () => {
    switch (sessionHealth.status) {
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

  const getHealthColor = () => {
    switch (sessionHealth.status) {
      case 'healthy':
        return 'border-green-700/50 bg-green-900/20';
      case 'warning':
        return 'border-yellow-700/50 bg-yellow-900/20';
      case 'critical':
        return 'border-red-700/50 bg-red-900/20';
      default:
        return 'border-primary-700 bg-primary-800/40';
    }
  };

  const getHealthTextColor = () => {
    switch (sessionHealth.status) {
      case 'healthy':
        return 'text-green-300';
      case 'warning':
        return 'text-yellow-300';
      case 'critical':
        return 'text-red-300';
      default:
        return 'text-primary-300';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 border rounded-lg transition-colors ${getHealthColor()} ${className}`}
    >
      {getHealthIcon()}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium ${getHealthTextColor()} truncate`}>
            {currentSession.session_name}
          </p>
          {sessionHealth.status !== 'healthy' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-900/50 text-primary-400 uppercase">
              {sessionHealth.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-primary-400 mt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </span>
          <span>
            {currentSession.task_ids.length} task{currentSession.task_ids.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {onManageClick && (
        <button
          onClick={onManageClick}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
        >
          Manage
        </button>
      )}
    </div>
  );
}

