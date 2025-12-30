/**
 * Gemini Handler
 * Handles WebSocket messages for Gemini terminal
 */

import { GeminiTerminal } from './geminiTerminal';
import { generateQuestion, checkCompleteness } from './questionFlow';
import { buildContext } from './contextBuilder';
import { getConnection, setGeminiSession } from './sessions';
import type { DocumentType, GeminiSession } from './types';

export function handleGeminiTerminalStart(
  connectionId: string,
  docType: DocumentType,
  currentContent: string,
  apiKey: string | undefined,
  sendMessage: (message: unknown) => void
): void {
  const connection = getConnection(connectionId);
  if (!connection) {
    console.error(`[Gemini] Connection ${connectionId} not found`);
    return;
  }

  // Create Gemini terminal
  const terminal = new GeminiTerminal({
    apiKey,
    workingDir: process.cwd(),
  });

  // Spawn terminal
  terminal.spawn(80, 24);

  // Set up data handler
  const pty = terminal.getPty();
  if (pty) {
    pty.onData((data: string) => {
      sendMessage({
        type: 'gemini:terminal:output',
        data,
      });
    });

    pty.onExit(() => {
      sendMessage({
        type: 'gemini:terminal:exit',
        code: 0,
      });
      // Session cleanup handled by connection cleanup
    });
  }

  // Create session
  const session: GeminiSession = {
    id: connectionId,
    ws: connection.ws,
    terminal,
    docType,
    currentContent,
    context: {
      answers: {},
      askedQuestions: new Set(),
    },
  };

  setGeminiSession(connectionId, session);

  // Send ready status
  sendMessage({
    type: 'gemini:terminal:ready',
  });

  // Generate first question
  generateNextQuestion(connectionId);
}

export function handleGeminiTerminalInput(
  connectionId: string,
  data: string
): void {
  const connection = getConnection(connectionId);
  if (connection?.geminiSession) {
    connection.geminiSession.terminal.write(data);
  }
}

export function handleGeminiTerminalResize(
  connectionId: string,
  cols: number,
  rows: number
): void {
  const connection = getConnection(connectionId);
  if (connection?.geminiSession) {
    connection.geminiSession.terminal.resize(cols, rows);
  }
}

export function handleGeminiQuestionAnswer(
  connectionId: string,
  questionId: string,
  answer: string,
  sendMessage: (message: unknown) => void
): void {
  const connection = getConnection(connectionId);
  if (!connection?.geminiSession) return;

  const session = connection.geminiSession;

  // Process answer
  session.context.answers[questionId] = answer;
  session.context.askedQuestions.add(questionId);

  // Send confirmation
  sendMessage({
    type: 'gemini:question:answered',
    questionId,
    answer,
  });

  // Update completeness
  const completeness = checkCompleteness({
    docType: session.docType,
    currentContent: session.currentContent,
    answers: session.context.answers,
    askedQuestions: session.context.askedQuestions,
  });

  sendMessage({
    type: 'gemini:completeness',
    completeness,
  });

  // Generate next question if not complete
  if (completeness < 80) {
    generateNextQuestion(connectionId, sendMessage);
  } else {
    // Generate improvements when complete
    generateImprovements(connectionId, sendMessage);
  }
}

function generateNextQuestion(connectionId: string, sendMessage: (message: unknown) => void): void {
  const connection = getConnection(connectionId);
  if (!connection?.geminiSession) return;

  const session = connection.geminiSession;

  const question = generateQuestion({
    docType: session.docType,
    currentContent: session.currentContent,
    answers: session.context.answers,
    askedQuestions: session.context.askedQuestions,
  });

  if (question) {
    sendMessage({
      type: 'gemini:question:new',
      question,
    });
  }
}

function generateImprovements(connectionId: string, sendMessage: (message: unknown) => void): void {
  const connection = getConnection(connectionId);
  if (!connection?.geminiSession) return;

  const session = connection.geminiSession;

  // Build context and send to Gemini CLI
  const context = buildContext({
    docType: session.docType,
    currentContent: session.currentContent,
  });

  // In a real implementation, this would send the context to Gemini CLI
  // and get improved content back
  // For now, return a placeholder
  sendMessage({
    type: 'gemini:improvements',
    improvements: session.currentContent, // Placeholder
  });
}

export function handleGeminiGetImprovements(connectionId: string, sendMessage: (message: unknown) => void): void {
  generateImprovements(connectionId, sendMessage);
}

export function handleGeminiTerminalClose(connectionId: string): void {
  const connection = getConnection(connectionId);
  if (connection?.geminiSession) {
    connection.geminiSession.terminal.kill();
    connection.geminiSession = undefined;
  }
}

