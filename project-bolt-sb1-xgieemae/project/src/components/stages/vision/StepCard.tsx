import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import { Textarea, Input } from '../../ui';
import type { StepConfig } from './guidedSetupConfig';

interface StepCardProps {
  step: StepConfig;
  value: string | Record<string, string>;
  onChange: (value: string | Record<string, string>) => void;
  showValidation?: boolean;
}

export function StepCard({ step, value, onChange, showValidation }: StepCardProps) {
  const [showExamples, setShowExamples] = useState(false);
  const [showBestPractices, setShowBestPractices] = useState(false);

  const stringValue = typeof value === 'string' ? value : '';
  const objectValue = typeof value === 'object' ? value : {};

  const getCharCount = () => {
    if (step.inputType === 'multi-field') {
      return Object.values(objectValue).join('').length;
    }
    return stringValue.length;
  };

  const meetsMinLength = !step.minLength || getCharCount() >= step.minLength;
  const hasValue = step.inputType === 'multi-field'
    ? Object.values(objectValue).some(v => v && v.length > 0)
    : stringValue.length > 0;

  const renderInput = () => {
    if (step.inputType === 'textarea') {
      return (
        <Textarea
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={step.placeholder}
          rows={step.rows || 4}
          className="text-base bg-primary-800 border-primary-600 focus:border-primary-400"
        />
      );
    }

    if (step.inputType === 'select') {
      return (
        <div className="space-y-3">
          {step.options?.map((option) => (
            <label
              key={option.value}
              className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                stringValue === option.value
                  ? 'border-primary-400 bg-primary-800/80'
                  : 'border-primary-700 bg-primary-800/40 hover:border-primary-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name={step.id}
                  value={option.value}
                  checked={stringValue === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <span className="font-medium text-primary-100">{option.label}</span>
                  {option.description && (
                    <p className="text-sm text-primary-400 mt-1">{option.description}</p>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      );
    }

    if (step.inputType === 'multi-field') {
      return (
        <div className="space-y-4">
          {step.subFields?.map((subField) => (
            <div key={subField.id}>
              <label className="block text-sm font-medium text-primary-300 mb-2">
                {subField.label}
              </label>
              {subField.type === 'textarea' ? (
                <Textarea
                  value={objectValue[subField.id] || ''}
                  onChange={(e) => onChange({ ...objectValue, [subField.id]: e.target.value })}
                  placeholder={subField.placeholder}
                  rows={subField.rows || 2}
                  className="text-base bg-primary-800 border-primary-600 focus:border-primary-400"
                />
              ) : (
                <Input
                  value={objectValue[subField.id] || ''}
                  onChange={(e) => onChange({ ...objectValue, [subField.id]: e.target.value })}
                  placeholder={subField.placeholder}
                  className="text-base bg-primary-800 border-primary-600 focus:border-primary-400"
                />
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <Input
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={step.placeholder}
        className="text-base bg-primary-800 border-primary-600 focus:border-primary-400"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary-800/30 rounded-xl p-6 border border-primary-700/50">
        <div className="flex items-start gap-3 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-300 mb-1">Why This Matters</h4>
            <p className="text-sm text-primary-300 leading-relaxed">{step.whyItMatters}</p>
          </div>
        </div>
      </div>

      <div>
        {renderInput()}

        {step.inputType !== 'select' && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {showValidation && step.required && !hasValue && (
                <span className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Required field
                </span>
              )}
              {showValidation && step.minLength && hasValue && !meetsMinLength && (
                <span className="text-sm text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {step.validationHint}
                </span>
              )}
              {hasValue && meetsMinLength && (
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Good detail
                </span>
              )}
            </div>
            <span className="text-sm text-primary-500">{getCharCount()} characters</span>
          </div>
        )}
      </div>

      {step.examples && (
        <div>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center gap-2 text-sm font-medium text-primary-300 hover:text-primary-100 transition-colors"
          >
            {showExamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showExamples ? 'Hide' : 'Show'} Examples
          </button>

          {showExamples && (
            <div className="mt-3 grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-300">
                    {step.examples.badLabel || 'Avoid This'}
                  </span>
                </div>
                <p className="text-sm text-red-200/80 italic">"{step.examples.bad}"</p>
              </div>
              <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-300">
                    {step.examples.goodLabel || 'Do This Instead'}
                  </span>
                </div>
                <p className="text-sm text-green-200/80 italic">"{step.examples.good}"</p>
              </div>
            </div>
          )}
        </div>
      )}

      {step.bestPractices.length > 0 && (
        <div>
          <button
            onClick={() => setShowBestPractices(!showBestPractices)}
            className="flex items-center gap-2 text-sm font-medium text-primary-300 hover:text-primary-100 transition-colors"
          >
            {showBestPractices ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showBestPractices ? 'Hide' : 'Show'} Best Practices
          </button>

          {showBestPractices && (
            <ul className="mt-3 space-y-2">
              {step.bestPractices.map((practice, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-primary-300">
                  <CheckCircle2 className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  {practice}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface AIChallengeStepProps {
  visionSummary: string;
  value: string;
  onChange: (value: string) => void;
}

export function AIChallengeStep({ visionSummary, value, onChange }: AIChallengeStepProps) {
  const [copied, setCopied] = useState(false);

  const challengePrompt = `Challenge this project idea with 5 hard questions. Help me identify potential flaws or missing pieces.

${visionSummary}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(challengePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <Lightbulb className="w-6 h-6 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-300 mb-2">Why This Step is Critical</h4>
            <p className="text-sm text-amber-200/80 leading-relaxed">
              This is one of the most valuable steps in vibe coding. AI can spot blind spots, missing pieces,
              and potential problems you haven't considered. Addressing these gaps now saves hours of rework later.
              The challenging questions and your answers will be included in your vision.md file.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-primary-300">
              Step 1: Copy this prompt
            </label>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-700 hover:bg-primary-600 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-primary-900 border border-primary-600 rounded-lg p-4 font-mono text-sm text-primary-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {challengePrompt}
          </div>
        </div>

        <div className="bg-primary-800/50 rounded-lg p-4">
          <h4 className="font-medium text-primary-200 mb-2">Step 2: Get AI's challenging questions</h4>
          <p className="text-sm text-primary-400">
            Paste this prompt into any AI (Claude, ChatGPT, Gemini, etc.) and ask it to challenge your idea with 5 hard questions.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-300 mb-2">
            Step 3: Record the questions and your answers
          </label>
          <p className="text-sm text-primary-400 mb-3">
            Paste the AI's challenging questions below, then write your thoughtful answers to each one.
            Be honest - uncomfortable questions often reveal the most important gaps.
          </p>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Example format:

**Question 1: How will you compete with established invoicing tools like FreshBooks?**
Answer: We're not competing directly - we're focused on the "quick invoice between calls" use case that bigger tools don't optimize for...

**Question 2: What happens when clients don't pay?**
Answer: For MVP, we'll focus on sending invoices. Payment tracking and reminders are Phase 2...

**Question 3: ...`}
            rows={12}
            className="text-base bg-primary-800 border-primary-600 focus:border-primary-400 font-mono text-sm"
          />
          <div className="mt-2 text-sm text-primary-500">
            {value.length} characters
          </div>
        </div>
      </div>
    </div>
  );
}
