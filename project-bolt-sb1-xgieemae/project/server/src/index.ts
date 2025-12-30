/**
 * Orbit Terminal Server
 * Express + WebSocket server for terminal and Gemini CLI integration
 */

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import dotenv from 'dotenv';
import { Terminal } from './terminal';
import {
  handleGeminiTerminalStart,
  handleGeminiTerminalInput,
  handleGeminiTerminalResize,
  handleGeminiQuestionAnswer,
  handleGeminiGetImprovements,
  handleGeminiTerminalClose,
} from './geminiHandler';
import {
  createConnection,
  getConnection,
  removeConnection,
  setTerminalSession,
} from './sessions';
import type { ClientMessage, ServerMessage, TerminalSession } from './types';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket server
const wss = new WebSocketServer({ server });

// Helper to send message to client
function sendMessage(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket) => {
  const connectionId = createConnection(ws);
  console.log(`[Server] New WebSocket connection: ${connectionId}`);

  // Send connection status
  sendMessage(ws, {
    type: 'connection:status',
    connected: true,
  });

  // Handle incoming messages
  ws.on('message', (data: Buffer) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());
      handleMessage(connectionId, message, ws);
    } catch (error) {
      console.error('[Server] Error parsing message:', error);
      sendMessage(ws, {
        type: 'error',
        message: 'Invalid message format',
      });
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    console.log(`[Server] WebSocket disconnected: ${connectionId}`);
    removeConnection(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`[Server] WebSocket error for ${connectionId}:`, error);
    removeConnection(connectionId);
  });
});

// Message handler
function handleMessage(connectionId: string, message: ClientMessage, ws: WebSocket): void {
  const connection = getConnection(connectionId);
  if (!connection) {
    console.error(`[Server] Connection ${connectionId} not found`);
    return;
  }

  switch (message.type) {
    // Regular terminal messages
    case 'terminal:input': {
      if (connection.terminalSession) {
        connection.terminalSession.pty.write(message.data || '');
      } else {
        // Create new terminal session if it doesn't exist
        const terminal = new Terminal();
        terminal.spawn(80, 24);
        const pty = terminal.getPty();
        
        if (pty) {
          pty.onData((data: string) => {
            sendMessage(ws, {
              type: 'terminal:output',
              data,
            });
          });

          pty.onExit((code: number) => {
            sendMessage(ws, {
              type: 'terminal:exit',
              code,
            });
          });

          const session: TerminalSession = {
            id: connectionId,
            ws,
            pty,
            workingDirectory: process.cwd(),
            type: 'terminal',
          };

          setTerminalSession(connectionId, session);
          sendMessage(ws, { type: 'terminal:ready' });
          
          // Write the input that triggered this
          if (message.data) {
            pty.write(message.data);
          }
        }
      }
      break;
    }

    case 'terminal:resize': {
      if (connection.terminalSession && message.cols && message.rows) {
        connection.terminalSession.pty.resize(message.cols, message.rows);
      }
      break;
    }

    case 'config:setWorkingDir': {
      if (connection.terminalSession && message.path) {
        connection.terminalSession.workingDirectory = message.path;
        connection.terminalSession.pty.write(
          process.platform === 'win32' ? `cd "${message.path}"\r` : `cd "${message.path}"\n`
        );
        sendMessage(ws, {
          type: 'config:workingDir',
          path: message.path,
        });
      }
      break;
    }

    // Gemini terminal messages
    case 'gemini:terminal:start': {
      if (message.docType && message.currentContent !== undefined) {
        handleGeminiTerminalStart(
          connectionId,
          message.docType,
          message.currentContent,
          process.env.GEMINI_API_KEY,
          (msg) => sendMessage(ws, msg as ServerMessage)
        );
      }
      break;
    }

    case 'gemini:terminal:input': {
      if (message.data) {
        handleGeminiTerminalInput(connectionId, message.data);
      }
      break;
    }

    case 'gemini:terminal:resize': {
      if (message.cols && message.rows) {
        handleGeminiTerminalResize(connectionId, message.cols, message.rows);
      }
      break;
    }

    case 'gemini:question:answer': {
      if (message.questionId && message.answer) {
        handleGeminiQuestionAnswer(
          connectionId,
          message.questionId,
          message.answer,
          (msg) => sendMessage(ws, msg as ServerMessage)
        );
      }
      break;
    }

    case 'gemini:get:improvements': {
      handleGeminiGetImprovements(
        connectionId,
        (msg) => sendMessage(ws, msg as ServerMessage)
      );
      break;
    }

    case 'gemini:terminal:close': {
      handleGeminiTerminalClose(connectionId);
      break;
    }

    // Legacy Gemini API messages (for backward compatibility)
    case 'gemini:send': {
      // This is handled by the old API system, just acknowledge
      sendMessage(ws, {
        type: 'gemini:status',
        status: 'ready',
      });
      break;
    }

    default:
      console.log(`[Server] Unknown message type: ${message.type}`);
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`[Server] Orbit Terminal Server running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  console.log(`[Server] WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  wss.close(() => {
    server.close(() => {
      console.log('[Server] Shutdown complete');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully...');
  wss.close(() => {
    server.close(() => {
      console.log('[Server] Shutdown complete');
      process.exit(0);
    });
  });
});

