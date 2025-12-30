import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ChevronDown, ChevronRight, Info, AlertTriangle, CheckCircle, Sparkles, BookOpen } from 'lucide-react';
import { 
  STAGE_TIPS, 
  getTipsForStage, 
  getDismissedTips, 
  dismissTip,
  type TipConfig
} from '../../config/tipsConfig';

interface TipsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage?: string;
}

const STAGE_LABELS: Record<string, string> = {
  vision: 'Foundation / Vision',
  strategy: 'Strategy',
  workbench: 'Workbench',
  testing: 'Testing',
  settings: 'Settings',
  prompts: 'Prompt Library',
};

const VARIANT_ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  'pro-tip': Sparkles,
};

const VARIANT_COLORS = {
  info: 'text-blue-400',
  warning: 'text-yellow-400',
  success: 'text-green-400',
  'pro-tip': 'text-purple-400',
};

export function TipsPanel({ isOpen, onClose, currentStage }: TipsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);

  // Initialize expanded stages - expand current stage by default
  useEffect(() => {
    if (isOpen) {
      const initialExpanded = new Set<string>();
      if (currentStage) {
        initialExpanded.add(currentStage);
      } else {
        // Expand first stage if no current stage
        const stages = Array.from(new Set(STAGE_TIPS.map(tip => tip.stage)));
        if (stages.length > 0) {
          initialExpanded.add(stages[0]);
        }
      }
      setExpandedStages(initialExpanded);
    }
  }, [isOpen, currentStage]);

  // Load dismissed tips
  useEffect(() => {
    if (isOpen) {
      setDismissedTips(getDismissedTips());
    }
  }, [isOpen]);

  // Get all unique stages
  const stages = useMemo(() => {
    return Array.from(new Set(STAGE_TIPS.map(tip => tip.stage))).sort();
  }, []);

  // Filter tips by search query and group by stage
  const filteredTipsByStage = useMemo(() => {
    const dismissedSet = new Set(dismissedTips);
    const grouped: Record<string, TipConfig[]> = {};

    STAGE_TIPS.forEach(tip => {
      if (dismissedSet.has(tip.id)) return;

      const matchesSearch = 
        !searchQuery ||
        tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.content.toLowerCase().includes(searchQuery.toLowerCase());

      if (matchesSearch) {
        if (!grouped[tip.stage]) {
          grouped[tip.stage] = [];
        }
        grouped[tip.stage].push(tip);
      }
    });

    return grouped;
  }, [searchQuery, dismissedTips]);

  const toggleStage = (stage: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedStages(newExpanded);
  };

  const handleDismiss = (tipId: string) => {
    dismissTip(tipId);
    setDismissedTips([...dismissedTips, tipId]);
  };

  const handleOpenGuide = async () => {
    // Check if we're in Electron
    if (typeof window !== 'undefined' && (window as any).electronAPI?.openLocalFile) {
      try {
        const result = await (window as any).electronAPI.openLocalFile('guides/DougHub_Project_Setup_Guide_Complete.md');
        if (!result.success) {
          console.error('Failed to open guide:', result.error);
          // Fallback: try to open in browser if Electron fails
          alert(`Could not open guide file: ${result.error}`);
        }
      } catch (error) {
        console.error('Error opening guide:', error);
        alert('Failed to open guide file. Please check if the file exists.');
      }
    } else {
      // Not in Electron, show a message or try to open via file:// URL
      alert('This feature requires the Electron app. The guide is located at: guides/DougHub_Project_Setup_Guide_Complete.md');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-primary-900 border-l border-primary-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-primary-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-100">Tips & Guidance</h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-primary-800 text-primary-400 hover:text-primary-100 transition-colors"
              aria-label="Close tips panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-500" />
            <input
              type="text"
              placeholder="Search tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-primary-800 border border-primary-700 rounded-lg text-primary-100 placeholder-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {/* Guide Link */}
          <button
            onClick={handleOpenGuide}
            className="w-full mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-800/50 border border-primary-700/50 hover:bg-primary-800 hover:border-primary-600 text-primary-300 hover:text-primary-100 transition-colors text-sm"
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span className="text-left flex-1">View Project Setup Guide</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {stages.length === 0 ? (
            <div className="text-center py-8 text-primary-400">
              <p>No tips available</p>
            </div>
          ) : (
            stages.map((stage) => {
              const tips = filteredTipsByStage[stage] || [];
              if (tips.length === 0) return null;

              const isExpanded = expandedStages.has(stage);
              const isCurrentStage = stage === currentStage;
              const Icon = isExpanded ? ChevronDown : ChevronRight;

              return (
                <div
                  key={stage}
                  className={`border border-primary-800 rounded-lg overflow-hidden ${
                    isCurrentStage ? 'ring-1 ring-primary-600' : ''
                  }`}
                >
                  {/* Stage Header */}
                  <button
                    onClick={() => toggleStage(stage)}
                    className={`w-full flex items-center justify-between p-3 text-left hover:bg-primary-800/50 transition-colors ${
                      isCurrentStage ? 'bg-primary-800/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary-400" />
                      <span className="font-medium text-primary-100">
                        {STAGE_LABELS[stage] || stage}
                      </span>
                      {isCurrentStage && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary-700 text-primary-300">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-primary-500">{tips.length}</span>
                  </button>

                  {/* Tips List */}
                  {isExpanded && (
                    <div className="border-t border-primary-800">
                      {tips.map((tip) => {
                        const VariantIcon = VARIANT_ICONS[tip.variant];
                        const variantColor = VARIANT_COLORS[tip.variant];

                        return (
                          <div
                            key={tip.id}
                            className="p-3 border-b border-primary-800/50 last:border-b-0 hover:bg-primary-800/30 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <VariantIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${variantColor}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-medium text-primary-100 mb-1">
                                    {tip.title}
                                  </h4>
                                  {tip.dismissible && (
                                    <button
                                      onClick={() => handleDismiss(tip.id)}
                                      className="flex-shrink-0 p-1 rounded hover:bg-primary-700 text-primary-500 hover:text-primary-300 transition-colors"
                                      aria-label="Dismiss tip"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-primary-400 leading-relaxed">
                                  {tip.content}
                                </p>
                                {tip.learnMoreUrl && (
                                  <a
                                    href={tip.learnMoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs mt-2 text-primary-500 hover:text-primary-400 transition-colors"
                                  >
                                    Learn more
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {Object.keys(filteredTipsByStage).length === 0 && searchQuery && (
            <div className="text-center py-8 text-primary-400">
              <p>No tips match your search</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

