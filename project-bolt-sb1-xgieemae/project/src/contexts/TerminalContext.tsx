import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from './AppContext';
import { WebSocketClient, getWebSocketClient, disconnectWebSocket, ConnectionStatus } from '../lib/websocket';

// Types for WebSocket messages from server
interface ServerMessage {
  type: string;
  data?: string;
  code?: number;
  path?: string;
  event?: 'add' | 'change' | 'unlink';
  tasks?: TaskMasterTask[];
  connected?: boolean;
  message?: string;
  response?: string;
  error?: string;
  requestId?: string;
  status?: 'initializing' | 'ready' | 'error';
}

interface TaskMasterTask {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'done' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  dependencies: number[];
  subtasks?: TaskMasterTask[];
}

interface TerminalOutputItem {
  id: string;
  command: string;
  output: string;
  status: 'success' | 'error' | 'running';
  isSimulated: boolean;
  executedAt: Date;
  durationMs: number;
}

interface TerminalSession {
  id: string;
  projectId: string;
  startedAt: Date;
  isActive: boolean;
  backendConnected: boolean;
  workingDirectory: string;
}

interface TerminalPreferences {
  fontSize: number;
  colorScheme: 'dark' | 'matrix' | 'ocean';
  autoScroll: boolean;
  showTimestamps: boolean;
}

interface FavoriteCommand {
  id: string;
  command: string;
  description: string;
  category: string;
  orderIndex: number;
}

interface TerminalContextType {
  // Connection state
  connectionStatus: ConnectionStatus;
  isBackendConnected: boolean;
  wsClient: { send: (data: unknown) => void } | null;
  
  // Terminal state
  outputBuffer: TerminalOutputItem[];
  commandHistory: string[];
  historyIndex: number;
  currentSession: TerminalSession | null;
  preferences: TerminalPreferences;
  favoriteCommands: FavoriteCommand[];
  isExecuting: boolean;
  pendingCommand: string;
  workingDirectory: string;

  // Terminal ref for xterm
  terminalRef: React.RefObject<HTMLDivElement | null>;
  
  // Actions
  sendInput: (data: string) => void;
  resizeTerminal: (cols: number, rows: number) => void;
  setWorkingDirectory: (path: string) => void;
  executeCommand: (command: string) => Promise<void>;
  setCommandInput: (command: string) => void;
  clearOutput: () => void;
  navigateHistory: (direction: 'up' | 'down') => string;
  updatePreferences: (prefs: Partial<TerminalPreferences>) => Promise<void>;
  addFavoriteCommand: (command: string, description: string, category: string) => Promise<void>;
  removeFavoriteCommand: (id: string) => Promise<void>;
  loadSessionHistory: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  connectBackend: () => void;
  disconnectBackend: () => void;

  // Callbacks for XTerminal
  onTerminalOutput: ((data: string) => void) | null;
  setOnTerminalOutput: (callback: (data: string) => void) => void;

  // TaskMaster sync
  taskMasterTasks: TaskMasterTask[];

