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
  const taskNumber = task.order_index + 1;

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

  if (isExpanded) {
    return (
      <div className="flex gap-2 mt-3 pt-3 border-t border-primary-700/50">
        <Button
          onClick={handleImplement}
          variant="primary"
          className="flex-1 text-xs py-1.5"
        >
          <Play className="w-3 h-3 mr-1" />
          Implement
        </Button>
        <Button
          onClick={handleBreakDown}
          variant="secondary"
          className="flex-1 text-xs py-1.5"
        >
          <Sparkles className="w-3 h-3 mr-1" />
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

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleImplement}
        className="p-1.5 rounded hover:bg-primary-700/50 transition-colors"
        title="Implement task"
      >
        <Play className="w-3.5 h-3.5 text-primary-400 hover:text-green-400" />
      </button>
      <button
        onClick={handleBreakDown}
        className="p-1.5 rounded hover:bg-primary-700/50 transition-colors"
        title="Break down task"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary-400 hover:text-purple-400" />
      </button>
      <button
        onClick={handleViewDetails}
        className="p-1.5 rounded hover:bg-primary-700/50 transition-colors"
        title="View details"
      >
        <Eye className="w-3.5 h-3.5 text-primary-400 hover:text-blue-400" />
      </button>
    </div>
  );
}

