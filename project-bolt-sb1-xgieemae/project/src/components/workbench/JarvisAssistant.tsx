import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  User,
  Bot,
  Trash2,
  ChevronDown,
  Settings,
  AlertTriangle,
  Minimize2,
} from 'lucide-react';
import { Button } from '../ui';
import { supabase } from '../../lib/supabase';
import { useTerminal } from '../../contexts/TerminalContext';
import { getPromptForContext, type PromptContext } from '../../lib/promptConfig';
import { setJarvisPromptHandler } from '../ui/AIHelperButton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface JarvisAssistantProps {
  projectId: string | null;
  projectName?: string;
}

interface ProjectContext {
  vision: {
    problem: string;
    target_user: string;
    success_metrics: string;
  } | null;
  userProfile: {
    primary_user: string;
    goal: string;
    technical_comfort: string;
  } | null;
  tasks: {
    id: string;
    title: string;
    status: string;
    description: string;
  }[];
  currentTask: {
    title: string;
    description: string;
  } | null;
}

export function JarvisAssistant({ projectId, projectName }: JarvisAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingRequests = useRef<Map<string, (response: string) => void>>(new Map());

  const { wsClient, isBackendConnected, geminiStatus, setOnGeminiMessage } = useTerminal();

  // Set up Gemini message handler
  useEffect(() => {
    if (!setOnGeminiMessage) return;

    const handleGeminiMessage = (message: { type: string; response?: string; error?: string; requestId?: string }) => {
      if (message.type === 'gemini:response') {
        const response = message.response || '';
        const requestId = message.requestId;
        
        if (requestId && pendingRequests.current.has(requestId)) {
          const handler = pendingRequests.current.get(requestId);
          if (handler) {
            handler(response);
            pendingRequests.current.delete(requestId);
          }
        } else {
          // General response - add as assistant message
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
        }
      } else if (message.type === 'gemini:error') {
        const error = message.error || 'Unknown error';
        const requestId = message.requestId;
        
        if (requestId && pendingRequests.current.has(requestId)) {
          const handler = pendingRequests.current.get(requestId);
          if (handler) {
            handler(`Error: ${error}`);
            pendingRequests.current.delete(requestId);
          }
        } else {
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Sorry, I encountered an error: ${error}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
        setIsLoading(false);
      }
    };

    setOnGeminiMessage(handleGeminiMessage);

    return () => {
      setOnGeminiMessage(null);
    };
  }, [setOnGeminiMessage]);

  // Load project context when opened
  const loadProjectContext = useCallback(async () => {
    if (!projectId) return;

    try {
      // Load vision
      const { data: visionData } = await supabase
        .from('visions')
        .select('problem, target_user, success_metrics')
        .eq('project_id', projectId)
        .maybeSingle();

      // Load user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('primary_user, goal, technical_comfort')
        .eq('project_id', projectId)
        .maybeSingle();

      // Load tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, status, description')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      const currentTask = tasksData?.find((t) => t.status === 'in_progress') || null;

      const context = {
        vision: visionData,
        userProfile: profileData,
        tasks: tasksData || [],
        currentTask: currentTask
          ? { title: currentTask.title, description: currentTask.description || '' }
          : null,
      };

      setProjectContext(context);

      // Initialize Gemini CLI with project context
      if (wsClient && isBackendConnected) {
        wsClient.send({
          type: 'gemini:initialize',
          projectContext: {
            projectName,
            description: visionData?.problem || '',
            techStack: {
              languages: ['TypeScript', 'JavaScript'],
              frameworks: ['React', 'Vite'],
            },
          },
        });
      }
    } catch (error) {
      console.error('Failed to load project context:', error);
    }
  }, [projectId, projectName, wsClient, isBackendConnected]);

  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectContext();
    }
  }, [isOpen, projectId, loadProjectContext]);

  // Separate function to send message from prompt (used by handler)
  const sendMessageFromPrompt = useCallback(async (prompt: string, context?: PromptContext) => {
    if (!wsClient || !isBackendConnected) return;

    setIsLoading(true);

    try {
      // Build prompt with context
      const projectContext = buildContextString();
      const fullPrompt = getPromptForContext(context || 'general', prompt, {
        projectContext,
        conversationHistory: messages.slice(-5).map((m) => `${m.role}: ${m.content}`).join('\n'),
      });

      // Generate request ID
      const requestId = `jarvis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Set up response handler
      const responsePromise = new Promise<string>((resolve) => {
        pendingRequests.current.set(requestId, resolve);
      });

      // Send to Gemini CLI via WebSocket
      wsClient.send({
        type: 'gemini:send',
        prompt: fullPrompt,
        requestId,
      });

      // Wait for response (with timeout)
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 60000);
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [wsClient, isBackendConnected, messages]);

  // Expose prompt handler for AIHelperButton
  useEffect(() => {
    const handlePrompt = (prompt: string, context?: PromptContext) => {
      // Open Jarvis if not open
      if (!isOpen) {
        setIsOpen(true);
        setIsMinimized(false);
      }
      
      // Set input and send
      setInput(prompt);
      // Auto-send after a brief delay to ensure UI is ready
      setTimeout(() => {
        sendMessageFromPrompt(prompt, context);
      }, 100);
    };

    setJarvisPromptHandler(handlePrompt);

    return () => {
      setJarvisPromptHandler(() => {});
    };
  }, [isOpen, sendMessageFromPrompt]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const buildContextString = (): string => {
    if (!projectContext) return 'No project context available.';

    const parts: string[] = [];

    parts.push(`PROJECT: ${projectName || 'Unnamed Project'}`);

    if (projectContext.vision) {
      parts.push(`
VISION:
- Problem: ${projectContext.vision.problem || 'Not defined'}
- Target User: ${projectContext.vision.target_user || 'Not defined'}
- Success Metrics: ${projectContext.vision.success_metrics || 'Not defined'}`);
    }

    if (projectContext.userProfile) {
      parts.push(`
USER PROFILE:
- Primary User: ${projectContext.userProfile.primary_user || 'Not defined'}
- Goal: ${projectContext.userProfile.goal || 'Not defined'}
- Technical Comfort: ${projectContext.userProfile.technical_comfort || 'Medium'}`);
    }

    if (projectContext.currentTask) {
      parts.push(`
CURRENT TASK:
- Title: ${projectContext.currentTask.title}
- Description: ${projectContext.currentTask.description || 'No description'}`);
    }

    if (projectContext.tasks.length > 0) {
      const taskSummary = projectContext.tasks
        .slice(0, 10)
        .map((t) => `  - [${t.status}] ${t.title}`)
        .join('\n');
      const remaining = projectContext.tasks.length > 10 ? `\n  ... and ${projectContext.tasks.length - 10} more tasks` : '';
      parts.push(`
TASK LIST (${projectContext.tasks.length} total):
${taskSummary}${remaining}`);
    }

    parts.push(`
ORBIT MISSION CONTROL INFO:
- Orbit is a planning tool for vibe coding with AI
- Users plan their project vision, user profile, features, and tech stack
- Then they use TaskMaster AI to generate tasks from their PRD
- The Workbench has a terminal for running commands and managing tasks
- Users can copy context to paste into Claude Code or other AI assistants`);

    return parts.join('\n');
  };

  const sendMessage = async () => {
    if (!input.trim() || !wsClient || !isBackendConnected) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Build prompt with context
      const context = buildContextString();
      const fullPrompt = getPromptForContext('general', userInput, {
        projectContext: context,
        conversationHistory: messages.slice(-5).map((m) => `${m.role}: ${m.content}`).join('\n'),
      });

      // Generate request ID
      const requestId = `jarvis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Set up response handler
      const responsePromise = new Promise<string>((resolve) => {
        pendingRequests.current.set(requestId, resolve);
      });

      // Send to Gemini CLI via WebSocket
      wsClient.send({
        type: 'gemini:send',
        prompt: fullPrompt,
        requestId,
      });

      // Wait for response (with timeout)
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 60000);
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  const quickPrompts = [
    'What should I focus on next?',
    'How do I use TaskMaster?',
    'Explain my current task',
    'Suggest improvements to my PRD',
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all group"
          title="Open Jarvis Assistant"
        >
          <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-primary-900" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-primary-900 border border-primary-700 rounded-xl shadow-2xl transition-all ${
            isMinimized
              ? 'bottom-6 right-6 w-64 h-12'
              : 'bottom-6 right-6 w-96 h-[500px] max-h-[80vh]'
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border-b border-primary-700 ${
              isMinimized ? 'rounded-xl' : 'rounded-t-xl'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-primary-100">Jarvis</span>
              {projectContext?.currentTask && !isMinimized && (
                <span className="text-xs text-primary-400 truncate max-w-[120px]">
                  • {projectContext.currentTask.title}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-primary-400 hover:text-primary-200 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-primary-400 hover:text-primary-200 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Connection Status Warning */}
              {!isBackendConnected && (
                <div className="p-4 border-b border-primary-700">
                  <div className="flex items-start gap-3 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-200 mb-1">
                        Backend server not connected. Please start the backend server to use Jarvis.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isBackendConnected && geminiStatus === 'initializing' && (
                <div className="p-4 border-b border-primary-700">
                  <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <p className="text-sm text-blue-200">
                      Initializing Jarvis...
                    </p>
                  </div>
                </div>
              )}

              {isBackendConnected && geminiStatus === 'error' && (
                <div className="p-4 border-b border-primary-700">
                  <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-200 mb-1">
                        Jarvis initialization failed. Please check that Gemini CLI is installed and configured.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 180px)' }}>
                {messages.length === 0 && isBackendConnected && geminiStatus === 'ready' && (
                  <div className="text-center py-6">
                    <Sparkles className="w-10 h-10 text-purple-400/50 mx-auto mb-3" />
                    <p className="text-sm text-primary-400 mb-4">
                      Hi! I'm Jarvis, your project assistant. I know about your vision, tasks, and can help with workflow questions.
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-primary-500 mb-2">Quick prompts:</p>
                      {quickPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInput(prompt)}
                          className="block w-full text-left px-3 py-2 text-xs bg-primary-800/50 border border-primary-700 rounded-lg text-primary-300 hover:bg-primary-800 hover:text-primary-200 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-900/50 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-primary-600 text-primary-100'
                          : 'bg-primary-800 text-primary-200 border border-primary-700'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-300" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-900/50 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="bg-primary-800 text-primary-200 border border-primary-700 px-3 py-2 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {isBackendConnected && geminiStatus === 'ready' && (
                <div className="p-3 border-t border-primary-700">
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Jarvis anything..."
                      rows={1}
                      className="flex-1 px-3 py-2 bg-primary-800 border border-primary-700 rounded-lg text-sm text-primary-100 placeholder-primary-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="px-3 bg-purple-600 hover:bg-purple-500"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {messages.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="mt-2 text-xs text-primary-500 hover:text-primary-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear history
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

