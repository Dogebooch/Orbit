import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { QuestionPanel } from './QuestionPanel';
import { XTerminal } from '../../terminal/XTerminal';
import { useTerminal } from '../../../contexts/TerminalContext';
import { Sparkles, Wand2, Loader2, AlertTriangle } from 'lucide-react';
import type { DocumentType } from '../../../lib/foundationContext';
import type { Question } from './QuestionCard';

interface GeminiTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: DocumentType;
  currentContent: string;
  onApplyImprovements?: (improvedContent: string) => void;
}

export function GeminiTerminalModal({
  isOpen,
  onClose,
  docType,
  currentContent,
  onApplyImprovements,
}: GeminiTerminalModalProps) {
  const { wsClient, isBackendConnected, geminiTerminalReady, geminiQuestions, geminiAnswers, geminiCompleteness, startGeminiSession, sendGeminiQuestion, getGeminiImprovements, closeGeminiSession, setOnGeminiTerminalOutput } = useTerminal();
  
  const [isStarting, setIsStarting] = useState(false);
  const [improvements, setImprovements] = useState<string | null>(null);
  const [isLoadingImprovements, setIsLoadingImprovements] = useState(false);
  const xtermRef = useRef<any>(null);

  // Set up terminal output callback
  useEffect(() => {
    if (isOpen && xtermRef.current) {
      const handleTerminalOutput = (data: string) => {
        if (xtermRef.current?.terminalWrite) {
          xtermRef.current.terminalWrite(data);
        }
      };
      
      // Set the callback in TerminalContext for Gemini terminal
      setOnGeminiTerminalOutput(handleTerminalOutput);
      
      return () => {
        setOnGeminiTerminalOutput(() => {});
      };
    }
  }, [isOpen, setOnGeminiTerminalOutput]);

  // Initialize session when modal opens
  useEffect(() => {
    if (isOpen && !geminiTerminalReady && wsClient && isBackendConnected) {
      setIsStarting(true);
      startGeminiSession(docType, currentContent);
      // Reset starting state after a moment
      setTimeout(() => setIsStarting(false), 2000);
    }
  }, [isOpen, geminiTerminalReady, wsClient, isBackendConnected, docType, currentContent, startGeminiSession]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      closeGeminiSession();
      setImprovements(null);
    }
  }, [isOpen, closeGeminiSession]);

  const handleAnswer = (questionId: string, answer: string) => {
    sendGeminiQuestion(questionId, answer);
  };

  const handleGetImprovements = async () => {
    setIsLoadingImprovements(true);
    try {
      const improved = await getGeminiImprovements();
      if (improved) {
        setImprovements(improved);
      }
    } catch (error) {
      console.error('Failed to get improvements:', error);
    } finally {
      setIsLoadingImprovements(false);
    }
  };

  const handleApply = () => {
    if (improvements && onApplyImprovements) {
      onApplyImprovements(improvements);
      onClose();
    }
  };

  const handleTerminalData = (data: string) => {
    if (wsClient) {
      wsClient.send({
        type: 'gemini:terminal:input',
        data,
      });
    }
  };

  const handleTerminalResize = (cols: number, rows: number) => {
    if (wsClient) {
      wsClient.send({
        type: 'gemini:terminal:resize',
        cols,
        rows,
      });
    }
  };

  const isComplete = geminiCompleteness >= 80;
  const hasQuestions = geminiQuestions && geminiQuestions.length > 0;
  const allAnswered = hasQuestions && geminiQuestions.every(q => geminiAnswers[q.id]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gemini AI Assistant"
      size="xl"
    >
      <div className="flex flex-col h-full space-y-4" style={{ minHeight: '600px' }}>
        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-primary-800/50 rounded-lg border border-primary-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-primary-300">
              {isStarting
                ? 'Starting Gemini CLI...'
                : !isBackendConnected
                ? 'Backend not connected'
                : !geminiTerminalReady
                ? 'Initializing...'
                : `Working on ${docType === 'vision' ? 'Vision' : docType === 'userProfile' ? 'User Profile' : 'Success Metrics'}`}
            </span>
          </div>
          {isComplete && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span>Ready for improvements</span>
            </div>
          )}
        </div>

        {/* Question Panel */}
        {hasQuestions && (
          <div className="flex-shrink-0">
            <QuestionPanel
              questions={geminiQuestions}
              answers={geminiAnswers}
              onAnswer={handleAnswer}
              completeness={geminiCompleteness}
            />
          </div>
        )}

        {/* Terminal */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary-300">Terminal Output</span>
            {allAnswered && !improvements && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleGetImprovements}
                disabled={isLoadingImprovements}
              >
                {isLoadingImprovements ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Get Improvements
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex-1 min-h-0 border border-primary-700 rounded-lg overflow-hidden bg-primary-950">
            {isBackendConnected && geminiTerminalReady ? (
              <XTerminal
                ref={xtermRef}
                onData={handleTerminalData}
                onResize={handleTerminalResize}
                fontSize={14}
                colorScheme="dark"
              />
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-primary-400">
                    {!isBackendConnected
                      ? 'Backend server not connected'
                      : 'Waiting for Gemini CLI to initialize...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Improvements Preview */}
        {improvements && (
          <div className="flex-shrink-0 border-t border-primary-700 pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-primary-100">Improved Content</h4>
                <Button variant="primary" size="sm" onClick={handleApply}>
                  Apply to Document
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto p-4 bg-primary-900/50 rounded-lg border border-primary-700">
                <pre className="text-xs text-primary-200 whitespace-pre-wrap font-mono">
                  {improvements}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-primary-700">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

