import React, { useState, useEffect, useRef } from 'react';
import { Button, AIHelperButton } from '../../ui';
import { FileText, RefreshCw } from 'lucide-react';
import { visionToMarkdown, userProfileToMarkdown, successMetricsToMarkdown, markdownToVision, markdownToUserProfile, markdownToSuccessMetrics } from '../../../utils/markdownUtils';
import type { ContentType } from '../../../lib/gemini';
import { PromptHelper } from './PromptHelper';
import { VISION_PROMPT, USER_PROFILE_PROMPT, SUCCESS_METRICS_PROMPT } from './prompts';

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
  competitor_notes: string;
}

interface MarkdownEditorProps {
  vision: VisionData;
  userProfile: UserProfileData;
  onVisionChange: (vision: VisionData) => void;
  onUserProfileChange: (profile: UserProfileData) => void;
  lastSaved?: Date;
  activeDocument?: ActiveDocument;
  onActiveDocumentChange?: (doc: ActiveDocument) => void;
}

type ActiveDocument = 'vision' | 'profile' | 'metrics';

export function MarkdownEditor({
  vision,
  userProfile,
  onVisionChange,
  onUserProfileChange,
  lastSaved,
  activeDocument,
  onActiveDocumentChange,
}: MarkdownEditorProps) {
  const [activeDoc, setActiveDoc] = useState<ActiveDocument>(activeDocument || 'vision');
  
  // Sync with parent-controlled activeDocument
  useEffect(() => {
    if (activeDocument !== undefined && activeDocument !== activeDoc) {
      setActiveDoc(activeDocument);
    }
  }, [activeDocument]);
  
  const handleSetActiveDoc = (doc: ActiveDocument) => {
    setActiveDoc(doc);
    onActiveDocumentChange?.(doc);
  };
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

  const getPlaceholder = (): string => {
    if (activeDoc === 'vision') {
      return `# Vision

## Problem Statement
What specific problem are you solving? Include who has this problem and what makes it painful. Be as specific as possible - include who has this problem and what makes it painful.

Example: Small business owners spend 15+ minutes per invoice because they have to manually enter client details, calculate totals, and format documents in Word before emailing as PDFs.

## Target User
Who exactly will use this software? Define your target user with enough detail that you could find them in real life. Include their role, experience level, and current situation.

Example: Solo consultants and freelancers who bill 5-20 clients monthly. They're not accounting experts, work from laptops, and get frustrated with bloated software that requires tutorials.

## Why Software?
Why does this need to be custom software? Be honest - could this be solved with a spreadsheet, existing tool, or manual process?

Example: Spreadsheets require manual formatting and client email lookup. Existing tools like FreshBooks are too complex for quick invoicing. Custom software can save 10+ minutes per invoice through templates and client auto-fill.

## Target Level
Choose your target: MVP (Minimum Viable Product) - Minimally viable for real users to test. Core features work reliably.`;
    } else if (activeDoc === 'profile') {
      return `# User Profile

## Primary User
Create your primary user persona and define their goal. Give your target user a name and identity, then define what success looks like for them. Focus on the outcome they want to achieve.

Example: Sarah, a freelance graphic designer who bills 10-15 clients per month and prefers quick, simple tools. Her goal: Get paid faster by sending professional invoices immediately after completing work.

## Context (Optional)
When and where will users use this? e.g., Right after finishing a client project, usually on a laptop, often between meetings...

## Frustrations (Optional)
What frustrates them about current solutions? e.g., Too many steps, requires learning accounting concepts, templates look unprofessional...

## Technical Comfort (Optional)
Low - Needs simple, guided interfaces
Medium - Comfortable with standard apps
High - Can handle advanced features

## Competitor Notes (Optional)
Notes from researching similar apps. What do they do well? What do users complain about?`;
    } else {
      return `# Success Metrics

## How will you know it's working?
Define specific, measurable outcomes. These become your acceptance criteria and help you know when you're done.

Example:
- 90% of users complete their first invoice in under 2 minutes
- Users can complete the full workflow without instructions
- Works on both mobile and desktop browsers
- Zero crashes during demo with realistic data

Make metrics specific and measurable. Include at least one usability metric and one technical metric.`;
    }
  };

  const getPromptHelper = () => {
    if (activeDoc === 'vision') {
      return (
        <PromptHelper
          prompt={VISION_PROMPT}
          documentName="Vision Document"
          fileName="0_vision.md"
          title="Generate Your Vision Document with AI"
          description="Use this prompt to have Claude (or any AI) guide you through creating your vision document step-by-step."
          iconColor="amber"
        />
      );
    } else if (activeDoc === 'profile') {
      return (
        <PromptHelper
          prompt={USER_PROFILE_PROMPT}
          documentName="User Profile"
          fileName="1_user_profile.md"
          title="Generate Your User Profile with AI"
          description="Use this prompt to have Claude (or any AI) guide you through creating your user profile step-by-step."
          iconColor="blue"
        />
      );
    } else {
      return (
        <PromptHelper
          prompt={SUCCESS_METRICS_PROMPT}
          documentName="Success Metrics"
          fileName="2_success_metrics.md"
          title="Generate Your Success Metrics with AI"
          description="Use this prompt to have Claude (or any AI) guide you through creating your success metrics step-by-step."
          iconColor="green"
        />
      );
    }
  };

  return (
    <div className="space-y-4">
      {getPromptHelper()}
      <div className="flex items-center justify-between -mx-6 px-6 py-3 bg-slate-800/50 border-b border-slate-700 rounded-t-lg">
        <div className="flex gap-2">
          <Button
            variant={activeDoc === 'vision' ? 'primary' : 'ghost'}
            onClick={() => handleSetActiveDoc('vision')}
          >
            <FileText className="w-4 h-4 mr-2 text-amber-400" />
            0_vision.md
          </Button>
          <Button
            variant={activeDoc === 'profile' ? 'primary' : 'ghost'}
            onClick={() => handleSetActiveDoc('profile')}
          >
            <FileText className="w-4 h-4 mr-2 text-blue-400" />
            1_user_profile.md
          </Button>
          <Button
            variant={activeDoc === 'metrics' ? 'primary' : 'ghost'}
            onClick={() => handleSetActiveDoc('metrics')}
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
          placeholder={currentMarkdown.length === 0 ? getPlaceholder() : ''}
          className="flex-1 w-full p-4 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 overflow-auto placeholder-primary-600"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
