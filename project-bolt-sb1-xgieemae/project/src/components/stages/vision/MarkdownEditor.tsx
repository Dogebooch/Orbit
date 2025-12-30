import React, { useState, useEffect, useRef } from 'react';
import { Button, AIHelperButton } from '../../ui';
import { FileText, RefreshCw } from 'lucide-react';
import { visionToMarkdown, userProfileToMarkdown, successMetricsToMarkdown, markdownToVision, markdownToUserProfile, markdownToSuccessMetrics } from '../../../utils/markdownUtils';
import type { ContentType } from '../../../lib/gemini';

interface VisionData {
  problem: string;
  target_user: string;
  success_metrics: string;
  why_software: string;
  target_level: string;
}

interface UserProfileData {
  primary_user: string;
  goal: string;
  context: string;
  frustrations: string;
  technical_comfort: string;
  persona_name: string;
  persona_role: string;
  competitor_notes?: string;
}

interface MarkdownEditorProps {
  vision: VisionData;
  userProfile: UserProfileData;
  onVisionChange: (vision: VisionData) => void;
  onUserProfileChange: (profile: UserProfileData) => void;
  lastSaved?: Date;
}

type ActiveDocument = 'vision' | 'profile' | 'metrics';

export function MarkdownEditor({
  vision,
  userProfile,
  onVisionChange,
  onUserProfileChange,
  lastSaved,
}: MarkdownEditorProps) {
  const [activeDoc, setActiveDoc] = useState<ActiveDocument>('vision');
  const [visionMarkdown, setVisionMarkdown] = useState('');
  const [profileMarkdown, setProfileMarkdown] = useState('');
  const [metricsMarkdown, setMetricsMarkdown] = useState('');
  
  // Refs to track if the change is from user editing (internal) vs prop updates (external)
  const isInternalVisionChange = useRef(false);
  const isInternalProfileChange = useRef(false);
  const isInternalMetricsChange = useRef(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Skip regenerating markdown if the change was from user editing
    if (isInternalVisionChange.current) {
      isInternalVisionChange.current = false;
      // Still update metrics if vision changed internally (but not if metrics changed internally)
      if (!isInternalMetricsChange.current) {
        setMetricsMarkdown(successMetricsToMarkdown(vision));
      }
      return;
    }
    if (isInternalMetricsChange.current) {
      isInternalMetricsChange.current = false;
      return;
    }
    setVisionMarkdown(visionToMarkdown(vision));
    setMetricsMarkdown(successMetricsToMarkdown(vision));
    isInitialized.current = true;
  }, [vision]);

  useEffect(() => {
    // Skip regenerating markdown if the change was from user editing
    if (isInternalProfileChange.current) {
      isInternalProfileChange.current = false;
      return;
    }
    setProfileMarkdown(userProfileToMarkdown(userProfile));
  }, [userProfile]);

  const handleVisionMarkdownChange = (value: string) => {
    setVisionMarkdown(value);
    const parsed = markdownToVision(value);
    // Mark as internal change so useEffect doesn't overwrite
    isInternalVisionChange.current = true;
    onVisionChange({ ...vision, ...parsed });
  };

  const handleProfileMarkdownChange = (value: string) => {
    setProfileMarkdown(value);
    const parsed = markdownToUserProfile(value);
    // Mark as internal change so useEffect doesn't overwrite
    isInternalProfileChange.current = true;
    onUserProfileChange({ ...userProfile, ...parsed });
  };

  const handleMetricsMarkdownChange = (value: string) => {
    setMetricsMarkdown(value);
    const parsed = markdownToSuccessMetrics(value);
    // Mark as internal change so useEffect doesn't overwrite
    isInternalMetricsChange.current = true;
    onVisionChange({ ...vision, ...parsed });
  };

  const handleRegenerateFromStructure = () => {
    if (activeDoc === 'vision') {
      setVisionMarkdown(visionToMarkdown(vision));
    } else if (activeDoc === 'profile') {
      setProfileMarkdown(userProfileToMarkdown(userProfile));
    } else {
      setMetricsMarkdown(successMetricsToMarkdown(vision));
    }
  };

  const handleDownload = () => {
    let content: string;
    let filename: string;

    if (activeDoc === 'vision') {
      content = visionMarkdown;
      filename = '0_vision.md';
    } else if (activeDoc === 'profile') {
      content = profileMarkdown;
      filename = '1_user_profile.md';
    } else {
      content = metricsMarkdown;
      filename = '2_success_metrics.md';
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCurrentMarkdown = () => {
    if (activeDoc === 'vision') return visionMarkdown;
    if (activeDoc === 'profile') return profileMarkdown;
    return metricsMarkdown;
  };

  const handleMarkdownChange = (value: string) => {
    if (activeDoc === 'vision') {
      handleVisionMarkdownChange(value);
    } else if (activeDoc === 'profile') {
      handleProfileMarkdownChange(value);
    } else {
      handleMetricsMarkdownChange(value);
    }
  };

  const currentMarkdown = getCurrentMarkdown();

  const getContentType = (): ContentType => {
    if (activeDoc === 'vision') return 'vision';
    if (activeDoc === 'profile') return 'userProfile';
    return 'vision'; // metrics is part of vision
  };

  const handleAIImprove = (improvedContent: string) => {
    handleMarkdownChange(improvedContent);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between -mx-6 px-6 py-3 bg-slate-800/50 border-b border-slate-700 rounded-t-lg">
        <div className="flex gap-2">
          <Button
            variant={activeDoc === 'vision' ? 'primary' : 'ghost'}
            onClick={() => setActiveDoc('vision')}
          >
            <FileText className="w-4 h-4 mr-2 text-amber-400" />
            0_vision.md
          </Button>
          <Button
            variant={activeDoc === 'profile' ? 'primary' : 'ghost'}
            onClick={() => setActiveDoc('profile')}
          >
            <FileText className="w-4 h-4 mr-2 text-blue-400" />
            1_user_profile.md
          </Button>
          <Button
            variant={activeDoc === 'metrics' ? 'primary' : 'ghost'}
            onClick={() => setActiveDoc('metrics')}
          >
            <FileText className="w-4 h-4 mr-2 text-green-400" />
            2_success_metrics.md
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-sm text-primary-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleRegenerateFromStructure} title="Regenerate from structured data">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 380px)', minHeight: '500px' }}>
        <div className="flex items-center gap-2 mb-2 px-1 flex-shrink-0">
          <FileText className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-primary-300">
            Editor
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-primary-500">
              {currentMarkdown.length} characters
            </span>
            <AIHelperButton
              content={currentMarkdown}
              contentType={getContentType()}
              onImprove={handleAIImprove}
              fieldLabel={activeDoc === 'profile' ? 'user profile' : activeDoc === 'metrics' ? 'success metrics' : 'vision'}
            />
          </div>
        </div>
        <textarea
          value={currentMarkdown}
          onChange={(e) => handleMarkdownChange(e.target.value)}
          className="flex-1 w-full p-4 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 overflow-auto"
          spellCheck={false}
        />
      </div>

      <div className="flex items-start gap-2 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <div className="text-blue-300 text-sm">
          <strong>Tip:</strong> These files are designed for AI-assisted development. Place them in your project root for Claude Code and Copilot to reference during development.
        </div>
      </div>
    </div>
  );
}
