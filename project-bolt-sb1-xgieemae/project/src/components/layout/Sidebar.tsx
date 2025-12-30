import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import {
  Orbit,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Code2,
  BookMarked,
  Rocket,
  RefreshCw,
  Settings,
  LogOut,
  CheckCircle2,
  Keyboard,
  Lock,
  Package,
} from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../../hooks/useKeyboardShortcuts';

interface SidebarProps {
  onStageChange: (stage: string) => void;
}

interface StageCompletion {
  setup: boolean;
  vision: boolean;
  strategy: boolean;
  workbench: boolean;
  promptlibrary: boolean;
  testing: boolean;
  maintenance: boolean;
}

export function Sidebar({ onStageChange }: SidebarProps) {
  const { currentStage, currentProject, user, signOut } = useApp();
  const [completion, setCompletion] = useState<StageCompletion>({
    setup: false,
    vision: false,
    strategy: false,
    workbench: false,
    promptlibrary: false,
    testing: false,
    maintenance: false,
  });
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Calculate stage completion
  useEffect(() => {
    if (!currentProject) {
      setCompletion({
        setup: false,
        vision: false,
        strategy: false,
        workbench: false,
        promptlibrary: false,
        testing: false,
        maintenance: false,
      });
      return;
    }

    const calculateCompletion = async () => {
      const newCompletion: StageCompletion = {
        setup: false,
        vision: false,
        strategy: false,
        workbench: false,
        promptlibrary: false,
        testing: false,
        maintenance: false,
      };

      // Check Setup completion (from settings)
      const { data: setupData } = await supabase
        .from('settings')
        .select('value')
        .eq('user_id', user?.id)
        .eq('key', 'setup_prerequisites')
        .maybeSingle();

      if (setupData?.value) {
        const checkedItems = (setupData.value as { checkedItems?: Record<string, boolean> }).checkedItems || {};
        newCompletion.setup = Object.values(checkedItems).every(Boolean);
      }

      // Check Vision completion
      const { data: visionData } = await supabase
        .from('visions')
        .select('problem, target_user')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('primary_user, goal')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      newCompletion.vision = !!(
        visionData?.problem && 
        visionData?.target_user && 
        profileData?.primary_user && 
        profileData?.goal
      );

      // Check Strategy (PRD exists with content)
      const { data: prdData } = await supabase
        .from('prds')
        .select('content')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      newCompletion.strategy = !!(prdData?.content && prdData.content.length > 100);

      // Check Workbench (has tasks)
      const { data: taskData } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('project_id', currentProject.id);

      newCompletion.workbench = (taskData?.length ?? 0) > 0;

      // Check Prompt Library (has saved prompts)
      const { data: promptData } = await supabase
        .from('prompts')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);

      newCompletion.promptlibrary = (promptData?.length ?? 0) > 0;

      // Check Testing (checklist progress)
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('user_id', user?.id)
        .eq('key', `testing_checklist_${currentProject.id}`)
        .maybeSingle();

      if (settingsData?.value) {
        const checks = Object.values(settingsData.value as Record<number, boolean>);
        const completed = checks.filter(Boolean).length;
        newCompletion.testing = completed >= 5;
      }

      // Check Maintenance (has reviews or feedback)
      const { data: reviewsData } = await supabase
        .from('maintenance_reviews')
        .select('id')
        .eq('project_id', currentProject.id)
        .limit(1);

      const { data: feedbackData } = await supabase
        .from('user_feedback')
        .select('id')
        .eq('project_id', currentProject.id)
        .limit(1);

      newCompletion.maintenance = (reviewsData?.length ?? 0) > 0 || (feedbackData?.length ?? 0) > 0;

      setCompletion(newCompletion);
    };

    calculateCompletion();
  }, [currentProject, user]);

  const stages = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, description: 'Project Overview', shortcut: '0', noCompletion: true },
    { id: 'setup', name: 'Setup', icon: Package, description: 'Prerequisites', shortcut: '1' },
    { id: 'vision', name: 'Foundation', icon: Lightbulb, description: 'Vision & User', shortcut: '2' },
    { id: 'strategy', name: 'Strategy', icon: ListChecks, description: 'PRD & Launch', shortcut: '3' },
    { id: 'workbench', name: 'Workbench', icon: Code2, description: 'Build & Code', shortcut: '4', requiresPRD: true },
    { id: 'promptlibrary', name: 'Prompt Library', icon: BookMarked, description: 'Saved Prompts', shortcut: '5' },
    { id: 'testing', name: 'Testing', icon: Rocket, description: 'Ship & Deploy', shortcut: '6' },
    { id: 'maintenance', name: 'Maintenance', icon: RefreshCw, description: 'Reviews & Feedback', shortcut: '7' },
  ];

  const completedCount = Object.values(completion).filter(Boolean).length;
  const totalCount = Object.keys(completion).length;

  return (
    <aside className="w-64 bg-primary-900 border-r border-accent-800 flex flex-col h-screen">
      <div className="p-6 border-b border-accent-800">
        <div className="flex items-center gap-2">
          <Orbit className="w-6 h-6 text-primary-400" />
          <h1 className="text-xl font-bold text-primary-100">Orbit</h1>
        </div>
        <p className="text-sm text-primary-400 mt-1">Mission Control</p>
        
        {/* Overall Progress */}
        {currentProject && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-primary-500">Progress</span>
              <span className="text-primary-400">{completedCount}/{totalCount}</span>
            </div>
            <div className="h-1.5 bg-primary-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.id;
          const isComplete = !('noCompletion' in stage) && completion[stage.id as keyof StageCompletion];
          
          // Check if this stage requires PRD and if PRD is complete
          const requiresPRD = 'requiresPRD' in stage && stage.requiresPRD;
          const prdComplete = completion.strategy;
          const isLocked = requiresPRD && !prdComplete;

          return (
            <button
              key={stage.id}
              onClick={() => {
                if (!isLocked) {
                  onStageChange(stage.id);
                }
              }}
              disabled={isLocked}
              title={isLocked ? 'Complete the PRD in Strategy stage to unlock' : undefined}
              className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200 group ${
                isLocked
                  ? 'text-primary-600 cursor-not-allowed opacity-60'
                  : isActive
                  ? 'bg-primary-800 text-primary-100 shadow-soft'
                  : 'text-primary-300 hover:bg-primary-800/50 hover:text-primary-100'
              }`}
            >
              <div className="relative">
                {isLocked ? (
                  <Lock className="w-5 h-5 mt-0.5 text-amber-600" />
                ) : isComplete ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5 text-green-400" />
                ) : (
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stage.name}</span>
                  {isLocked ? (
                    <span className="text-[10px] text-amber-600">Needs PRD</span>
                  ) : (
                    <kbd className="hidden group-hover:inline-block px-1.5 py-0.5 text-[10px] bg-primary-700 text-primary-400 rounded">
                      Ctrl+{stage.shortcut}
                    </kbd>
                  )}
                </div>
                <div className="text-xs text-primary-400">{stage.description}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-accent-800 space-y-2">
        {/* Keyboard Shortcuts Toggle */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-primary-300 hover:bg-primary-800/50 hover:text-primary-100 transition-all duration-200"
        >
          <Keyboard className="w-5 h-5" />
          <span className="font-medium">Shortcuts</span>
        </button>

        {showShortcuts && (
          <div className="p-3 bg-primary-800/50 rounded-lg space-y-2 text-xs animate-fade-in">
            {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-primary-400">{shortcut.description}</span>
                <kbd className="px-1.5 py-0.5 bg-primary-700 text-primary-300 rounded text-[10px]">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onStageChange('settings')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
            currentStage === 'settings'
              ? 'bg-primary-800 text-primary-100'
              : 'text-primary-300 hover:bg-primary-800/50 hover:text-primary-100'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-primary-300 hover:bg-red-900/20 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