  // Gemini CLI state
  geminiStatus: 'initializing' | 'ready' | 'error';
  onGeminiMessage: ((message: { type: string; response?: string; error?: string; requestId?: string }) => void) | null;
  setOnGeminiMessage: (callback: (message: { type: string; response?: string; error?: string; requestId?: string }) => void) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: TerminalPreferences = {
  fontSize: 14,
  colorScheme: 'dark',
  autoScroll: true,
  showTimestamps: true,
};

export function TerminalProvider({ children }: { children: ReactNode }) {
  const { user, currentProject } = useApp();
  
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  
  // Terminal state
  const [outputBuffer, setOutputBuffer] = useState<TerminalOutputItem[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentSession, setCurrentSession] = useState<TerminalSession | null>(null);
  const [preferences, setPreferences] = useState<TerminalPreferences>(DEFAULT_PREFERENCES);
  const [favoriteCommands, setFavoriteCommands] = useState<FavoriteCommand[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [pendingCommand, setPendingCommand] = useState('');
  const [workingDirectory, setWorkingDirectoryState] = useState('');
  
  // Terminal ref
  const terminalRef = useRef<HTMLDivElement | null>(null);
  
  // Output callback for xterm
  const [onTerminalOutput, setOnTerminalOutputState] = useState<((data: string) => void) | null>(null);
  
  // TaskMaster state
  const [taskMasterTasks, setTaskMasterTasks] = useState<TaskMasterTask[]>([]);

  // Gemini CLI state
  const [geminiStatus, setGeminiStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [onGeminiMessage, setOnGeminiMessageState] = useState<((message: { type: string; response?: string; error?: string; requestId?: string }) => void) | null>(null);

  // Handle WebSocket messages
  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'terminal:output':
        if (message.data && onTerminalOutput) {
          onTerminalOutput(message.data);
        }
        break;
        
      case 'terminal:ready':
        console.log('[Terminal] PTY ready');
        break;
        
      case 'terminal:exit':
        console.log(`[Terminal] PTY exited with code ${message.code}`);
        break;
        
      case 'connection:status':
        setIsBackendConnected(message.connected ?? false);
        break;
        
      case 'config:workingDir':
        if (message.path) {
          setWorkingDirectoryState(message.path);
        }
        break;
        
      case 'file:changed':
        console.log(`[Watcher] File ${message.event}: ${message.path}`);
        // Could trigger UI updates here
        break;
        
      case 'tasks:updated':
        if (message.tasks) {
          console.log(`[TaskMaster] Received ${message.tasks.length} tasks`);
          setTaskMasterTasks(message.tasks);
        }
        break;

      case 'gemini:response':
      case 'gemini:error':
        if (onGeminiMessage) {
          onGeminiMessage({
            type: message.type,
            response: message.response,
            error: message.error,
            requestId: message.requestId,
          });
        }
        break;

      case 'gemini:status':
        if (message.status) {
          setGeminiStatus(message.status);
        }
        break;
        
      case 'error':
        console.error('[Server Error]', message.message);
        break;
        
      default:
        console.log('[WebSocket] Unknown message type:', message.type);
    }
  }, [onTerminalOutput, onGeminiMessage]);

  // Connect to backend
  const connectBackend = useCallback(() => {
    if (wsClientRef.current?.isConnected()) {
      return;
    }
    
    const client = getWebSocketClient(
      handleServerMessage,
      setConnectionStatus
    );
    
    wsClientRef.current = client;
    client.connect();
  }, [handleServerMessage]);

  // Disconnect from backend
  const disconnectBackend = useCallback(() => {
    disconnectWebSocket();
    wsClientRef.current = null;
    setIsBackendConnected(false);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connectBackend();
    
    return () => {
      disconnectBackend();
    };
  }, []);

  // Load user preferences and favorites
  useEffect(() => {
    if (user) {
      loadPreferences();
      loadFavoriteCommands();
    }
  }, [user]);

  // Load/create session when project changes
  useEffect(() => {
    if (currentProject) {
      loadOrCreateSession();
      loadSessionHistory();
    }
  }, [currentProject]);

  // Send input to backend
  const sendInput = useCallback((data: string) => {
    if (wsClientRef.current?.isConnected()) {
      wsClientRef.current.send({ type: 'terminal:input', data });
    }
  }, []);

  // Resize terminal
  const resizeTerminal = useCallback((cols: number, rows: number) => {
    if (wsClientRef.current?.isConnected()) {
      wsClientRef.current.send({ type: 'terminal:resize', cols, rows });
    }
  }, []);

  // Set working directory
  const setWorkingDirectory = useCallback((path: string) => {
    setWorkingDirectoryState(path);
    if (wsClientRef.current?.isConnected()) {
      wsClientRef.current.send({ type: 'config:setWorkingDir', path });
    }
  }, []);

  // Set terminal output callback
  const setOnTerminalOutput = useCallback((callback: (data: string) => void) => {
    setOnTerminalOutputState(() => callback);
  }, []);

  // Set Gemini message callback
  const setOnGeminiMessage = useCallback((callback: (message: { type: string; response?: string; error?: string; requestId?: string }) => void) => {
    setOnGeminiMessageState(() => callback);
  }, []);

