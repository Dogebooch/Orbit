import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { TerminalManager } from './terminal.js';
import { FileWatcher } from './watcher.js';
import { TaskMasterSync } from './taskmaster.js';
import type { ClientMessage, ServerMessage, ServerConfig } from './types.js';

const PORT = process.env.PORT || 3001;
const HOST = '127.0.0.1'; // Localhost only for security

// Server configuration
const config: ServerConfig = {
  workingDirectory: process.cwd(),
  watchEnabled: true,
};

// Express app setup
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    workingDirectory: config.workingDirectory,
    timestamp: new Date().toISOString(),
  });
});

// Config endpoint
app.get('/config', (_req, res) => {
  res.json(config);
});

app.post('/config', (req, res) => {
  const { workingDirectory } = req.body;
  if (workingDirectory) {
    config.workingDirectory = workingDirectory;
    res.json({ success: true, config });
  } else {
    res.status(400).json({ error: 'workingDirectory is required' });
  }
});

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

// Track connected clients
const clients = new Set<WebSocket>();

// Broadcast message to all connected clients
function broadcast(message: ServerMessage): void {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Initialize services
let terminal: TerminalManager | null = null;
let fileWatcher: FileWatcher | null = null;
let taskMasterSync: TaskMasterSync | null = null;

function initializeServices(ws: WebSocket): void {
  // Create terminal manager for this connection
  terminal = new TerminalManager(
    (msg) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    config.workingDirectory
  );

  // Create file watcher
  fileWatcher = new FileWatcher((msg) => {
    broadcast(msg);
    // Check if this is a tasks.json change
    if (msg.type === 'file:changed' && taskMasterSync) {
      taskMasterSync.handleFileChange(msg.path);
    }
  });

  // Create TaskMaster sync
  taskMasterSync = new TaskMasterSync(broadcast);
  taskMasterSync.setProjectPath(config.workingDirectory);

  // Start terminal
  terminal.start();

  // Start file watcher if enabled
  if (config.watchEnabled && config.workingDirectory) {
    fileWatcher.start(config.workingDirectory);
    // Initial TaskMaster sync
    taskMasterSync.checkAndSync();
  }
}

function cleanupServices(): void {
  if (terminal) {
    terminal.stop();
    terminal = null;
  }
  if (fileWatcher) {
    fileWatcher.stop();
    fileWatcher = null;
  }
  taskMasterSync = null;
}

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] Client connected');
  clients.add(ws);

  // Send initial connection status
  ws.send(JSON.stringify({
    type: 'connection:status',
    connected: true,
  } satisfies ServerMessage));

  // Send current working directory
  ws.send(JSON.stringify({
    type: 'config:workingDir',
    path: config.workingDirectory,
  } satisfies ServerMessage));

  // Initialize services for this connection
  initializeServices(ws);

  // Handle incoming messages
  ws.on('message', (data: Buffer) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());
      handleClientMessage(message, ws);
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      } satisfies ServerMessage));
    }
  });

  // Handle close
  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
    clients.delete(ws);
    
    // Cleanup if no more clients
    if (clients.size === 0) {
      cleanupServices();
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('[WebSocket] Error:', error);
    clients.delete(ws);
  });
});

function handleClientMessage(message: ClientMessage, ws: WebSocket): void {
  switch (message.type) {
    case 'terminal:input':
      if (terminal) {
        terminal.write(message.data);
      }
      break;

    case 'terminal:resize':
      if (terminal) {
        terminal.resize(message.cols, message.rows);
      }
      break;

    case 'config:setWorkingDir':
      console.log(`[Config] Setting working directory to: ${message.path}`);
      config.workingDirectory = message.path;
      
      // Update terminal working directory
      if (terminal) {
        terminal.setWorkingDirectory(message.path);
      }
      
      // Restart file watcher with new path
      if (fileWatcher) {
        fileWatcher.stop();
        fileWatcher.start(message.path);
      }
      
      // Update TaskMaster path
      if (taskMasterSync) {
        taskMasterSync.setProjectPath(message.path);
        taskMasterSync.checkAndSync();
      }
      
      // Confirm to client
      ws.send(JSON.stringify({
        type: 'config:workingDir',
        path: message.path,
      } satisfies ServerMessage));
      break;

    case 'config:getWorkingDir':
      ws.send(JSON.stringify({
        type: 'config:workingDir',
        path: config.workingDirectory,
      } satisfies ServerMessage));
      break;

    case 'config:createDir':
      try {
        const dirPath = path.join(config.workingDirectory, message.relativePath);
        console.log(`[Config] Creating directory: ${dirPath}`);
        
        // Create directory recursively
        fs.mkdirSync(dirPath, { recursive: true });
        
        ws.send(JSON.stringify({
          type: 'config:writeResult',
          success: true,
          path: message.relativePath,
        } satisfies ServerMessage));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Config] Failed to create directory:', errorMessage);
        ws.send(JSON.stringify({
          type: 'config:writeResult',
          success: false,
          path: message.relativePath,
          error: errorMessage,
        } satisfies ServerMessage));
      }
      break;

    case 'config:writeFile':
      try {
        const filePath = path.join(config.workingDirectory, message.relativePath);
        const dirName = path.dirname(filePath);
        
        console.log(`[Config] Writing file: ${filePath}`);
        
        // Ensure directory exists
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        
        // Write the file
        fs.writeFileSync(filePath, message.content, 'utf-8');
        
        ws.send(JSON.stringify({
          type: 'config:writeResult',
          success: true,
          path: message.relativePath,
        } satisfies ServerMessage));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Config] Failed to write file:', errorMessage);
        ws.send(JSON.stringify({
          type: 'config:writeResult',
          success: false,
          path: message.relativePath,
          error: errorMessage,
        } satisfies ServerMessage));
      }
      break;

    default:
      console.warn('[WebSocket] Unknown message type:', (message as { type: string }).type);
  }
}

// Start server
server.listen(Number(PORT), HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                   Orbit Backend Server                      ║
╠════════════════════════════════════════════════════════════╣
║  Status:    Running                                         ║
║  Address:   http://${HOST}:${PORT}                              ║
║  WebSocket: ws://${HOST}:${PORT}                                ║
║  Working:   ${config.workingDirectory.slice(0, 40).padEnd(40)}║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  cleanupServices();
  wss.close();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Received SIGTERM, shutting down...');
  cleanupServices();
  wss.close();
  server.close();
  process.exit(0);
});

