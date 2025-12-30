import React, { useState } from 'react';
import { Button, Card } from '../../ui';
import {
  Sparkles,
  ListChecks,
  Plus,
  Check,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface ParsedTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  acceptanceCriteria: string[];
  selected: boolean;
}

interface TaskParserProps {
  prdContent: string;
  onTasksGenerated: (tasks: ParsedTask[]) => void;
  existingTaskCount: number;
}

// Simple PRD parser - extracts features and converts to tasks
function parsePRDToTasks(prdContent: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const lines = prdContent.split('\n');
  
  let currentSection = '';
  let currentPriority: ParsedTask['priority'] = 'medium';
  let currentFeature: Partial<ParsedTask> | null = null;
  let featureIndex = 0;
  
  const priorityMap: Record<string, ParsedTask['priority']> = {
    'must have': 'high',
    'mvp': 'high',
    'should have': 'medium',
    'nice to have': 'low',
    'future': 'low',
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();

    // Detect section headers
    if (line.startsWith('##')) {
      currentSection = line.replace(/^#+\s*/, '').toLowerCase();
      
      // Update priority based on section
      for (const [key, priority] of Object.entries(priorityMap)) {
        if (currentSection.includes(key)) {
          currentPriority = priority;
          break;
        }
      }
    }

    // Detect feature headers (### or numbered features)
    const featureMatch = line.match(/^###?\s*(?:\d+\.\s*)?(?:Feature\s*\d*:?\s*)?(.+)/i);
    const numberedFeatureMatch = line.match(/^(?:\d+\.|\*|\-)\s*\*?\*?([^*\n]+)\*?\*?$/);
    
    if ((featureMatch || numberedFeatureMatch) && !line.toLowerCase().includes('acceptance') && !line.toLowerCase().includes('criteria')) {
      // Save previous feature
      if (currentFeature && currentFeature.title) {
        tasks.push({
          id: `task-${featureIndex}`,
          title: currentFeature.title || '',
          description: currentFeature.description || '',
          priority: currentFeature.priority || currentPriority,
          acceptanceCriteria: currentFeature.acceptanceCriteria || [],
          selected: true,
        });
        featureIndex++;
      }

      const title = (featureMatch ? featureMatch[1] : numberedFeatureMatch?.[1] || '').trim();
      
      // Skip if it looks like a header or common section name
      if (title.length > 3 && 
          !title.toLowerCase().includes('overview') &&
          !title.toLowerCase().includes('technical stack') &&
          !title.toLowerCase().includes('out of scope') &&
          !title.toLowerCase().includes('implementation') &&
          !title.toLowerCase().includes('success')) {
        currentFeature = {
          title: title.replace(/\[|\]/g, '').trim(),
          description: '',
          priority: currentPriority,
          acceptanceCriteria: [],
        };
      }
    }

    // Detect user story
    if (lowerLine.includes('user story:') || lowerLine.includes('as a ')) {
      const storyMatch = line.match(/(?:user story:?\s*)?(.+)/i);
      if (storyMatch && currentFeature) {
        currentFeature.description = storyMatch[1].trim();
      }
    }

    // Detect acceptance criteria (checklist items)
    if (line.match(/^-\s*\[\s*\]/) || line.match(/^-\s*\[x\]/i) || (lowerLine.includes('user can') && line.startsWith('-'))) {
      const criteriaMatch = line.match(/^-\s*(?:\[[\sx]\])?\s*(.+)/i);
      if (criteriaMatch && currentFeature) {
        currentFeature.acceptanceCriteria = currentFeature.acceptanceCriteria || [];
        currentFeature.acceptanceCriteria.push(criteriaMatch[1].trim());
      }
    }
  }

  // Don't forget the last feature
  if (currentFeature && currentFeature.title) {
    tasks.push({
      id: `task-${featureIndex}`,
      title: currentFeature.title,
      description: currentFeature.description || '',
      priority: currentFeature.priority || currentPriority,
      acceptanceCriteria: currentFeature.acceptanceCriteria || [],
      selected: true,
    });
  }

  return tasks;
}

export function TaskParser({ prdContent, onTasksGenerated, existingTaskCount }: TaskParserProps) {
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);

  const handleParse = () => {
    setIsParsing(true);
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
      const tasks = parsePRDToTasks(prdContent);
      setParsedTasks(tasks);
      setShowPreview(true);
      setIsParsing(false);
    }, 500);
  };

  const toggleTaskSelection = (taskId: string) => {
    setParsedTasks(tasks =>
      tasks.map(t => t.id === taskId ? { ...t, selected: !t.selected } : t)
    );
  };

  const updateTask = (taskId: string, updates: Partial<ParsedTask>) => {
    setParsedTasks(tasks =>
      tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    );
  };

  const removeTask = (taskId: string) => {
    setParsedTasks(tasks => tasks.filter(t => t.id !== taskId));
  };

  const handleGenerateTasks = () => {
    const selectedTasks = parsedTasks.filter(t => t.selected);
    onTasksGenerated(selectedTasks);
    setShowPreview(false);
    setParsedTasks([]);
  };

  const selectedCount = parsedTasks.filter(t => t.selected).length;

  const priorityColors = {
    high: 'bg-red-900/30 text-red-400 border-red-700/50',
    medium: 'bg-amber-900/30 text-amber-400 border-amber-700/50',
    low: 'bg-green-900/30 text-green-400 border-green-700/50',
  };

  if (!prdContent || prdContent.length < 100) {
    return (
      <Card className="bg-primary-800/30">
        <div className="flex items-center gap-3 text-primary-500">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Write or generate a PRD first to extract tasks</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!showPreview ? (
        <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-purple-200">Extract Tasks from PRD</h3>
                <p className="text-xs text-purple-300/70">
                  Parse your PRD to create development tasks automatically
                </p>
              </div>
            </div>
            <Button onClick={handleParse} loading={isParsing} variant="primary" className="bg-purple-600 hover:bg-purple-500">
              <ListChecks className="w-4 h-4 mr-2" />
              Parse PRD
            </Button>
          </div>
          
          {existingTaskCount > 0 && (
            <p className="mt-3 text-xs text-purple-400/70">
              You already have {existingTaskCount} task{existingTaskCount !== 1 ? 's' : ''}. New tasks will be added to your existing list.
            </p>
          )}
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-primary-100 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-purple-400" />
                Extracted Tasks
              </h3>
              <p className="text-sm text-primary-400">
                {selectedCount} of {parsedTasks.length} tasks selected
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateTasks} disabled={selectedCount === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add {selectedCount} Task{selectedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>

          {parsedTasks.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-primary-500 mx-auto mb-3" />
              <p className="text-primary-400">No tasks could be extracted from the PRD.</p>
              <p className="text-sm text-primary-500 mt-1">
                Try adding features with clear headers (### Feature Name) and acceptance criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {parsedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`border rounded-lg transition-all ${
                    task.selected
                      ? 'border-purple-600/50 bg-purple-900/10'
                      : 'border-primary-700 bg-primary-800/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3 p-3">
                    <button
                      onClick={() => toggleTaskSelection(task.id)}
                      className={`mt-1 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                        task.selected
                          ? 'bg-purple-600 text-white'
                          : 'border-2 border-primary-600 bg-primary-900'
                      }`}
                    >
                      {task.selected && <Check className="w-3 h-3" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      {editingTask === task.id ? (
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTask(task.id, { title: e.target.value })}
                          onBlur={() => setEditingTask(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingTask(null)}
                          className="w-full bg-primary-900 border border-primary-600 rounded px-2 py-1 text-primary-100 text-sm"
                          autoFocus
                        />
                      ) : (
                        <h4
                          className="font-medium text-primary-100 text-sm cursor-pointer hover:text-primary-200"
                          onClick={() => setEditingTask(task.id)}
                        >
                          {task.title}
                        </h4>
                      )}
                      
                      {task.description && (
                        <p className="text-xs text-primary-400 mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={task.priority}
                        onChange={(e) => updateTask(task.id, { priority: e.target.value as ParsedTask['priority'] })}
                        className={`text-xs px-2 py-1 rounded border ${priorityColors[task.priority]} bg-transparent cursor-pointer`}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>

                      <button
                        onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                        className="p-1 text-primary-500 hover:text-primary-300"
                      >
                        {expandedTask === task.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => removeTask(task.id)}
                        className="p-1 text-primary-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {expandedTask === task.id && (
                    <div className="px-3 pb-3 pt-0 border-t border-primary-700/50 mt-2">
                      {task.description && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-primary-400 mb-1">Description</p>
                          <p className="text-xs text-primary-300">{task.description}</p>
                        </div>
                      )}
                      
                      {task.acceptanceCriteria.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-primary-400 mb-1">Acceptance Criteria</p>
                          <ul className="space-y-1">
                            {task.acceptanceCriteria.map((criteria, i) => (
                              <li key={i} className="text-xs text-primary-300 flex items-start gap-2">
                                <span className="text-primary-500">•</span>
                                {criteria}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

