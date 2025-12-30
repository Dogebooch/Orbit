import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import {
  X,
  Target,
  AlertOctagon,
  Zap,
  Brain,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

const STORAGE_KEY = 'orbit_session_onboarding_seen';

interface SessionOnboardingProps {
  onStartSession: () => void;
}

export function SessionOnboarding({ onStartSession }: SessionOnboardingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  const handleStartSession = () => {
    handleDismiss();
    onStartSession();
  };

  if (!isVisible) return null;

  const steps = [
    {
      icon: Brain,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      title: 'AI Models Have Memory Limits',
      content: (
        <>
          <p className="text-sm text-primary-300 leading-relaxed">
            When you chat with Claude or other AI assistants, they remember your entire conversation. 
            As conversations grow longer, the AI can start <strong className="text-primary-100">mixing contexts</strong> — 
            applying decisions from one feature to another, or forgetting constraints you established earlier.
          </p>
          <p className="text-sm text-primary-400 mt-3">
            This is called <span className="text-orange-300 font-medium">context pollution</span>, and it leads 
            to inconsistent code and subtle bugs that are hard to track down.
          </p>
        </>
      ),
    },
    {
      icon: Target,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      title: 'The Golden Rule: One Session Per Feature',
      content: (
        <>
          <div className="p-4 bg-blue-900/30 rounded-lg border-2 border-blue-500/50 mb-4">
            <p className="text-sm text-blue-200 font-medium text-center">
              "Start new chat sessions for new features to avoid context overload"
            </p>
            <p className="text-xs text-blue-400 text-center mt-1">
              — Vibe Coding Guide
            </p>
          </div>
          <p className="text-sm text-primary-300 leading-relaxed">
            Each major feature should have its own AI conversation session. This keeps the AI 
            focused on one thing at a time and prevents it from confusing details between unrelated features.
          </p>
        </>
      ),
    },
    {
      icon: Zap,
      iconColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      title: 'When to Start a New Session',
      content: (
        <ul className="space-y-3">
          <li className="flex items-start gap-3 p-2 bg-primary-800/30 rounded-lg">
            <div className="p-1.5 bg-green-500/20 rounded">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-200">Starting a new feature</p>
              <p className="text-xs text-primary-400">Different from what you're currently working on</p>
            </div>
          </li>
          <li className="flex items-start gap-3 p-2 bg-primary-800/30 rounded-lg">
            <div className="p-1.5 bg-green-500/20 rounded">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-200">Session has 3+ tasks</p>
              <p className="text-xs text-primary-400">Context is getting crowded</p>
            </div>
          </li>
          <li className="flex items-start gap-3 p-2 bg-primary-800/30 rounded-lg">
            <div className="p-1.5 bg-green-500/20 rounded">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-200">Session is 2+ hours old</p>
              <p className="text-xs text-primary-400">Conversation has grown too long</p>
            </div>
          </li>
          <li className="flex items-start gap-3 p-2 bg-primary-800/30 rounded-lg">
            <div className="p-1.5 bg-green-500/20 rounded">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-200">Switching to unrelated work</p>
              <p className="text-xs text-primary-400">Bug fixes, refactoring, or different tasks</p>
            </div>
          </li>
        </ul>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-primary-900 border border-primary-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary-700 bg-gradient-to-r from-purple-900/30 to-indigo-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary-100">AI Session Management</h2>
              <p className="text-xs text-primary-400">Prevent context pollution for better AI results</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-primary-800 rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-5 h-5 text-primary-400" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 px-4 pt-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                idx <= currentStep ? 'bg-purple-500' : 'bg-primary-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 ${currentStepData.bgColor} rounded-lg`}>
              <StepIcon className={`w-6 h-6 ${currentStepData.iconColor}`} />
            </div>
            <h3 className="text-xl font-semibold text-primary-100">{currentStepData.title}</h3>
          </div>
          <div className="min-h-[200px]">
            {currentStepData.content}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-primary-700 bg-primary-800/30">
          <button
            onClick={handleDismiss}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Skip intro
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-sm"
              >
                Back
              </Button>
            )}
            {isLastStep ? (
              <Button onClick={handleStartSession} className="text-sm">
                <Target className="w-4 h-4 mr-2" />
                Start My First Session
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep(currentStep + 1)} className="text-sm">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reset the onboarding state (for testing or user preference)
 */
export function resetSessionOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY);
}

