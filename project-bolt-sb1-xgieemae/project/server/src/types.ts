/**
 * Type definitions for WebSocket messages and sessions
 */

import type { WebSocket } from 'ws';

// Local type definitions (duplicated from frontend to avoid runtime dependencies)
export type DocumentType = 'vision' | 'userProfile' | 'metrics';

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'yes-no' | 'scale';
  choices: string[];
  required: boolean;
  context: string;
}

// WebSocket message types from client
export interface ClientMessage {
  type: string;
  data?: string;
  cols?: number;
  rows?: number;
  path?: string;
  docType?: DocumentType;
  currentContent?: string;
  questionId?: string;
  answer?: string;
  requestId?: string;
  prompt?: string;
}

// WebSocket message types to client
export interface ServerMessage {
  type: string;
  data?: string;
  code?: number;
  path?: string;
  event?: 'add' | 'change' | 'unlink';
  connected?: boolean;
  message?: string;
  response?: string;
  error?: string;
  requestId?: string;
  status?: 'initializing' | 'ready' | 'error';
  question?: Question;
  questionId?: string;
  answer?: string;
  completeness?: number;
  improvements?: string;
}

// Session types
export interface TerminalSession {
  id: string;
  ws: WebSocket;
  pty: any; // node-pty IPty type
  workingDirectory: string;
  type: 'terminal' | 'gemini';
}

export interface GeminiSession {
  id: string;
  ws: WebSocket;
  terminal: any; // GeminiTerminal instance
  docType: DocumentType;
  currentContent: string;
  context: {
    answers: Record<string, string>;
    askedQuestions: Set<string>;
  };
}

// Re-export for convenience
export type { Question };

// Connection info
export interface ConnectionInfo {
  id: string;
  ws: WebSocket;
  terminalSession?: TerminalSession;
  geminiSession?: GeminiSession;
  connectedAt: Date;
}

