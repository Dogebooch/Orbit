/**
 * Session management for WebSocket connections
 */

import type { WebSocket } from 'ws';
import type { ConnectionInfo, TerminalSession, GeminiSession } from './types';

const connections = new Map<string, ConnectionInfo>();

/**
 * Generate unique connection ID
 */
export function generateConnectionId(): string {
  return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create new connection
 */
export function createConnection(ws: WebSocket): string {
  const id = generateConnectionId();
  const connection: ConnectionInfo = {
    id,
    ws,
    connectedAt: new Date(),
  };
  connections.set(id, connection);
  return id;
}

/**
 * Get connection by ID
 */
export function getConnection(id: string): ConnectionInfo | undefined {
  return connections.get(id);
}

/**
 * Set terminal session for connection
 */
export function setTerminalSession(connectionId: string, session: TerminalSession): void {
  const connection = connections.get(connectionId);
  if (connection) {
    connection.terminalSession = session;
  }
}

/**
 * Set Gemini session for connection
 */
export function setGeminiSession(connectionId: string, session: GeminiSession): void {
  const connection = connections.get(connectionId);
  if (connection) {
    connection.geminiSession = session;
  }
}

/**
 * Remove connection and cleanup sessions
 */
export function removeConnection(id: string): void {
  const connection = connections.get(id);
  if (connection) {
    // Cleanup terminal session
    if (connection.terminalSession?.pty) {
      try {
        connection.terminalSession.pty.kill();
      } catch (error) {
        console.error(`[Sessions] Error killing terminal PTY:`, error);
      }
    }

    // Cleanup Gemini session
    if (connection.geminiSession?.terminal) {
      try {
        connection.geminiSession.terminal.kill();
      } catch (error) {
        console.error(`[Sessions] Error killing Gemini terminal:`, error);
      }
    }

    connections.delete(id);
  }
}

/**
 * Get all connections (for debugging)
 */
export function getAllConnections(): ConnectionInfo[] {
  return Array.from(connections.values());
}

/**
 * Find connection by WebSocket
 */
export function findConnectionByWebSocket(ws: WebSocket): ConnectionInfo | undefined {
  return Array.from(connections.values()).find(conn => conn.ws === ws);
}

