import React, { useState } from 'react';
import { Button } from '../../ui';
import { Copy, Check, FileText, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { copyToClipboard } from '../../../utils/fileOutput';
import { useTerminal } from '../../../contexts/TerminalContext';

interface PromptHelperProps {
  prompt: string;
  documentName: string;
  fileName: string;
  title: string;
  description: string;
  iconColor?: string;
}

export function PromptHelper({
  prompt,
  documentName,
  fileName,
  title,
  description,
  iconColor = 'amber',
}: PromptHelperProps) {
  const [copied, setCopied] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedGuidePath, setCopiedGuidePath] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { workingDirectory } = useTerminal();

  const handleCopyPrompt = async () => {
    const success = await copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyPath = async () => {
    const path = workingDirectory 
      ? `${workingDirectory}/${fileName}`
      : fileName;
    const success = await copyToClipboard(path);
    if (success) {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    }
  };

  const handleCopyGuidePath = async () => {
    const guidePath = 'guides/DougHub_Project_Setup_Guide.md';
    const success = await copyToClipboard(guidePath);
    if (success) {
      setCopiedGuidePath(true);
      setTimeout(() => setCopiedGuidePath(false), 2000);
    }
  };

  const filePath = workingDirectory 
    ? `${workingDirectory}/${fileName}`
    : fileName;

  const guidePath = 'guides/DougHub_Project_Setup_Guide.md';

  const iconColors = {
    amber: 'from-amber-600 to-orange-600',
    blue: 'from-blue-600 to-cyan-600',
    green: 'from-green-600 to-emerald-600',
  };

  const borderColors = {
    amber: 'border-amber-700/50',
    blue: 'border-blue-700/50',
    green: 'border-green-700/50',
  };

  const bgColors = {
    amber: 'from-amber-900/20 to-primary-900/50',
    blue: 'from-blue-900/20 to-primary-900/50',
    green: 'from-green-900/20 to-primary-900/50',
  };

  return (
    <div className={`mb-4 p-4 bg-gradient-to-br ${bgColors[iconColor as keyof typeof bgColors]} border ${borderColors[iconColor as keyof typeof borderColors]} rounded-lg`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 bg-gradient-to-br ${iconColors[iconColor as keyof typeof iconColors]} rounded-lg flex-shrink-0`}>
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-primary-100 mb-1">
                {title}
              </h3>
              <p className="text-xs text-primary-400">
                {description}
              </p>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary-400 hover:text-primary-300 flex-shrink-0 ml-2"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Copy Prompt Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyPrompt}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-300" />
                  Prompt Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Prompt to Clipboard
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="p-3 bg-primary-900/50 border border-primary-700/50 rounded text-xs text-primary-300 space-y-2">
            <div className="flex items-start gap-2">
              <span className={`font-semibold ${iconColor === 'amber' ? 'text-amber-400' : iconColor === 'blue' ? 'text-blue-400' : 'text-green-400'}`}>1.</span>
              <span>Click the button above to copy the prompt, then paste it into Claude (or any AI assistant)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className={`font-semibold ${iconColor === 'amber' ? 'text-amber-400' : iconColor === 'blue' ? 'text-blue-400' : 'text-green-400'}`}>2.</span>
              <span>Answer the AI's clarifying questions as it guides you through each section</span>
            </div>
            <div className="flex items-start gap-2">
              <span className={`font-semibold ${iconColor === 'amber' ? 'text-amber-400' : iconColor === 'blue' ? 'text-blue-400' : 'text-green-400'}`}>3.</span>
              <span>When complete, the AI will generate your <code className="bg-primary-800 px-1 py-0.5 rounded">{fileName}</code> file</span>
            </div>
          </div>

          {/* File Path Section */}
          <div className="pt-3 border-t border-primary-700/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-medium text-primary-300">
                File path for reference:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-2 py-1.5 bg-primary-900 border border-primary-700 rounded text-xs text-primary-200 font-mono">
                {filePath}
              </code>
              <Button
                onClick={handleCopyPath}
                variant="ghost"
                size="sm"
                title="Copy file path"
              >
                {copiedPath ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Guide Path Section */}
          <div className="pt-3 border-t border-primary-700/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-medium text-primary-300">
                Guide reference path:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-2 py-1.5 bg-primary-900 border border-primary-700 rounded text-xs text-primary-200 font-mono">
                {guidePath}
              </code>
              <Button
                onClick={handleCopyGuidePath}
                variant="ghost"
                size="sm"
                title="Copy guide path"
              >
                {copiedGuidePath ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-primary-500 mt-2">
              Reference this guide path when working with Claude. The guide contains templates and examples for {documentName}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

