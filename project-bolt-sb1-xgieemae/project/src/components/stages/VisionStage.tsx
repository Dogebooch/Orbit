import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../ui';
import { Lightbulb, Download, Wand2, FileEdit, CheckCircle, FileText, ChevronDown } from 'lucide-react';
import { GuidedSetup } from './vision/GuidedSetup';
import { MarkdownEditor } from './vision/MarkdownEditor';
import { visionToMarkdown, userProfileToMarkdown, successMetricsToMarkdown } from '../../utils/markdownUtils';

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

type EditMode = 'guided' | 'editor';

export function VisionStage() {
  const { currentProject, setCurrentStage } = useApp();
  const [mode, setMode] = useState<EditMode>('guided');
  const [vision, setVision] = useState<VisionData>({
    problem: '',
    target_user: '',
    success_metrics: '',
    why_software: '',
    target_level: 'mvp',
    ai_challenge_response: '',
  });
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    primary_user: '',
    goal: '',
    context: '',
    frustrations: '',
    technical_comfort: 'medium',
    time_constraints: '',
    persona_name: '',
    persona_role: '',
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const loadData = async () => {
    if (!currentProject) return;

    const { data: visionData } = await supabase
      .from('visions')
      .select('*')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (visionData) {
      setVision({
        problem: visionData.problem || '',
        target_user: visionData.target_user || '',
        success_metrics: visionData.success_metrics || '',
        why_software: visionData.why_software || '',
        target_level: visionData.target_level || 'mvp',
        ai_challenge_response: visionData.ai_challenge_response || '',
      });
      if (visionData.problem || visionData.target_user) {
        setMode('editor');
      }
    }

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (profileData) {
      setUserProfile({
        primary_user: profileData.primary_user || '',
        goal: profileData.goal || '',
        context: profileData.context || '',
        frustrations: profileData.frustrations || '',
        technical_comfort: profileData.technical_comfort || 'medium',
        time_constraints: profileData.time_constraints || '',
        persona_name: profileData.persona_name || '',
        persona_role: profileData.persona_role || '',
      });
    }
  };

  const saveData = useCallback(async (silent = false) => {
    if (!currentProject) return;

    if (!silent) setSaving(true);
    try {
      const visionMarkdown = visionToMarkdown(vision);
      const profileMarkdown = userProfileToMarkdown(userProfile);

      const { data: existingVision } = await supabase
        .from('visions')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (existingVision) {
        await supabase
          .from('visions')
          .update({
            ...vision,
            markdown_content: visionMarkdown,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('visions').insert({
          project_id: currentProject.id,
          ...vision,
          markdown_content: visionMarkdown,
        });
      }

      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from('user_profiles')
          .update({
            ...userProfile,
            markdown_content: profileMarkdown,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', currentProject.id);
      } else {
        await supabase.from('user_profiles').insert({
          project_id: currentProject.id,
          ...userProfile,
          markdown_content: profileMarkdown,
        });
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving data:', err);
    } finally {
      if (!silent) setSaving(false);
    }
  }, [currentProject, vision, userProfile]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      saveData(true);
    }, 2000);
    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout, saveData]);

  const handleVisionChange = useCallback((newVision: VisionData) => {
    setVision(newVision);
    triggerAutoSave();
  }, [triggerAutoSave]);

  const handleUserProfileChange = useCallback((newProfile: UserProfileData) => {
    setUserProfile(newProfile);
    triggerAutoSave();
  }, [triggerAutoSave]);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadVision = () => {
    downloadFile(visionToMarkdown(vision), '0_vision.md');
  };

  const downloadUserProfile = () => {
    downloadFile(userProfileToMarkdown(userProfile), '1_user_profile.md');
  };

  const downloadSuccessMetrics = () => {
    downloadFile(successMetricsToMarkdown(vision), '2_success_metrics.md');
  };

  const downloadAll = () => {
    downloadVision();
    setTimeout(() => downloadUserProfile(), 100);
    setTimeout(() => downloadSuccessMetrics(), 200);
    setShowDownloadMenu(false);
  };

  const handleContinue = async () => {
    await saveData();
    await supabase
      .from('projects')
      .update({ current_stage: 'strategy' })
      .eq('id', currentProject?.id);
    setCurrentStage('strategy');
  };

  const handleGuidedComplete = () => {
    setMode('editor');
    saveData(true);
  };

  const isComplete = vision.problem && vision.target_user && userProfile.primary_user && userProfile.goal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-primary-400" />
            Foundation: Vision & User
          </h1>
          <p className="text-primary-400 mt-2">
            Before building anything, define what you're solving and who it's for.
          </p>
        </div>

        {isComplete && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-300">Foundation Complete</span>
          </div>
        )}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6 -mx-6 -mt-6 px-6 py-4 bg-slate-800/50 border-b border-slate-700 rounded-t-lg">
          <div className="flex gap-2">
            <Button
              variant={mode === 'guided' ? 'primary' : 'ghost'}
              onClick={() => setMode('guided')}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Guided Setup
            </Button>
            <Button
              variant={mode === 'editor' ? 'primary' : 'ghost'}
              onClick={() => setMode('editor')}
            >
              <FileEdit className="w-4 h-4 mr-2" />
              Editor Mode
            </Button>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-2 bg-primary-800 border border-primary-600 rounded-lg shadow-xl z-10 min-w-[200px]">
                  <button
                    onClick={downloadAll}
                    className="w-full px-4 py-3 text-left hover:bg-primary-700 transition-colors border-b border-primary-700 flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-primary-400" />
                    <div>
                      <span className="text-primary-100 font-medium">Download All</span>
                      <span className="block text-xs text-primary-400">3 files</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { downloadVision(); setShowDownloadMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-primary-700 transition-colors flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-primary-200 text-sm">0_vision.md</span>
                  </button>
                  <button
                    onClick={() => { downloadUserProfile(); setShowDownloadMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-primary-700 transition-colors flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-primary-200 text-sm">1_user_profile.md</span>
                  </button>
                  <button
                    onClick={() => { downloadSuccessMetrics(); setShowDownloadMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-primary-700 transition-colors rounded-b-lg flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-green-400" />
                    <span className="text-primary-200 text-sm">2_success_metrics.md</span>
                  </button>
                </div>
              )}
            </div>
            {mode === 'editor' && (
              <Button onClick={handleContinue} disabled={!isComplete}>
                Continue to Strategy
              </Button>
            )}
          </div>
        </div>

        {mode === 'guided' ? (
          <GuidedSetup
            vision={vision}
            userProfile={userProfile}
            onVisionChange={handleVisionChange}
            onUserProfileChange={handleUserProfileChange}
            onComplete={handleGuidedComplete}
          />
        ) : (
          <MarkdownEditor
            vision={vision}
            userProfile={userProfile}
            onVisionChange={handleVisionChange}
            onUserProfileChange={handleUserProfileChange}
            lastSaved={lastSaved}
          />
        )}
      </Card>

      {mode === 'editor' && !isComplete && (
        <div className="flex items-center justify-center p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-300">
            Complete the required fields (Problem, Target User, Primary User, Goal) to proceed to Strategy
          </p>
        </div>
      )}
    </div>
  );
}