  const loadPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('terminal_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPreferences({
        fontSize: data.font_size,
        colorScheme: data.color_scheme as 'dark' | 'matrix' | 'ocean',
        autoScroll: data.auto_scroll,
        showTimestamps: data.show_timestamps,
      });
    }
  };

  const loadFavoriteCommands = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('favorite_commands')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index');

    if (data) {
      setFavoriteCommands(
        data.map((cmd) => ({
          id: cmd.id,
          command: cmd.command,
          description: cmd.description,
          category: cmd.category,
          orderIndex: cmd.order_index,
        }))
      );
    }
  };

  const loadOrCreateSession = async () => {
    if (!currentProject || !user) return;

    const { data: existingSession } = await supabase
      .from('terminal_sessions')
      .select('*')
      .eq('project_id', currentProject.id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingSession) {
      setCurrentSession({
        id: existingSession.id,
        projectId: existingSession.project_id,
        startedAt: new Date(existingSession.started_at),
        isActive: existingSession.is_active,
        backendConnected: existingSession.backend_connected,
        workingDirectory: existingSession.working_directory,
      });
      if (existingSession.working_directory) {
        setWorkingDirectoryState(existingSession.working_directory);
      }
    } else {
      const { data: newSession } = await supabase
        .from('terminal_sessions')
        .insert({
          project_id: currentProject.id,
          is_active: true,
          backend_connected: false,
          working_directory: '',
        })
        .select()
        .single();

      if (newSession) {
        setCurrentSession({
          id: newSession.id,
          projectId: newSession.project_id,
          startedAt: new Date(newSession.started_at),
          isActive: newSession.is_active,
          backendConnected: newSession.backend_connected,
          workingDirectory: newSession.working_directory,
        });
      }
    }
  };

  const loadSessionHistory = async () => {
    if (!currentProject) return;

    const { data } = await supabase
      .from('terminal_output')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('executed_at', { ascending: true })
      .limit(100);

    if (data) {
      setOutputBuffer(
        data.map((item) => ({
          id: item.id,
          command: item.command,
          output: item.output,
          status: item.status as 'success' | 'error' | 'running',
          isSimulated: item.is_simulated,
          executedAt: new Date(item.executed_at),
          durationMs: item.duration_ms,
        }))
      );

      const uniqueCommands = Array.from(new Set(data.map((item) => item.command)));
      setCommandHistory(uniqueCommands);
    }
  };

  // Execute command (simulated mode fallback)
  const executeCommand = async (command: string) => {
    if (!currentProject || !currentSession || !command.trim()) return;

    // If connected to backend, send through WebSocket
    if (isBackendConnected) {
      sendInput(command + '\r');
      return;
    }

    // Fallback: simulated mode
    setIsExecuting(true);
    const startTime = Date.now();

    const mockResponse = await simulateCommand(command);
    const durationMs = Date.now() - startTime;

    const newOutput: TerminalOutputItem = {
      id: crypto.randomUUID(),
      command: command.trim(),
      output: mockResponse.output,
      status: mockResponse.status,
      isSimulated: true,
      executedAt: new Date(),
      durationMs,
    };

    setOutputBuffer((prev) => [...prev, newOutput]);
    setCommandHistory((prev) => {
      const filtered = prev.filter((cmd) => cmd !== command.trim());
      return [...filtered, command.trim()];
    });
    setHistoryIndex(-1);

    await supabase.from('terminal_output').insert({
      session_id: currentSession.id,
      project_id: currentProject.id,
      command: command.trim(),
      output: mockResponse.output,
      status: mockResponse.status,
      is_simulated: true,
      executed_at: new Date().toISOString(),
      duration_ms: durationMs,
    });

    setIsExecuting(false);
  };

  const simulateCommand = async (command: string): Promise<{ output: string; status: 'success' | 'error' }> => {
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

    const cmd = command.trim().toLowerCase();

    if (cmd === 'help' || cmd === '--help') {
      return {
        output: `Available commands:
  help              Show this help message
  ls                List files in current directory (simulated)
  pwd               Print working directory
  clear             Clear terminal output
  history           Show command history
  taskmaster        TaskMaster commands (simulated)
  git status        Show git status (simulated)
  npm install       Install packages (simulated)

Note: This terminal is in SIMULATED mode. Start the backend server for real command execution:
  cd server && npm install && npm run dev`,
        status: 'success',
      };
    }

    if (cmd === 'clear') {
      return { output: '', status: 'success' };
    }

    if (cmd === 'pwd') {
      return {
        output: currentSession?.workingDirectory || workingDirectory || '/simulated/project/path',
        status: 'success',
      };
    }

    if (cmd === 'ls' || cmd.startsWith('ls ')) {
      return {
        output: `src/
node_modules/
package.json
README.md
tsconfig.json
vite.config.ts
server/`,
        status: 'success',
      };
    }

    if (cmd === 'history') {
      return {
        output: commandHistory.map((c, i) => `${i + 1}  ${c}`).join('\n'),
        status: 'success',
      };
    }

    if (cmd.includes('taskmaster') || cmd.includes('task')) {
      return {
        output: `TaskMaster Integration (Simulated)
✓ Connected to project: ${currentProject?.name}
✓ Ready to manage tasks

Use these commands:
  - "Show me all tasks"
  - "What's the next task?"
  - "Mark task complete"
  - "Create new task"

Note: Full TaskMaster integration requires backend connection.`,
        status: 'success',
      };
    }

    if (cmd.startsWith('git ')) {
      return {
        output: `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean

(Simulated git output)`,
        status: 'success',
      };
    }

    if (cmd.startsWith('npm ') || cmd.startsWith('yarn ') || cmd.startsWith('pnpm ')) {
      return {
        output: `✓ Packages installed successfully

(Simulated package manager output)`,
        status: 'success',
      };
    }

    return {
      output: `Command executed: ${command}

(This is a simulated terminal. Start the backend server for real command execution.)`,
      status: 'success',
    };
  };

  const clearOutput = () => {
    setOutputBuffer([]);
  };

  const navigateHistory = useCallback((direction: 'up' | 'down'): string => {
    if (commandHistory.length === 0) return '';

    let newIndex = historyIndex;

    if (direction === 'up') {
      newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1 ? -1 : Math.min(commandHistory.length - 1, historyIndex + 1);
      if (newIndex === commandHistory.length - 1 && direction === 'down') {
        newIndex = -1;
      }
    }

    setHistoryIndex(newIndex);
    return newIndex === -1 ? '' : commandHistory[newIndex];
  }, [commandHistory, historyIndex]);

  const updatePreferences = async (prefs: Partial<TerminalPreferences>) => {
    if (!user) return;

    const newPrefs = { ...preferences, ...prefs };
    setPreferences(newPrefs);

    const { data: existing } = await supabase
      .from('terminal_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('terminal_preferences')
        .update({
          font_size: newPrefs.fontSize,
          color_scheme: newPrefs.colorScheme,
          auto_scroll: newPrefs.autoScroll,
          show_timestamps: newPrefs.showTimestamps,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('terminal_preferences').insert({
        user_id: user.id,
        font_size: newPrefs.fontSize,
        color_scheme: newPrefs.colorScheme,
        auto_scroll: newPrefs.autoScroll,
        show_timestamps: newPrefs.showTimestamps,
      });
    }
  };

  const addFavoriteCommand = async (command: string, description: string, category: string) => {
    if (!user) return;

    const orderIndex = favoriteCommands.length;

    const { data } = await supabase
      .from('favorite_commands')
      .insert({
        user_id: user.id,
        project_id: currentProject?.id || null,
        command,
        description,
        category,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (data) {
      setFavoriteCommands((prev) => [
        ...prev,
        {
          id: data.id,
          command: data.command,
          description: data.description,
          category: data.category,
          orderIndex: data.order_index,
        },
      ]);
    }
  };

  const removeFavoriteCommand = async (id: string) => {
    await supabase.from('favorite_commands').delete().eq('id', id);
    setFavoriteCommands((prev) => prev.filter((cmd) => cmd.id !== id));
  };

  const setCommandInput = (command: string) => {
    setPendingCommand(command);
  };

  const testConnection = async (): Promise<boolean> => {
    setConnectionStatus('connecting');
    
    try {
      const response = await fetch('http://127.0.0.1:3001/health');
      if (response.ok) {
        connectBackend();
        return true;
      }
    } catch {
      // Backend not available
    }
    
    setConnectionStatus('disconnected');
    return false;
  };

  const value: TerminalContextType = {
    connectionStatus,
    isBackendConnected,
    wsClient: wsClientRef.current,
    outputBuffer,
    commandHistory,
    historyIndex,
    currentSession,
    preferences,
    favoriteCommands,
    isExecuting,
    pendingCommand,
    workingDirectory,
    terminalRef,
    sendInput,
    resizeTerminal,
    setWorkingDirectory,
    executeCommand,
    setCommandInput,
    clearOutput,
    navigateHistory,
    updatePreferences,
    addFavoriteCommand,
    removeFavoriteCommand,
    loadSessionHistory,
    testConnection,
    connectBackend,
    disconnectBackend,
    onTerminalOutput,
    setOnTerminalOutput,
    taskMasterTasks,
    geminiStatus,
    onGeminiMessage,
    setOnGeminiMessage,
  };

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>;
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}
