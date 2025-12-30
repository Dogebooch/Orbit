import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, AlertCircle, CheckCircle2 } from 'lucide-react';
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

  // For multi-field, check if required fields (non-optional) are filled
  const hasRequiredMultiFieldValues = () => {
    if (step.inputType !== 'multi-field' || !step.subFields) return true;
    return step.subFields
      .filter(sf => !sf.optional)
      .every(sf => objectValue[sf.id] && objectValue[sf.id].length > 0);
  };

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
                {subField.optional && (
                  <span className="ml-2 text-xs text-primary-500 font-normal">(optional)</span>
                )}
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
              {showValidation && step.required && step.inputType === 'multi-field' && hasValue && !hasRequiredMultiFieldValues() && (
                <span className="text-sm text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Fill in required fields
                </span>
              )}
              {showValidation && step.minLength && hasValue && !meetsMinLength && (
                <span className="text-sm text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {step.validationHint}
                </span>
              )}
              {hasValue && meetsMinLength && (step.inputType !== 'multi-field' || hasRequiredMultiFieldValues()) && (
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
