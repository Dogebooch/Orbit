import React, { useState, useEffect } from 'react';
import { GitCommit, Copy, X, Check } from 'lucide-react';
import { Button } from './Button';

interface GitReminderProps {
  taskTitle: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

/**
 * Git commit reminder that appears after task completion
 * Provides a copy-able commit message based on the completed task
 */
export function GitReminder({ taskTitle, onDismiss, autoDismissMs = 10000 }: GitReminderProps) {
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(100);

  // Generate a conventional commit message from task title
  const generateCommitMessage = (title: string): string => {
    // Clean the task title
    const cleanTitle = title
      .replace(/^\[?\d+\.?\d*\]?\.?\s*/, '') // Remove task numbers like "1." or "[1.2]"
      .trim();

    // Determine commit type based on keywords
    let type = 'feat';
    const lowerTitle = cleanTitle.toLowerCase();
    
    if (lowerTitle.includes('fix') || lowerTitle.includes('bug')) {
      type = 'fix';
    } else if (lowerTitle.includes('refactor')) {
      type = 'refactor';
    } else if (lowerTitle.includes('test')) {
      type = 'test';
    } else if (lowerTitle.includes('doc') || lowerTitle.includes('readme')) {
      type = 'docs';
    } else if (lowerTitle.includes('style') || lowerTitle.includes('format')) {
      type = 'style';
    } else if (lowerTitle.includes('perf') || lowerTitle.includes('optim')) {
      type = 'perf';
    } else if (lowerTitle.includes('build') || lowerTitle.includes('ci') || lowerTitle.includes('deploy')) {
      type = 'ci';
    } else if (lowerTitle.includes('chore') || lowerTitle.includes('clean')) {
      type = 'chore';
    }

    // Format the title for commit message (lowercase, remove special chars)
    const formattedTitle = cleanTitle
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return `${type}: ${formattedTitle}`;
  };

  const commitMessage = generateCommitMessage(taskTitle);

  // Auto-dismiss with progress bar
  useEffect(() => {
    if (autoDismissMs <= 0) return;

    const interval = 100;
    const decrement = (interval / autoDismissMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [autoDismissMs, onDismiss]);

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
    <div className="fixed right-4 bottom-4 z-50 w-96 bg-gradient-to-r rounded-lg border shadow-lg backdrop-blur-sm from-green-900/90 to-emerald-900/90 border-green-500/50 animate-slide-up">
      {/* Progress bar */}
      <div className="overflow-hidden absolute top-0 right-0 left-0 h-1 bg-green-800 rounded-t-lg">
        <div
          className="h-full bg-green-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4">
        <div className="flex gap-3 justify-between items-start">
          <div className="flex gap-2 items-center">
            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-green-600/30">
              <GitCommit className="w-4 h-4 text-green-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-green-200">Task Completed!</h3>
              <p className="text-xs text-green-400">Don't forget to commit your changes</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-green-400 transition-colors hover:text-green-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3">
          <div className="flex gap-2 items-center p-2 rounded border bg-primary-900/50 border-green-700/50">
            <code className="flex-1 font-mono text-xs text-green-200 break-all">
              {commitMessage}
            </code>
            <Button
              variant="ghost"
              onClick={copyToClipboard}
              className="flex-shrink-0 p-1.5"
              title="Copy commit message"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-green-300" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <code className="text-[10px] text-green-500 font-mono">
            git commit -m "{commitMessage}"
          </code>
        </div>
      </div>
    </div>
  );
}

// Add keyframe animation to tailwind/CSS
// animate-slide-up: @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

