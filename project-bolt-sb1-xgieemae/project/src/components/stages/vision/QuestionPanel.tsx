import { QuestionCard, type Question } from './QuestionCard';
import { Loader2, CheckCircle } from 'lucide-react';

interface QuestionPanelProps {
  questions: Question[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  isLoading?: boolean;
  completeness?: number;
}

export function QuestionPanel({
  questions,
  answers,
  onAnswer,
  isLoading = false,
  completeness = 0,
}: QuestionPanelProps) {
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary-100">Clarifying Questions</h3>
          <p className="text-sm text-primary-400">
            {answeredCount} of {totalQuestions} answered
          </p>
        </div>
        {completeness > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-primary-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="text-sm text-primary-400">{Math.round(completeness)}%</span>
          </div>
        )}
      </div>

      {/* Questions */}
      {isLoading && questions.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          <span className="ml-2 text-sm text-primary-400">Generating questions...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-primary-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
          <p className="text-sm">All questions answered!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              selectedAnswer={answers[question.id]}
              onAnswer={onAnswer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

