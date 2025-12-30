import React from 'react';
import { Check, Circle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const PIPELINE_PHASES = [
  { id: 'setup', label: 'Setup' },
  { id: 'vision', label: 'Foundation' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'workbench', label: 'Build' },
  { id: 'testing', label: 'Test' },
] as const;

export function PipelineProgress() {
  const { currentStage, stageCompletion } = useApp();

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-primary-900/50 border-b border-primary-800">
      {PIPELINE_PHASES.map((phase, i) => {
        const isComplete = stageCompletion[phase.id as keyof typeof stageCompletion];
        const isCurrent = currentStage === phase.id;

        return (
          <React.Fragment key={phase.id}>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                isCurrent
                  ? 'bg-primary-700 text-primary-100'
                  : isComplete
                  ? 'text-green-400'
                  : 'text-primary-500'
              }`}
            >
              {isComplete ? (
                <Check className="w-3 h-3" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              {phase.label}
            </div>
            {i < PIPELINE_PHASES.length - 1 && (
              <div
                className={`w-4 h-0.5 ${
                  isComplete ? 'bg-green-600' : 'bg-primary-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

