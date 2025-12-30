import React, { useState } from 'react';
import { Button, Card, Textarea, Input } from '../../ui';
import {
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Wand2,
  AlertCircle,
  RefreshCw,
  ClipboardPaste,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface QuickStartProps {
  onGenerate: (data: GeneratedData) => void;
  projectName: string;
}

interface GeneratedData {
  vision: {
    problem: string;
    target_user: string;
    success_metrics: string;
    why_software: string;
  };
  userProfile: {
    primary_user: string;
    goal: string;
    context: string;
    frustrations: string;
    technical_comfort: string;
    persona_name: string;
    persona_role: string;
  };
}

const PROMPT_TEMPLATE = (description: string, projectName: string) => `You are helping a developer create a project foundation document. Based on the following project description, generate structured data for the project's vision and user profile.

PROJECT NAME: ${projectName}

PROJECT DESCRIPTION:
${description}

Generate a JSON response with this exact structure (no markdown, just the JSON):
{
  "vision": {
    "problem": "A clear problem statement (1-2 sentences)",
    "target_user": "Description of target user (1-2 sentences)",
    "success_metrics": "3-5 measurable success criteria (bullet points with - prefix)",
    "why_software": "Why software is the right solution (1-2 sentences)"
  },
  "userProfile": {
    "primary_user": "Detailed description of the primary user",
    "goal": "What the user wants to achieve",
    "context": "When/where/how the user will use this",
    "frustrations": "3-4 pain points (bullet points with - prefix)",
    "technical_comfort": "low, medium, or high",
    "persona_name": "A realistic first name for the persona",
    "persona_role": "Their job title or role"
  }
}

Important: Return ONLY the JSON object, no additional text or markdown code blocks.`;

export function QuickStart({ onGenerate, projectName }: QuickStartProps) {
  const [step, setStep] = useState<'describe' | 'generate' | 'paste'>('describe');
  const [description, setDescription] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [pastedResponse, setPastedResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleGeneratePrompt = () => {
    if (!description.trim()) return;
    setGeneratedPrompt(PROMPT_TEMPLATE(description.trim(), projectName));
    setStep('generate');
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParseResponse = () => {
    setError(null);
    try {
      // Try to extract JSON from the response (handle potential markdown code blocks)
      let jsonStr = pastedResponse.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      const data = JSON.parse(jsonStr) as GeneratedData;
      
      // Validate structure
      if (!data.vision || !data.userProfile) {
        throw new Error('Invalid structure: missing vision or userProfile');
      }
      if (!data.vision.problem || !data.vision.target_user) {
        throw new Error('Invalid structure: missing required vision fields');
      }
      if (!data.userProfile.primary_user || !data.userProfile.goal) {
        throw new Error('Invalid structure: missing required userProfile fields');
      }
      
      onGenerate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse response. Make sure it\'s valid JSON.');
    }
  };

  const reset = () => {
    setStep('describe');
    setDescription('');
    setGeneratedPrompt('');
    setPastedResponse('');
    setError(null);
  };

  return (
    <Card className="border-2 border-dashed border-primary-600 bg-gradient-to-br from-primary-900/50 to-primary-800/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary-100">AI Quick Start</h2>
          <p className="text-sm text-primary-400">Generate your foundation in seconds with AI</p>
        </div>
      </div>

      {step === 'describe' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Describe your project in plain English
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: I want to build a habit tracking app that helps busy professionals build better daily routines. It should be simple, mobile-friendly, and send reminders."
              rows={4}
              className="bg-primary-900"
            />
            <p className="text-xs text-primary-500 mt-2">
              The more detail you provide, the better the generated foundation will be.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleGeneratePrompt}
              disabled={!description.trim() || description.length < 20}
              className="flex-1"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate AI Prompt
            </Button>
          </div>
        </div>
      )}

      {step === 'generate' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <strong className="text-blue-300">How to use:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-300/80">
                  <li>Copy the prompt below</li>
                  <li>Paste it into Claude, ChatGPT, or any AI assistant</li>
                  <li>Copy the AI's JSON response</li>
                  <li>Click "Paste AI Response" below</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-primary-300">
                AI Prompt (click to copy)
              </label>
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                {showPrompt ? 'Hide' : 'Show'} prompt
                {showPrompt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            
            {showPrompt && (
              <div className="relative">
                <pre className="p-4 bg-primary-900 border border-primary-700 rounded-lg text-xs text-primary-300 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {generatedPrompt}
                </pre>
              </div>
            )}
            
            <Button onClick={copyPrompt} variant="secondary" className="w-full mt-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Prompt to Clipboard
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setStep('describe')}>
              Edit Description
            </Button>
            <Button onClick={() => setStep('paste')} className="flex-1">
              <ClipboardPaste className="w-4 h-4 mr-2" />
              Paste AI Response
            </Button>
          </div>
        </div>
      )}

      {step === 'paste' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Paste the AI's JSON response
            </label>
            <Textarea
              value={pastedResponse}
              onChange={(e) => {
                setPastedResponse(e.target.value);
                setError(null);
              }}
              placeholder='Paste the JSON response from the AI here...

Example:
{
  "vision": {
    "problem": "...",
    ...
  },
  "userProfile": {
    ...
  }
}'
              rows={8}
              className={`bg-primary-900 font-mono text-sm ${error ? 'border-red-500' : ''}`}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setStep('generate')}>
              Back
            </Button>
            <Button 
              onClick={handleParseResponse}
              disabled={!pastedResponse.trim()}
              className="flex-1"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Apply to Foundation
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-primary-700/50 flex items-center justify-between">
        <span className="text-xs text-primary-500">
          Step {step === 'describe' ? 1 : step === 'generate' ? 2 : 3} of 3
        </span>
        {step !== 'describe' && (
          <button
            onClick={reset}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Start over
          </button>
        )}
      </div>
    </Card>
  );
}

