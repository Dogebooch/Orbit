import React from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  Orbit,
  Lightbulb,
  Search,
  Code2,
  BookMarked,
  Rocket,
  Settings,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  onStageChange: (stage: string) => void;
}

export function Sidebar({ onStageChange }: SidebarProps) {
  const { currentStage, signOut } = useApp();

  const stages = [
    { id: 'vision', name: 'Foundation', icon: Lightbulb, description: 'Vision & User' },
    { id: 'research', name: 'Research', icon: Search, description: 'Market & Discovery' },
    { id: 'workbench', name: 'Workbench', icon: Code2, description: 'Build & Code' },
    { id: 'promptlibrary', name: 'Prompt Library', icon: BookMarked, description: 'Saved Prompts' },
    { id: 'testing', name: 'Testing', icon: Rocket, description: 'Ship & Deploy' },
  ];

  return (
    <aside className="w-64 bg-primary-900 border-r border-accent-800 flex flex-col h-screen">
      <div className="p-6 border-b border-accent-800">
        <div className="flex items-center gap-2">
          <Orbit className="w-6 h-6 text-primary-400" />
          <h1 className="text-xl font-bold text-primary-100">Orbit</h1>
        </div>
        <p className="text-sm text-primary-400 mt-1">Mission Control</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.id;

          return (
            <button
              key={stage.id}
              onClick={() => onStageChange(stage.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-800 text-primary-100 shadow-soft'
                  : 'text-primary-300 hover:bg-primary-800/50 hover:text-primary-100'
              }`}
            >
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">{stage.name}</div>
                <div className="text-xs text-primary-400">{stage.description}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-accent-800 space-y-2">
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
