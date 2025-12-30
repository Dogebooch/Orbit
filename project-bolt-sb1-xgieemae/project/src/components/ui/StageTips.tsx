import React, { useState, useEffect } from 'react';
import { TipCard } from './TipCard';
import { 
  getTipsForStage, 
  getDismissedTips, 
  dismissTip,
  type TipConfig,
  type TipTrigger 
} from '../../config/tipsConfig';

interface StageTipsProps {
  stage: string;
  /** Override automatic trigger detection */
  triggers?: TipTrigger[];
  /** Is the current stage data complete? */
  isComplete?: boolean;
  /** Is this the user's first visit to this stage? */
  isFirstVisit?: boolean;
  /** Is the backend connected? (for workbench) */
  isBackendConnected?: boolean;
  /** Maximum number of tips to show */
  maxTips?: number;
  /** Custom class for the container */
  className?: string;
}

/**
 * Displays contextual tips based on the current stage and state.
 * Automatically filters tips based on triggers and dismissal state.
 */
export function StageTips({
  stage,
  triggers,
  isComplete = false,
  isFirstVisit = false,
  isBackendConnected = true,
  maxTips = 2,
  className = '',
}: StageTipsProps) {
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [visibleTips, setVisibleTips] = useState<TipConfig[]>([]);

  useEffect(() => {
    // Load dismissed tips from localStorage
    setDismissedTips(getDismissedTips());
  }, []);

  useEffect(() => {
    // Determine which triggers to apply
    let activeTriggers: TipTrigger[] = triggers || [];
    
    if (!triggers) {
      // Auto-detect triggers based on state
      activeTriggers = ['always'];
      
      if (isFirstVisit) {
        activeTriggers.push('first-visit');
      }
      
      if (isComplete) {
        activeTriggers.push('complete');
      } else {
        activeTriggers.push('incomplete');
      }
      
      if (!isBackendConnected) {
        activeTriggers.push('backend-disconnected');
      }
    }

    // Get tips for this stage with the active triggers
    const tips = getTipsForStage(stage, {
      triggers: activeTriggers,
      excludeIds: dismissedTips,
    });

    // Limit the number of visible tips
    setVisibleTips(tips.slice(0, maxTips));
  }, [stage, triggers, isComplete, isFirstVisit, isBackendConnected, maxTips, dismissedTips]);

  const handleDismiss = (tipId: string) => {
    dismissTip(tipId);
    setDismissedTips([...dismissedTips, tipId]);
  };

  if (visibleTips.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleTips.map((tip) => (
        <TipCard
          key={tip.id}
          title={tip.title}
          content={tip.content}
          variant={tip.variant}
          dismissible={tip.dismissible ?? true}
          learnMoreUrl={tip.learnMoreUrl}
          onDismiss={() => handleDismiss(tip.id)}
        />
      ))}
    </div>
  );
}

/**
 * Hook to check if this is the first visit to a stage
 */
export function useFirstVisit(stage: string): boolean {
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const visitedKey = `orbit_visited_${stage}`;
    const hasVisited = localStorage.getItem(visitedKey);
    
    if (!hasVisited) {
      setIsFirstVisit(true);
      localStorage.setItem(visitedKey, 'true');
    }
  }, [stage]);

  return isFirstVisit;
}

