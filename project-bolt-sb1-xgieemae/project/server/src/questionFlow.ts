/**
 * Question Flow Manager
 * Manages structured question-answer flow with minimal tokens
 */

import type { DocumentType, Question } from './types';

// Simplified context building (minimal implementation)
function buildMinimalContext(
  currentContent: string,
  docType: DocumentType
): string {
  const parts: string[] = [];
  parts.push(`You're helping refine a ${docType === 'vision' ? 'vision document' : docType === 'userProfile' ? 'user profile' : 'success metrics'} using DH guide structure.`);
  parts.push(`\nCurrent content:\n${currentContent.substring(0, 500)}`);
  parts.push(`\nTask: Ask clarifying multiple-choice questions to improve specificity. Be token-efficient.`);
  return parts.join('\n');
}

interface QuestionContext {
  docType: DocumentType;
  currentContent: string;
  answers: Record<string, string>;
  askedQuestions: Set<string>;
}

/**
 * Generate next question based on context and current content
 */
export function generateQuestion(context: QuestionContext): Question | null {
  const { docType, currentContent, answers, askedQuestions } = context;
  
  // Simple question generation logic
  // In a real implementation, this would use Gemini API to generate questions
  // For now, return predefined questions based on document type
  
  const questionId = `q-${askedQuestions.size + 1}`;
  
  if (docType === 'vision') {
    if (!askedQuestions.has('problem') && !currentContent.includes('Problem')) {
      return {
        id: 'problem',
        text: 'What specific problem are you solving?',
        type: 'multiple-choice',
        choices: [
          'Time-consuming manual process',
          'Lack of existing tools',
          'Inefficient workflow',
          'Other specific problem',
        ],
        required: true,
        context: 'Problem Statement',
      };
    }
    
    if (!askedQuestions.has('target_user') && !currentContent.includes('Target User')) {
      return {
        id: 'target_user',
        text: 'Who exactly will use this software?',
        type: 'multiple-choice',
        choices: [
          'Technical users (developers, engineers)',
          'Business users (managers, analysts)',
          'End consumers',
          'Internal team members',
        ],
        required: true,
        context: 'Target User',
      };
    }
  }
  
  if (docType === 'userProfile') {
    if (!askedQuestions.has('technical_comfort') && !currentContent.includes('Technical Comfort')) {
      return {
        id: 'technical_comfort',
        text: 'What is the user\'s technical comfort level?',
        type: 'multiple-choice',
        choices: [
          'Low - Needs simple, guided interfaces',
          'Medium - Comfortable with standard apps',
          'High - Can handle advanced features',
        ],
        required: true,
        context: 'Technical Comfort',
      };
    }
  }
  
  // No more questions
  return null;
}

/**
 * Process answer and update context
 */
export function processAnswer(
  questionId: string,
  answer: string,
  context: QuestionContext
): QuestionContext {
  return {
    ...context,
    answers: {
      ...context.answers,
      [questionId]: answer,
    },
    askedQuestions: new Set([...context.askedQuestions, questionId]),
  };
}

/**
 * Check completeness (0-100%)
 */
export function checkCompleteness(context: QuestionContext): number {
  const { docType, answers } = context;
  
  // Simple completeness calculation
  // In a real implementation, this would analyze content quality
  const requiredQuestions: Record<DocumentType, string[]> = {
    vision: ['problem', 'target_user'],
    userProfile: ['technical_comfort'],
    metrics: [],
  };
  
  const required = requiredQuestions[docType];
  const answered = required.filter(q => answers[q]);
  
  return required.length > 0 ? (answered.length / required.length) * 100 : 100;
}

/**
 * Format question as multiple-choice
 */
export function formatQuestionAsChoices(question: Question): string {
  return question.choices
    .map((choice, idx) => `${idx + 1}. ${choice}`)
    .join('\n');
}

