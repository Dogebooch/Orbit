import React, { useState, useEffect } from 'react';
import { GitCommit, Copy, Check, X } from 'lucide-react';
import { generateCommitMessage } from '../../utils/commitMessage';

interface ToastProps {
  taskTitle: string;
  onDismiss: () => void;
  duration?: number;
}

/**
 * Simple toast notification for git commit reminder
 * Appears inline and auto-dismisses after a few seconds
 */
export function Toast({ taskTitle, onDismiss, duration = 4000 }: ToastProps) {
  const [copied, setCopied] = useState(false);

  const commitMessage = generateCommitMessage(taskTitle);

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(commitMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-down">
      <div className="bg-green-900/95 border border-green-500/50 rounded-lg shadow-lg backdrop-blur-sm p-3">
        <div className="flex gap-2 items-start">
          <div className="flex-shrink-0 mt-0.5">
            <GitCommit className="w-4 h-4 text-green-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-medium text-green-200">Task completed</p>
              <button
                onClick={onDismiss}
                className="text-green-400 hover:text-green-200 transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-1.5 items-center">
              <code className="flex-1 font-mono text-xs text-green-300 truncate bg-green-950/50 px-2 py-1 rounded">
                {commitMessage}
              </code>
              <button
                onClick={copyToClipboard}
                className="flex-shrink-0 p-1.5 text-green-300 hover:text-green-200 hover:bg-green-800/50 rounded transition-colors"
                title="Copy commit message"
                aria-label="Copy commit message"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

