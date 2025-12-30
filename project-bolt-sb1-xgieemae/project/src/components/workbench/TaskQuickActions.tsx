import React from 'react';
import { Play, Sparkles, Eye } from 'lucide-react';
import { Button } from '../ui';

interface Task {
  id: string;
  title: string;
  order_index: number;
}

interface TaskQuickActionsProps {
  task: Task;
  onImplement: (taskId: string, taskTitle: string) => void;
  onBreakDown: (taskId: string, taskTitle: string) => void;
  onViewDetails: (taskId: string) => void;
  isExpanded?: boolean;
}

export function TaskQuickActions({
  task,
  onImplement,
  onBreakDown,
  onViewDetails,
  isExpanded = false,
}: TaskQuickActionsProps) {
  const handleImplement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImplement(task.id, task.title);
  };

  const handleBreakDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBreakDown(task.id, task.title);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(task.id);
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="flex gap-2 pt-3 mt-3 border-t border-primary-700/50">
      <Button
        onClick={handleImplement}
        variant="primary"
        className="flex-1 text-xs py-1.5"
      >
        <Play className="mr-1 w-3 h-3" />
        Implement
      </Button>
      <Button
        onClick={handleBreakDown}
        variant="secondary"
        className="flex-1 text-xs py-1.5"
      >
        <Sparkles className="mr-1 w-3 h-3" />
        Break Down
      </Button>
      <Button
        onClick={handleViewDetails}
        variant="ghost"
        className="text-xs py-1.5 px-2"
      >
        <Eye className="w-3 h-3" />
      </Button>
    </div>
  );
}

