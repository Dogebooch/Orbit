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
  FolderCode,
  ArrowRight,
  ExternalLink,
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

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  command?: string;
  externalLink?: string;
  recommended?: boolean;
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
    id: 'starter_template',
    label: 'Starter template selected',
    description: 'Choose a template or use Bolt.new to scaffold your project',
    icon: FolderCode,
  },
];

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'bolt',
    name: 'Bolt.new',
    description: 'AI-powered scaffolding with live preview. Best for new projects.',
    externalLink: 'https://bolt.new',
    recommended: true,
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    description: 'Full-stack React framework with SSR and API routes',
    command: 'npx create-next-app@latest my-app --typescript --tailwind --eslint',
  },
  {
    id: 'vite-react',
    name: 'Vite + React',
    description: 'Fast, modern React setup with Vite bundler',
    command: 'npm create vite@latest my-app -- --template react-ts',
  },
  {
    id: 'vue',
    name: 'Vue 3',
    description: 'Progressive JavaScript framework with Vite',
    command: 'npm create vue@latest',
  },
];

export function SetupStage() {
  const { currentProject, user, setCurrentStage } = useApp();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    nodejs: false,
    claude_cli: false,
    api_key: false,
    starter_template: false,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
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
        const saved = data.value as { checkedItems: Record<string, boolean>; selectedTemplate: string | null };
        setCheckedItems(saved.checkedItems || {});
        setSelectedTemplate(saved.selectedTemplate || null);
      }
    } catch (err) {
      console.error('Error loading setup state:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveState = async (newChecked: Record<string, boolean>, newTemplate: string | null) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('key', 'setup_prerequisites')
        .maybeSingle();

      const value = { checkedItems: newChecked, selectedTemplate: newTemplate };

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
    saveState(newChecked, selectedTemplate);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const newChecked = { ...checkedItems, starter_template: true };
    setCheckedItems(newChecked);
    saveState(newChecked, templateId);
  };

  const copyCommand = async (command: string, templateId: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(templateId);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const allComplete = Object.values(checkedItems).every(Boolean);
  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  const handleContinue = () => {
    setCurrentStage('vision');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
          <Rocket className="w-8 h-8 text-primary-400" />
          Setup: Prerequisites
        </h1>
        <p className="text-primary-400 mt-2">
          Before you start building, make sure you have these essentials ready.
        </p>
      </div>

      {/* Critical Warning */}
      <div className="bg-red-900/30 border-2 border-red-600/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-300 mb-2">
              Don't Start from an Empty Codebase!
            </h3>
            <p className="text-red-200/80 text-sm mb-3">
              AI coding tools work best when you already have a scaffolded project with:
            </p>
            <ul className="text-sm text-red-200/70 space-y-1 ml-4">
              <li>• package.json with dependencies</li>
              <li>• Framework setup (Next.js, Vite, etc.)</li>
              <li>• TypeScript configuration</li>
              <li>• ESLint and TailwindCSS configured</li>
            </ul>
            <p className="text-red-200/80 text-sm mt-3">
              Use a CLI scaffolding tool or <strong className="text-red-300">Bolt.new</strong> to create your starter template first.
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-primary-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-green-500 transition-all duration-500"
            style={{ width: `${(completedCount / PREREQUISITES.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-primary-400 font-medium">
          {completedCount}/{PREREQUISITES.length} complete
        </span>
      </div>

      {/* Prerequisites Checklist */}
      <Card>
        <h2 className="text-xl font-semibold text-primary-100 mb-6">Prerequisites Checklist</h2>
        <div className="space-y-4">
          {PREREQUISITES.map((item) => {
            const Icon = item.icon;
            const isChecked = checkedItems[item.id];
            const isTemplateItem = item.id === 'starter_template';

            return (
              <div key={item.id}>
                <button
                  onClick={() => !isTemplateItem && toggleItem(item.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                    isChecked
                      ? 'bg-green-900/20 border-green-600/50'
                      : 'bg-primary-800/30 border-primary-700 hover:border-primary-600'
                  } ${isTemplateItem ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className={`mt-0.5 ${isChecked ? 'text-green-400' : 'text-primary-500'}`}>
                    {isChecked ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isChecked ? 'text-green-400' : 'text-primary-400'}`} />
                      <span className={`font-medium ${isChecked ? 'text-green-300' : 'text-primary-100'}`}>
                        {item.label}
                      </span>
                    </div>
                    <p className="text-sm text-primary-400 mt-1 ml-8">{item.description}</p>
                    {item.helpText && !isTemplateItem && (
                      <p className="text-xs text-primary-500 mt-2 ml-8">
                        {item.helpLink ? (
                          <a
                            href={item.helpLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300 underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.helpText}
                          </a>
                        ) : (
                          <code className="px-2 py-1 bg-primary-800 rounded">{item.helpText}</code>
                        )}
                      </p>
                    )}
                  </div>
                </button>

                {/* Template Selection (nested under starter_template) */}
                {isTemplateItem && (
                  <div className="ml-10 mt-4 space-y-3">
                    {TEMPLATE_OPTIONS.map((template) => (
                      <div
                        key={template.id}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedTemplate === template.id
                            ? 'bg-purple-900/30 border-purple-500/50'
                            : 'bg-primary-800/20 border-primary-700/50 hover:border-primary-600'
                        }`}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                selectedTemplate === template.id ? 'text-purple-300' : 'text-primary-100'
                              }`}>
                                {template.name}
                              </span>
                              {template.recommended && (
                                <span className="text-[10px] px-2 py-0.5 bg-purple-600/30 border border-purple-500/50 rounded-full text-purple-300">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-primary-400 mt-1">{template.description}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedTemplate === template.id
                              ? 'border-purple-400 bg-purple-500'
                              : 'border-primary-600'
                          }`}>
                            {selectedTemplate === template.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>

                        {/* Command or Link */}
                        {selectedTemplate === template.id && (
                          <div className="mt-3 pt-3 border-t border-primary-700/50">
                            {template.command ? (
                              <div className="flex items-center gap-2">
                                <code className="flex-1 px-3 py-2 bg-primary-900 rounded text-sm text-primary-300 font-mono">
                                  {template.command}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyCommand(template.command!, template.id);
                                  }}
                                >
                                  {copiedCommand === template.id ? 'Copied!' : 'Copy'}
                                </Button>
                              </div>
                            ) : template.externalLink ? (
                              <a
                                href={template.externalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open {template.name}
                              </a>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Continue Button */}
      <div className="flex items-center justify-between">
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
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

