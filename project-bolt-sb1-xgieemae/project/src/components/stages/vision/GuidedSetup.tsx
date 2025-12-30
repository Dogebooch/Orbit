import React, { useState, useMemo } from 'react';
import { Button } from '../../ui';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Lightbulb, Users, Target, MessageSquare } from 'lucide-react';
import { GUIDED_STEPS, PHASES, type StepConfig } from './guidedSetupConfig';
import { StepCard, AIChallengeStep } from './StepCard';

interface VisionData {
  problem: string;
  target_user: string;
  success_metrics: string;
  why_software: string;
  target_level: string;
  ai_challenge_response: string;
}

interface UserProfileData {
  primary_user: string;
  goal: string;
  context: string;
  frustrations: string;
  technical_comfort: string;
  time_constraints: string;
  persona_name: string;
  persona_role: string;
}

interface GuidedSetupProps {
  vision: VisionData;
  userProfile: UserProfileData;
  onVisionChange: (vision: VisionData) => void;
  onUserProfileChange: (profile: UserProfileData) => void;
  onComplete: () => void;
}

const phaseIcons: Record<string, React.ElementType> = {
  vision: Lightbulb,
  user: Users,
  metrics: Target,
  challenge: MessageSquare,
};

export function GuidedSetup({
  vision,
  userProfile,
  onVisionChange,
  onUserProfileChange,
  onComplete,
}: GuidedSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const step = GUIDED_STEPS[currentStep];

  const getValue = (s: StepConfig): string | Record<string, string> => {
    if (s.inputType === 'multi-field' && s.id === 'persona') {
      return {
        persona_name: userProfile.persona_name || '',
        persona_role: userProfile.persona_role || '',
        primary_user: userProfile.primary_user || '',
      };
    }
    if (s.dataType === 'vision') {
      return (vision as Record<string, string>)[s.field] || '';
    }
    return (userProfile as Record<string, string>)[s.field] || '';
  };

  const setValue = (s: StepConfig, value: string | Record<string, string>) => {
    if (s.inputType === 'multi-field' && s.id === 'persona' && typeof value === 'object') {
      onUserProfileChange({
        ...userProfile,
        persona_name: value.persona_name || '',
        persona_role: value.persona_role || '',
        primary_user: value.primary_user || '',
      });
      return;
    }
    if (s.dataType === 'vision' && typeof value === 'string') {
      onVisionChange({ ...vision, [s.field]: value });
    } else if (typeof value === 'string') {
      onUserProfileChange({ ...userProfile, [s.field]: value });
    }
  };

  const isStepComplete = (s: StepConfig): boolean => {
    const val = getValue(s);
    if (typeof val === 'object') {
      return Object.values(val).some(v => v && v.length > 0);
    }
    return val && val.length > 0;
  };

  const canGoNext = () => {
    if (!step.required) return true;
    return isStepComplete(step);
  };

  const handleNext = () => {
    if (!canGoNext()) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    if (currentStep < GUIDED_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    setShowValidation(false);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentPhase = step.phase;
  const PhaseIcon = phaseIcons[currentPhase] || Lightbulb;

  const phaseProgress = useMemo(() => {
    const results: Record<string, { completed: number; total: number }> = {};
    PHASES.forEach(phase => {
      const phaseSteps = GUIDED_STEPS.filter(s => s.phase === phase.id);
      const completed = phaseSteps.filter(s => isStepComplete(s)).length;
      results[phase.id] = { completed, total: phaseSteps.length };
    });
    return results;
  }, [vision, userProfile]);

  const totalProgress = useMemo(() => {
    const completed = GUIDED_STEPS.filter(s => isStepComplete(s)).length;
    return Math.round((completed / GUIDED_STEPS.length) * 100);
  }, [vision, userProfile]);

  const visionSummary = useMemo(() => {
    const parts: string[] = [];
    if (vision.problem) parts.push(`**Problem:** ${vision.problem}`);
    if (vision.target_user) parts.push(`**Target User:** ${vision.target_user}`);
    if (userProfile.primary_user) parts.push(`**Primary User Persona:** ${userProfile.persona_name || ''} - ${userProfile.primary_user}`);
    if (userProfile.goal) parts.push(`**User Goal:** ${userProfile.goal}`);
    if (vision.why_software) parts.push(`**Why Software:** ${vision.why_software}`);
    if (vision.success_metrics) parts.push(`**Success Metrics:** ${vision.success_metrics}`);
    return parts.join('\n\n');
  }, [vision, userProfile]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-primary-300">
            Step {currentStep + 1} of {GUIDED_STEPS.length}
          </span>
          <span className="text-sm font-medium text-primary-300">
            {totalProgress}% Complete
          </span>
        </div>
        <div className="w-full bg-primary-800 rounded-full h-2 mb-6">
          <div
            className="bg-gradient-to-r from-primary-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-3">
          {PHASES.map((phase) => {
            const Icon = phaseIcons[phase.id] || Lightbulb;
            const progress = phaseProgress[phase.id];
            const isCurrentPhase = phase.id === currentPhase;
            const isComplete = progress.completed === progress.total && progress.total > 0;

            return (
              <div
                key={phase.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isCurrentPhase
                    ? 'border-primary-400 bg-primary-800/80'
                    : isComplete
                    ? 'border-green-600/50 bg-green-900/20'
                    : 'border-primary-700/50 bg-primary-800/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${
                    isCurrentPhase ? 'text-primary-400' : isComplete ? 'text-green-400' : 'text-primary-500'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isCurrentPhase ? 'text-primary-200' : isComplete ? 'text-green-300' : 'text-primary-400'
                  }`}>
                    {phase.title}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1 bg-primary-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isComplete ? 'bg-green-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-primary-500 ml-1">
                    {progress.completed}/{progress.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {GUIDED_STEPS.map((s, i) => {
          const complete = isStepComplete(s);
          const current = i === currentStep;
          const samePhase = s.phase === currentPhase;

          return (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={`flex-shrink-0 w-10 h-10 rounded-lg transition-all flex items-center justify-center ${
                current
                  ? 'bg-primary-600 ring-2 ring-primary-400 ring-offset-2 ring-offset-primary-900'
                  : complete
                  ? 'bg-green-800/50 hover:bg-green-800/70'
                  : samePhase
                  ? 'bg-primary-700 hover:bg-primary-600'
                  : 'bg-primary-800/50 hover:bg-primary-700'
              }`}
              title={s.title}
            >
              {complete ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <Circle className={`w-5 h-5 ${current ? 'text-primary-200' : 'text-primary-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-primary-900/80 rounded-2xl p-8 border border-primary-700/50 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${
            currentPhase === 'vision' ? 'bg-amber-900/50' :
            currentPhase === 'user' ? 'bg-blue-900/50' :
            currentPhase === 'metrics' ? 'bg-green-900/50' :
            'bg-purple-900/50'
          }`}>
            <PhaseIcon className={`w-5 h-5 ${
              currentPhase === 'vision' ? 'text-amber-400' :
              currentPhase === 'user' ? 'text-blue-400' :
              currentPhase === 'metrics' ? 'text-green-400' :
              'text-purple-400'
            }`} />
          </div>
          <span className="text-sm font-medium text-primary-400">{step.phaseTitle}</span>
          {step.required && (
            <span className="px-2 py-0.5 text-xs bg-amber-900/50 text-amber-300 rounded-full">
              Required
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold text-primary-100 mb-2">{step.title}</h2>
        <p className="text-primary-400 mb-6">{step.description}</p>

        {step.id === 'ai_challenge' ? (
          <AIChallengeStep
            visionSummary={visionSummary}
            value={typeof getValue(step) === 'string' ? getValue(step) as string : ''}
            onChange={(value) => setValue(step, value)}
          />
        ) : (
          <StepCard
            step={step}
            value={getValue(step)}
            onChange={(value) => setValue(step, value)}
            showValidation={showValidation}
          />
        )}
      </div>

      <div className="flex justify-between items-center">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="ghost"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="text-sm text-primary-400">
          {showValidation && step.required && !canGoNext() && (
            <span className="text-amber-400">Please complete this required field</span>
          )}
        </div>

        <Button onClick={handleNext}>
          {currentStep === GUIDED_STEPS.length - 1 ? 'Complete Setup' : 'Next'}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
