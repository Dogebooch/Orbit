import React, { useEffect, useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { Clock, AlertCircle, CheckCircle, Activity, Info, Target } from 'lucide-react';

interface SessionIndicatorProps {
  onManageClick?: () => void;
  className?: string;
}

export function SessionIndicator({ onManageClick, className = '' }: SessionIndicatorProps) {
  const { currentSession, sessionHealth } = useSession();
  const [duration, setDuration] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);

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
      <div className={`relative ${className}`}>
        <div 
          className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-purple-900/30 to-indigo-900/20 border border-purple-700/50 rounded-lg"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="p-1.5 bg-purple-500/20 rounded">
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-purple-300">No active session</p>
            <p className="text-[10px] text-purple-400/80">One session per feature keeps AI focused</p>
          </div>
          {onManageClick && (
            <button
              onClick={onManageClick}
              className="text-xs px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded transition-colors border border-purple-500/30"
            >
              Start Session
            </button>
          )}
        </div>
        
        {/* Tooltip with session guidance */}
        {showTooltip && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-primary-900 border border-primary-700 rounded-lg shadow-xl z-50">
            <div className="flex items-start gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-blue-300">Why start a session?</p>
            </div>
            <p className="text-xs text-primary-300 leading-relaxed">
              Sessions track your AI conversations to prevent <strong className="text-primary-200">context pollution</strong>. 
              When you start a new feature, start a new session to keep the AI focused on one thing at a time.
            </p>
          </div>
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

  const getHealthTooltip = () => {
    switch (sessionHealth.status) {
      case 'healthy':
        return {
          title: 'Session is Healthy',
          message: 'Your AI conversation context is clean and focused. Keep working on the current feature.',
          color: 'text-green-300',
        };
      case 'warning':
        return {
          title: 'Consider a New Session',
          message: 'Your session is getting long or has multiple tasks. Starting fresh prevents the AI from mixing contexts.',
          color: 'text-yellow-300',
        };
      case 'critical':
        return {
          title: 'Start a New Session',
          message: 'High risk of context pollution. The AI may confuse details from different features. Start a new session for better results.',
          color: 'text-red-300',
        };
      default:
        return {
          title: 'Session Status',
          message: 'Track your AI conversation to prevent context pollution.',
          color: 'text-primary-300',
        };
    }
  };

  const tooltip = getHealthTooltip();

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center gap-3 px-3 py-2 border rounded-lg transition-colors cursor-pointer ${getHealthColor()}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
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

      {/* Health Status Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-primary-900 border border-primary-700 rounded-lg shadow-xl z-50">
          <div className="flex items-start gap-2 mb-2">
            {getHealthIcon()}
            <p className={`text-xs font-medium ${tooltip.color}`}>{tooltip.title}</p>
          </div>
          <p className="text-xs text-primary-300 leading-relaxed mb-2">
            {tooltip.message}
          </p>
          {sessionHealth.reasons.length > 0 && (
            <ul className="text-xs text-primary-400 space-y-0.5 mb-2">
              {sessionHealth.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-primary-500">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          )}
          <div className="pt-2 border-t border-primary-700/50">
            <p className="text-[10px] text-purple-400 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Remember: One session per feature for best results
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

