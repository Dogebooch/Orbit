import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  BarChart3,
  Wand2,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from './Button';
import { useTerminal } from '../../contexts/TerminalContext';
import { getHelperPrompt, type PromptContext } from '../../lib/promptConfig';
import type { ContentType, EvaluationResult } from '../../lib/gemini';
import { GeminiTerminalModal } from '../stages/vision/GeminiTerminalModal';
import type { DocumentType } from '../../lib/foundationContext';

interface AIHelperButtonProps {
  content: string;
  contentType: ContentType;
  onImprove?: (improvedContent: string) => void;
  fieldLabel?: string;
  className?: string;
  disabled?: boolean;
}

type AIAction = 'suggestions' | 'evaluate' | 'improve';

interface ActionState {
  loading: boolean;
  error: string | null;
  suggestions: string[] | null;
  evaluation: EvaluationResult | null;
  improvedContent: string | null;
}

export function AIHelperButton({
  content,
  contentType,
  onImprove,
  fieldLabel = 'content',
  className = '',
  disabled = false,
}: AIHelperButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [state, setState] = useState<ActionState>({
    loading: false,
    error: null,
    suggestions: null,
    evaluation: null,
    improvedContent: null,
  });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { wsClient, isBackendConnected, geminiStatus } = useTerminal();
  const isReady = isBackendConnected && geminiStatus === 'ready';
  
  // Check if this is a Foundation document type
  const isFoundationDoc = contentType === 'vision' || contentType === 'userProfile';
  const docType: DocumentType | null = contentType === 'vision' ? 'vision' : contentType === 'userProfile' ? 'userProfile' : null;

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = async (action: AIAction) => {
    if (!isReady || !wsClient) {
      setState((prev) => ({ ...prev, error: 'Backend not connected or AI assistant not ready.' }));
      return;
    }
    if (!content.trim()) {
      setState((prev) => ({ ...prev, error: `Please enter some ${fieldLabel} first.` }));
      return;
    }

    setActiveAction(action);
    setState({
      loading: true,
      error: null,
      suggestions: null,
      evaluation: null,
      improvedContent: null,
    });

    try {
      // Build prompt using helper function
      const prompt = getHelperPrompt(action, contentType, content);

      // Send directly via WebSocket
      const requestId = `ai-helper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      wsClient.send({
        type: 'gemini:send',
        prompt,
        requestId,
      });
      
      // Close popover - response will appear in terminal or be handled by backend
      setIsOpen(false);
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('AI action failed:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  const handleApplyImprovement = () => {
    if (state.improvedContent && onImprove) {
      onImprove(state.improvedContent);
      setIsOpen(false);
      setState({
        loading: false,
        error: null,
        suggestions: null,
        evaluation: null,
        improvedContent: null,
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400 bg-green-900/30 border-green-700/50';
    if (score >= 6) return 'text-amber-400 bg-amber-900/30 border-amber-700/50';
    return 'text-red-400 bg-red-900/30 border-red-700/50';
  };

  const handleButtonClick = () => {
    if (isFoundationDoc && docType) {
      // Open Gemini Terminal Modal for Foundation documents
      setIsModalOpen(true);
    } else {
      // Use existing popover for other content types
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={disabled}
        className={`p-1.5 rounded-lg transition-all ${
          isOpen || isModalOpen
            ? 'bg-purple-600 text-white'
            : 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 hover:text-purple-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isFoundationDoc ? "Gemini CLI Assistant" : "AI Assistant"}
      >
        <Sparkles className="w-4 h-4" />
      </button>

      {/* Gemini Terminal Modal for Foundation documents */}
      {isFoundationDoc && docType && (
        <GeminiTerminalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          docType={docType}
          currentContent={content}
          onApplyImprovements={onImprove}
        />
      )}

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute z-50 top-full mt-2 right-0 w-80 bg-primary-900 border border-primary-700 rounded-xl shadow-2xl animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-primary-100">AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-primary-400 hover:text-primary-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Not Ready Warning */}
          {!isReady && (
            <div className="p-4">
              <div className="flex items-start gap-3 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-200 mb-2">
                    {!isBackendConnected 
                      ? 'Backend server not connected. Please start the backend server.'
                      : 'AI assistant is initializing. Please wait...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isReady && (
            <div className="p-3 space-y-2">
              <button
                onClick={() => handleAction('suggestions')}
                disabled={state.loading}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeAction === 'suggestions'
                    ? 'bg-blue-900/30 border border-blue-700/50'
                    : 'bg-primary-800/50 hover:bg-primary-800 border border-transparent'
                }`}
              >
                <Lightbulb className="w-5 h-5 text-blue-400" />
                <div className="text-left flex-1">
                  <span className="text-sm font-medium text-primary-100">Get Suggestions</span>
                  <p className="text-xs text-primary-400">Specific ways to improve</p>
                </div>
                {state.loading && activeAction === 'suggestions' && (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                )}
              </button>

              <button
                onClick={() => handleAction('evaluate')}
                disabled={state.loading}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeAction === 'evaluate'
                    ? 'bg-amber-900/30 border border-amber-700/50'
                    : 'bg-primary-800/50 hover:bg-primary-800 border border-transparent'
                }`}
              >
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <div className="text-left flex-1">
                  <span className="text-sm font-medium text-primary-100">Evaluate Writing</span>
                  <p className="text-xs text-primary-400">Score and feedback</p>
                </div>
                {state.loading && activeAction === 'evaluate' && (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                )}
              </button>

              <button
                onClick={() => handleAction('improve')}
                disabled={state.loading}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeAction === 'improve'
                    ? 'bg-green-900/30 border border-green-700/50'
                    : 'bg-primary-800/50 hover:bg-primary-800 border border-transparent'
                }`}
              >
                <Wand2 className="w-5 h-5 text-green-400" />
                <div className="text-left flex-1">
                  <span className="text-sm font-medium text-primary-100">Auto-Improve</span>
                  <p className="text-xs text-primary-400">AI-enhanced rewrite</p>
                </div>
                {state.loading && activeAction === 'improve' && (
                  <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {!state.loading && (state.suggestions || state.evaluation || state.improvedContent || state.error) && (
            <div className="border-t border-primary-700 p-4 max-h-64 overflow-y-auto">
              {/* Error */}
              {state.error && (
                <div className="flex items-start gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{state.error}</p>
                </div>
              )}

              {/* Suggestions */}
              {state.suggestions && state.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-primary-400 uppercase tracking-wide">
                    Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {state.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-primary-200">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evaluation */}
              {state.evaluation && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1.5 rounded-lg border text-lg font-bold ${getScoreColor(
                        state.evaluation.score
                      )}`}
                    >
                      {state.evaluation.score}/10
                    </div>
                    <span className="text-sm text-primary-300">Quality Score</span>
                  </div>

                  {state.evaluation.strengths.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-green-400 mb-1">Strengths</h5>
                      <ul className="space-y-1">
                        {state.evaluation.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-primary-300">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {state.evaluation.weaknesses.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-amber-400 mb-1">Areas to Improve</h5>
                      <ul className="space-y-1">
                        {state.evaluation.weaknesses.map((w, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-primary-300">
                            <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-primary-400 italic">{state.evaluation.overallFeedback}</p>
                </div>
              )}

              {/* Improved Content */}
              {state.improvedContent && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-primary-400 uppercase tracking-wide">
                    Improved Version
                  </h4>
                  <div className="p-3 bg-primary-800/50 rounded-lg border border-primary-700 max-h-32 overflow-y-auto">
                    <p className="text-sm text-primary-200 whitespace-pre-wrap">
                      {state.improvedContent}
                    </p>
                  </div>
                  {onImprove && (
                    <Button onClick={handleApplyImprovement} className="w-full">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Apply Improvement
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

