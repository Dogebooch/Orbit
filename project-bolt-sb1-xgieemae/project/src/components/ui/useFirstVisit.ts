import { useState, useEffect } from 'react';

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

