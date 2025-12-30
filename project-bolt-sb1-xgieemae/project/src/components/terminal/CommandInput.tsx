import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { validateCommand, ValidationResult } from '../../utils/commandValidation';

interface CommandInputProps {
  onExecute: (command: string) => void;
  onNavigateHistory: (direction: 'up' | 'down') => string;
  isExecuting: boolean;
  fontSize: number;
  initialCommand?: string;
}

export function CommandInput({ onExecute, onNavigateHistory, isExecuting, fontSize, initialCommand }: CommandInputProps) {
  const [input, setInput] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (initialCommand) {
      setInput(initialCommand);
      inputRef.current?.focus();
    }
  }, [initialCommand]);

  useEffect(() => {
    if (input.trim()) {
      const result = validateCommand(input);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const cmd = onNavigateHistory('up');
      if (cmd) setInput(cmd);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const cmd = onNavigateHistory('down');
      setInput(cmd);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setInput('');
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isExecuting) return;

    const result = validateCommand(input);

    if (result.isDangerous) {
      alert(result.warningMessage || 'This command is not allowed');
      return;
    }

    if (result.needsConfirmation) {
      const confirmed = window.confirm(
        `${result.warningMessage}\n\nDo you want to proceed?`
      );
      if (!confirmed) return;
    }

    if (input.trim().toLowerCase() === 'clear') {
      setInput('');
      return;
    }

    onExecute(input);
    setInput('');
    setValidation(null);
  };

  return (
    <div className="border-t border-gray-700">
      {validation?.warningMessage && validation.category !== 'safe' && (
        <div className={`px-4 py-2 flex items-start gap-2 text-xs ${
          validation.isDangerous
            ? 'bg-red-900/20 text-red-400 border-b border-red-800'
            : 'bg-yellow-900/20 text-yellow-400 border-b border-yellow-800'
        }`}>
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>{validation.warningMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        <span className="text-green-400 font-mono flex-shrink-0">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command or 'help' for available commands..."
          disabled={isExecuting}
          className="flex-1 bg-transparent border-none outline-none text-green-300 font-mono placeholder-gray-600 disabled:opacity-50"
          style={{ fontSize: `${fontSize}px` }}
        />
        <button
          onClick={handleSubmit}
          disabled={isExecuting || !input.trim() || validation?.isDangerous}
          className="p-2 rounded bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Execute command (Enter)"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
