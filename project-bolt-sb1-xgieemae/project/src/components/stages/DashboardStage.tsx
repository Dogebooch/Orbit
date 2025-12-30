import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Card, Button } from '../ui';
import {
  LayoutDashboard,
  Lightbulb,
  Search,
  ListChecks,
  Code2,
  Rocket,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';

interface DashboardStageProps {
  onNavigate: (stage: string) => void;
}

interface StageStatus {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  complete: boolean;
  progress: number;
  details: string;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export function DashboardStage({ onNavigate }: DashboardStageProps) {
  const { currentProject, user } = useApp();
  const [stages, setStages] = useState<StageStatus[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextAction, setNextAction] = useState<{ label: string; stage: string; description: string } | null>(null);

  useEffect(() => {
    if (currentProject) {
      loadDashboardData();
    }
  }, [currentProject]);

  const loadDashboardData = async () => {
    if (!currentProject) return;
    setLoading(true);

    const stageStatuses: StageStatus[] = [];

    // 1. Check Vision Stage
    const { data: visionData } = await supabase
      .from('visions')
      .select('problem, target_user, success_metrics, why_software')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('primary_user, goal, frustrations, technical_comfort')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    const visionFields = [
      visionData?.problem,
      visionData?.target_user,
      visionData?.success_metrics,
      profileData?.primary_user,
      profileData?.goal,
    ];
    const visionComplete = visionFields.filter(Boolean).length;
    const visionTotal = visionFields.length;

    stageStatuses.push({
      id: 'vision',
      name: 'Foundation',
      description: 'Vision & User Profile',
      icon: Lightbulb,
      complete: visionComplete === visionTotal,
      progress: Math.round((visionComplete / visionTotal) * 100),
      details: `${visionComplete}/${visionTotal} fields completed`,
    });

    // 2. Check Research Stage
    const { data: researchApps } = await supabase
      .from('research_apps')
      .select('id')
      .eq('project_id', currentProject.id);

    const researchCount = researchApps?.length ?? 0;
    stageStatuses.push({
      id: 'research',
      name: 'Research',
      description: 'Market & Discovery',
      icon: Search,
      complete: researchCount > 0,
      progress: researchCount > 0 ? 100 : 0,
      details: researchCount > 0 ? `${researchCount} apps analyzed` : 'No research yet',
    });

    // 3. Check Strategy Stage
    const { data: prdData } = await supabase
      .from('prds')
      .select('content')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    const prdLength = prdData?.content?.length ?? 0;
    const prdComplete = prdLength > 500;
    stageStatuses.push({
      id: 'strategy',
      name: 'Strategy',
      description: 'PRD & Tasks',
      icon: ListChecks,
      complete: prdComplete,
      progress: Math.min(100, Math.round((prdLength / 500) * 100)),
      details: prdComplete ? 'PRD completed' : prdLength > 0 ? 'PRD in progress' : 'No PRD yet',
    });

    // 4. Check Workbench Stage (Tasks)
    const { data: taskData } = await supabase
      .from('tasks')
      .select('id, title, status')
      .eq('project_id', currentProject.id)
      .order('order_index', { ascending: true });

    const allTasks = taskData ?? [];
    setTasks(allTasks);
    
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const totalTasks = allTasks.length;
    const workbenchProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    stageStatuses.push({
      id: 'workbench',
      name: 'Workbench',
      description: 'Build & Code',
      icon: Code2,
      complete: totalTasks > 0 && completedTasks === totalTasks,
      progress: workbenchProgress,
      details: totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks done` : 'No tasks yet',
    });

    // 5. Check Testing Stage
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('user_id', user?.id)
      .eq('key', `testing_checklist_${currentProject.id}`)
      .maybeSingle();

    let testingProgress = 0;
    let testingComplete = false;
    if (settingsData?.value) {
      const checks = Object.values(settingsData.value as Record<number, boolean>);
      const completed = checks.filter(Boolean).length;
      testingProgress = Math.round((completed / 10) * 100);
      testingComplete = completed >= 10;
    }

    stageStatuses.push({
      id: 'testing',
      name: 'Testing',
      description: 'Ship & Deploy',
      icon: Rocket,
      complete: testingComplete,
      progress: testingProgress,
      details: testingComplete ? 'Ready to ship!' : `${testingProgress}% validated`,
    });

    setStages(stageStatuses);

    // Determine next suggested action
    const incompleteStage = stageStatuses.find(s => !s.complete);
    if (incompleteStage) {
      const actions: Record<string, { label: string; description: string }> = {
        vision: { label: 'Complete your Foundation', description: 'Define your vision and target user to guide AI assistants' },
        research: { label: 'Research competitors', description: 'Analyze similar apps to find opportunities' },
        strategy: { label: 'Write your PRD', description: 'Create a Product Requirements Document' },
        workbench: { label: 'Work on tasks', description: allTasks.find(t => t.status === 'in_progress')?.title || 'Start implementing features' },
        testing: { label: 'Validate your app', description: 'Complete the testing checklist before shipping' },
      };
      setNextAction({
        stage: incompleteStage.id,
        ...actions[incompleteStage.id],
      });
    } else {
      setNextAction(null);
    }

    setLoading(false);
  };

  const overallProgress = stages.length > 0
    ? Math.round(stages.reduce((acc, s) => acc + s.progress, 0) / stages.length)
    : 0;

  const currentTask = tasks.find(t => t.status === 'in_progress');
  const pendingTasks = tasks.filter(t => t.status === 'pending').slice(0, 3);
  const recentlyCompleted = tasks.filter(t => t.status === 'completed').slice(-3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-primary-400" />
          Project Dashboard
        </h1>
        <p className="text-primary-400 mt-2">
          Overview of your project progress and suggested next actions
        </p>
      </div>

      {/* Next Action Banner */}
      {nextAction && (
        <Card className="bg-gradient-to-r from-primary-800 to-primary-900 border-primary-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-700 rounded-xl">
                <PlayCircle className="w-6 h-6 text-primary-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary-100">
                  Suggested: {nextAction.label}
                </h3>
                <p className="text-sm text-primary-400">{nextAction.description}</p>
              </div>
            </div>
            <Button onClick={() => onNavigate(nextAction.stage)}>
              Go to {nextAction.stage.charAt(0).toUpperCase() + nextAction.stage.slice(1)}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Overall Progress */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Overall Progress
          </h2>
          <span className="text-2xl font-bold text-primary-100">{overallProgress}%</span>
        </div>
        <div className="h-3 bg-primary-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 via-blue-500 to-green-500 rounded-full transition-all duration-700"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </Card>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <Card
              key={stage.id}
              className={`cursor-pointer transition-all hover:border-primary-500 ${
                stage.complete ? 'border-green-700/50 bg-green-900/10' : ''
              }`}
              onClick={() => onNavigate(stage.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stage.complete ? 'bg-green-900/50' : 'bg-primary-800'}`}>
                    <Icon className={`w-5 h-5 ${stage.complete ? 'text-green-400' : 'text-primary-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-100">{stage.name}</h3>
                    <p className="text-xs text-primary-500">{stage.description}</p>
                  </div>
                </div>
                {stage.complete ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <span className="text-sm font-medium text-primary-400">{stage.progress}%</span>
                )}
              </div>
              
              <div className="h-1.5 bg-primary-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    stage.complete ? 'bg-green-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${stage.progress}%` }}
                />
              </div>
              
              <p className="text-xs text-primary-500">{stage.details}</p>
            </Card>
          );
        })}
      </div>

      {/* Tasks Overview */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Task */}
          <Card>
            <h3 className="text-lg font-semibold text-primary-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Current Task
            </h3>
            {currentTask ? (
              <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="font-medium text-primary-100">{currentTask.title}</p>
                <Button
                  variant="ghost"
                  className="mt-3 text-sm"
                  onClick={() => onNavigate('workbench')}
                >
                  View in Workbench
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-primary-800/50 rounded-lg text-center">
                <Circle className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-primary-500 text-sm">No task in progress</p>
                {pendingTasks.length > 0 && (
                  <Button
                    variant="ghost"
                    className="mt-2 text-sm"
                    onClick={() => onNavigate('workbench')}
                  >
                    Start next task
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Up Next */}
          <Card>
            <h3 className="text-lg font-semibold text-primary-100 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Up Next
            </h3>
            {pendingTasks.length > 0 ? (
              <div className="space-y-2">
                {pendingTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-primary-800/50 rounded-lg"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center text-xs text-primary-400">
                      {i + 1}
                    </span>
                    <span className="text-sm text-primary-200 truncate">{task.title}</span>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'pending').length > 3 && (
                  <p className="text-xs text-primary-500 text-center pt-2">
                    +{tasks.filter(t => t.status === 'pending').length - 3} more tasks
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-primary-800/50 rounded-lg text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-primary-500 text-sm">All tasks completed!</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-primary-100 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => onNavigate('vision')}>
            <Lightbulb className="w-4 h-4 mr-2" />
            Edit Vision
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('strategy')}>
            <ListChecks className="w-4 h-4 mr-2" />
            View PRD
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('workbench')}>
            <Code2 className="w-4 h-4 mr-2" />
            Open Workbench
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('testing')}>
            <Rocket className="w-4 h-4 mr-2" />
            Testing Checklist
          </Button>
        </div>
      </Card>
    </div>
  );
}

