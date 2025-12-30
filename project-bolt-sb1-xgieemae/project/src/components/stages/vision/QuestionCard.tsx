import React from 'react';
import { CheckCircle } from 'lucide-react';

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'yes-no' | 'scale';
  choices: string[];
  required: boolean;
  context: string;
}

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: string;
  onAnswer: (questionId: string, answer: string) => void;
}

export function QuestionCard({ question, selectedAnswer, onAnswer }: QuestionCardProps) {
  const handleChoiceClick = (choice: string) => {
    onAnswer(question.id, choice);
  };

  return (
    <div className="bg-primary-800/50 border border-primary-700 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-primary-400 uppercase tracking-wide">
              {question.context}
            </span>
            {question.required && (
              <span className="text-xs text-red-400">Required</span>
            )}
          </div>
          <p className="text-sm font-medium text-primary-100 mb-3">{question.text}</p>
        </div>
        {selectedAnswer && (
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
        )}
      </div>

      <div className="space-y-2">
        {question.type === 'multiple-choice' && (
          <>
            {question.choices.map((choice, idx) => {
              const isSelected = selectedAnswer === choice;
              return (
                <button
                  key={idx}
                  onClick={() => handleChoiceClick(choice)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-purple-900/30 border-purple-700 text-purple-200'
                      : 'bg-primary-900/50 border-primary-700 text-primary-300 hover:bg-primary-800 hover:border-primary-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-sm">{choice}</span>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {question.type === 'yes-no' && (
          <div className="flex gap-2">
            {['Yes', 'No'].map((choice) => {
              const isSelected = selectedAnswer === choice;
              return (
                <button
                  key={choice}
                  onClick={() => handleChoiceClick(choice)}
                  className={`flex-1 px-4 py-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? choice === 'Yes'
                        ? 'bg-green-900/30 border-green-700 text-green-200'
                        : 'bg-red-900/30 border-red-700 text-red-200'
                      : 'bg-primary-900/50 border-primary-700 text-primary-300 hover:bg-primary-800'
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'scale' && (
          <div className="flex gap-2">
            {question.choices.map((choice, idx) => {
              const isSelected = selectedAnswer === choice;
              return (
                <button
                  key={idx}
                  onClick={() => handleChoiceClick(choice)}
                  className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm ${
                    isSelected
                      ? 'bg-purple-900/30 border-purple-700 text-purple-200'
                      : 'bg-primary-900/50 border-primary-700 text-primary-300 hover:bg-primary-800'
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

