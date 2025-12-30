import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../ui';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Terminal,
  Key,
  ArrowRight,
  Rocket,
  Package,
} from 'lucide-react';

interface PrerequisiteItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  helpLink?: string;
  helpText?: string;
}

const PREREQUISITES: PrerequisiteItem[] = [
  {
    id: 'nodejs',
    label: 'Node.js 18+ installed',
    description: 'Required for Claude Code CLI and most JavaScript tooling',
    icon: Package,
    helpLink: 'https://nodejs.org/',
    helpText: 'Download from nodejs.org or use nvm',
  },
  {
    id: 'claude_cli',
    label: 'Claude Code CLI installed',
    description: 'npm install -g @anthropic-ai/claude-code',
    icon: Terminal,
    helpText: 'Run: npm install -g @anthropic-ai/claude-code',
  },
  {
    id: 'api_key',
    label: 'Anthropic API key / Claude subscription ready',
    description: 'Required to authenticate with Claude Code',
    icon: Key,
    helpLink: 'https://console.anthropic.com/',
    helpText: 'Get your API key from console.anthropic.com',
  },
  {
    id: 'scaffolded_project',
    label: 'Project scaffolded with Bolt.new or CLI',
    description: 'You need a working codebase before using AI tools',
    icon: Rocket,
    helpLink: 'https://bolt.new',
    helpText: 'Open Bolt.new to create your starter project',
  },
];

export function SetupStage() {
  const { currentProject, user, setCurrentStage } = useApp();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    nodejs: false,
    claude_cli: false,
    api_key: false,
    scaffolded_project: false,
  });
  const [loading, setLoading] = useState(true);

  // Load saved state
  useEffect(() => {
    loadSavedState();
  }, [currentProject, user]);

  const loadSavedState = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('user_id', user.id)
        .eq('key', 'setup_prerequisites')
        .maybeSingle();

      if (data?.value) {
        const saved = data.value as { checkedItems: Record<string, boolean> };
        setCheckedItems(saved.checkedItems || {});
      }
    } catch (err) {
      console.error('Error loading setup state:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveState = async (newChecked: Record<string, boolean>) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('key', 'setup_prerequisites')
        .maybeSingle();

      const value = { checkedItems: newChecked };

      if (existing) {
        await supabase
          .from('settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('settings').insert({
          user_id: user.id,
          key: 'setup_prerequisites',
          value,
        });
      }
    } catch (err) {
      console.error('Error saving setup state:', err);
    }
  };

  const toggleItem = (id: string) => {
    const newChecked = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(newChecked);
    saveState(newChecked);
  };

  const allComplete = Object.values(checkedItems).every(Boolean);
  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  const handleContinue = () => {
    setCurrentStage('vision');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-b-2 animate-spin border-primary-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 max-w-4xl">
      <div>
        <h1 className="flex gap-3 items-center text-3xl font-bold text-primary-100">
          <Rocket className="w-8 h-8 text-primary-400" />
          Setup: Prerequisites
        </h1>
        <p className="mt-2 text-primary-400">
          Before you start building, make sure you have these essentials ready.
        </p>
      </div>

      {/* Critical Warning */}
      <div className="p-6 rounded-xl border-2 bg-red-900/30 border-red-600/50">
        <div className="flex gap-4 items-start">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="mb-2 text-lg font-semibold text-red-300">
              Don't Start from an Empty Codebase!
            </h3>
            <p className="mb-3 text-sm text-red-200/80">
              AI coding tools work best when you already have a scaffolded project with:
            </p>
            <ul className="ml-4 space-y-1 text-sm text-red-200/70">
              <li>• package.json with dependencies</li>
              <li>• Framework setup (Next.js, Vite, etc.)</li>
              <li>• TypeScript configuration</li>
              <li>• ESLint and TailwindCSS configured</li>
            </ul>
            <p className="mt-3 text-sm text-red-200/80">
              Use a CLI scaffolding tool or <strong className="text-red-300">Bolt.new</strong> to create your starter template first.
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-4 items-center">
        <div className="overflow-hidden flex-1 h-2 rounded-full bg-primary-800">
          <div
            className="h-full bg-gradient-to-r to-green-500 transition-all duration-500 from-primary-500"
            style={{ width: `${(completedCount / PREREQUISITES.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-primary-400">
          {completedCount}/{PREREQUISITES.length} complete
        </span>
      </div>

      {/* Prerequisites Checklist */}
      <Card>
        <h2 className="mb-6 text-xl font-semibold text-primary-100">Prerequisites Checklist</h2>
        <div className="space-y-4">
          {PREREQUISITES.map((item) => {
            const Icon = item.icon;
            const isChecked = checkedItems[item.id];

            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-green-900/20 border-green-600/50'
                    : 'bg-primary-800/30 border-primary-700 hover:border-primary-600'
                }`}
              >
                <div className={`mt-0.5 ${isChecked ? 'text-green-400' : 'text-primary-500'}`}>
                  {isChecked ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex gap-3 items-center">
                    <Icon className={`w-5 h-5 ${isChecked ? 'text-green-400' : 'text-primary-400'}`} />
                    <span className={`font-medium ${isChecked ? 'text-green-300' : 'text-primary-100'}`}>
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-1 ml-8 text-sm text-primary-400">{item.description}</p>
                  {item.helpText && (
                    <p className="mt-2 ml-8 text-xs text-primary-500">
                      {item.helpLink ? (
                        <a
                          href={item.helpLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-primary-400 hover:text-primary-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.helpText}
                        </a>
                      ) : (
                        <code className="px-2 py-1 rounded bg-primary-800">{item.helpText}</code>
                      )}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-between items-center">
        <div>
          {!allComplete && (
            <p className="text-sm text-amber-400">
              Complete all prerequisites to continue (or skip if you know what you're doing)
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {!allComplete && (
            <Button variant="ghost" onClick={handleContinue}>
              Skip for now
            </Button>
          )}
          <Button onClick={handleContinue} disabled={false}>
            {allComplete ? 'Continue to Foundation' : 'Continue Anyway'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

