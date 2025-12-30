/**
 * Gemini Terminal Integration Example
 * 
 * This file shows how to integrate Gemini terminal handlers into your existing WebSocket server.
 * 
 * Add these handlers to your WebSocket message handler:
 */

import {
  handleGeminiTerminalStart,
  handleGeminiTerminalInput,
  handleGeminiTerminalResize,
  handleGeminiQuestionAnswer,
  handleGeminiGetImprovements,
  handleGeminiTerminalClose,
} from './geminiHandler';

/**
 * Example WebSocket message handler integration:
 * 
 * ws.on('message', (message: string) => {
 *   const data = JSON.parse(message);
 *   
 *   switch (data.type) {
 *     case 'gemini:terminal:start':
 *       const sessionId = `gemini-${Date.now()}`;
 *       handleGeminiTerminalStart(
 *         sessionId,
 *         data.docType,
 *         data.currentContent,
 *         process.env.GEMINI_API_KEY,
 *         (msg) => ws.send(JSON.stringify(msg))
 *       );
 *       break;
 *       
 *     case 'gemini:terminal:input':
 *       handleGeminiTerminalInput(sessionId, data.data);
 *       break;
 *       
 *     case 'gemini:terminal:resize':
 *       handleGeminiTerminalResize(sessionId, data.cols, data.rows);
 *       break;
 *       
 *     case 'gemini:question:answer':
 *       handleGeminiQuestionAnswer(sessionId, data.questionId, data.answer);
 *       break;
 *       
 *     case 'gemini:get:improvements':
 *       handleGeminiGetImprovements(sessionId);
 *       break;
 *       
 *     case 'gemini:terminal:close':
 *       handleGeminiTerminalClose(sessionId);
 *       break;
 *   }
 * });
 */

