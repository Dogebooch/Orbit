import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTerminal } from '../../contexts/TerminalContext';
import { Card, Button, StageTips, useFirstVisit, Input } from '../ui';
import {
  Settings,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FileCode,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  FolderCog,
  Terminal,
} from 'lucide-react';
import { ProjectFilesWizard } from './settings/ProjectFilesWizard';
import {
  getGeminiSettings,
  saveGeminiSettings,
  createGeminiClient,
  isGeminiConfigured,
} from '../../lib/gemini';
import {
  generateMcpJson,
  generateTaskmasterConfig,
  downloadMcpJson,
  downloadTaskmasterConfig,
  writeAllConfigsViaWebSocket,
} from '../../lib/configGenerator';

export function SettingsStage() {
  const { currentProject } = useApp();
  const { isBackendConnected, wsClient, workingDirectory } = useTerminal();
  
  const [copiedServer, setCopiedServer] = useState<string | null>(null);
  const [showProjectFilesWizard, setShowProjectFilesWizard] = useState(false);
  const [showMcpServers, setShowMcpServers] = useState(false);
  
  // AI Settings state
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidationResult, setKeyValidationResult] = useState<'valid' | 'invalid' | null>(null);
  const [enableCodebaseAnalysis, setEnableCodebaseAnalysis] = useState(false);

  // Config Generator state
  const [showConfigGenerator, setShowConfigGenerator] = useState(false);
  const [projectPath, setProjectPath] = useState(workingDirectory || '');
  const [configWriteStatus, setConfigWriteStatus] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');
  const [configWriteError, setConfigWriteError] = useState<string | null>(null);
  const [showMcpPreview, setShowMcpPreview] = useState(false);
  const [showTaskmasterPreview, setShowTaskmasterPreview] = useState(false);

  const isFirstVisit = useFirstVisit('settings');

  // Update project path when working directory changes
  useEffect(() => {
    if (workingDirectory) {
      setProjectPath(workingDirectory);
    }
  }, [workingDirectory]);

  // Load settings on mount
  useEffect(() => {
    const settings = getGeminiSettings();
    if (settings.apiKey) {
      setGeminiApiKey(settings.apiKey);
    }
    setEnableCodebaseAnalysis(settings.enableCodebaseAnalysis);
  }, []);

  // Save settings when they change
  const handleSaveGeminiSettings = () => {
    saveGeminiSettings({
      apiKey: geminiApiKey || null,
      enableCodebaseAnalysis,
    });
  };

  // Validate API key
  const validateApiKey = async () => {
    if (!geminiApiKey) return;
    
    setIsValidatingKey(true);
    setKeyValidationResult(null);
    
    try {
      const client = createGeminiClient(geminiApiKey);
      const isValid = await client.validateApiKey();
      setKeyValidationResult(isValid ? 'valid' : 'invalid');
      if (isValid) {
        handleSaveGeminiSettings();
      }
    } catch {
      setKeyValidationResult('invalid');
    } finally {
      setIsValidatingKey(false);
    }
  };

  const mcpServers = [
    {
      name: 'TaskMaster AI',
      description: 'Project roadmap and task management',
      purpose: 'Manages your project roadmap, reads PRDs, and breaks them into tracked tasks.',
      npmPackage: 'taskmaster-ai',
      config: `{
  "taskmaster": {
    "command": "npx",
    "args": ["taskmaster-ai"]
  }
}`,
      setup: 'Run "npx task-master-ai init" in your project directory first.',
      docsUrl: 'https://pageai.pro',
    },
    {
      name: 'Memory Server',
      description: 'User preferences and project history',
      purpose:
        'Remembers user preferences across sessions. Store things like "Always use TypeScript" or "Prefers Tailwind over Bootstrap".',
      npmPackage: '@modelcontextprotocol/server-memory',
      config: `{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  }
}`,
      docsUrl: 'https://github.com/modelcontextprotocol/servers',
    },
    {
      name: 'Filesystem Server',
      description: 'Enhanced file read/write capabilities',
      purpose:
        'Allows Claude to read and write files directly. Essential for the "Consultant" mode where Claude modifies your codebase.',
      npmPackage: '@modelcontextprotocol/server-filesystem',
      config: `{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/your/project"]
  }
}`,
      note: 'Replace /path/to/your/project with your actual project path.',
      docsUrl: 'https://github.com/modelcontextprotocol/servers',
    },
    {
      name: 'Brave Search',
      description: 'Access to latest documentation',
      purpose:
        'Gives Claude access to the latest docs and resources. Useful for "Check latest Next.js 14 docs" queries.',
      npmPackage: '@modelcontextprotocol/server-brave-search',
      config: `{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "env": {
      "BRAVE_API_KEY": "your-api-key-here"
    }
  }
}`,
      setup: 'Get API key from https://brave.com/search/api/',
      docsUrl: 'https://github.com/modelcontextprotocol/servers',
    },
    {
      name: 'Codebase Index',
      description: 'RAG for large codebases',
      purpose:
        'Optional: Enables semantic search across large codebases. Ask "Where is the auth logic?" without reading every file.',
      npmPackage: 'kodit',
      config: `{
  "kodit": {
    "command": "npx",
    "args": ["-y", "kodit"]
  }
}`,
      optional: true,
      docsUrl: 'https://github.com/kodit-app',
    },
  ];

  const copyConfig = (serverName: string, config: string) => {
    navigator.clipboard.writeText(config);
    setCopiedServer(serverName);
    setTimeout(() => setCopiedServer(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary-400" />
          Settings & Configuration
        </h1>
        <p className="text-primary-400 mt-2">
          Configure AI integrations, generate project files, and set up MCP servers.
        </p>
      </div>

      <StageTips
        stage="settings"
        isFirstVisit={isFirstVisit}
        maxTips={1}
      />

      {/* Project Files Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileCode className="w-6 h-6 text-primary-400" />
            <div>
              <h2 className="text-xl font-semibold text-primary-100">Project Files Generator</h2>
              <p className="text-sm text-primary-400">
                Generate CLAUDE.md, .cursorrules, and copilot-instructions.md
              </p>
            </div>
          </div>
          <Button onClick={() => setShowProjectFilesWizard(!showProjectFilesWizard)}>
            <FileCode className="w-4 h-4 mr-2" />
            {showProjectFilesWizard ? 'Close Wizard' : 'Open Wizard'}
          </Button>
        </div>

        {!showProjectFilesWizard && (
          <div className="p-4 bg-primary-800/50 rounded-lg border border-primary-700">
            <p className="text-sm text-primary-300 mb-3">
              These files help AI assistants understand your project's coding standards, architecture, and guidelines.
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-primary-900 rounded">
                <span className="font-medium text-primary-200">CLAUDE.md</span>
                <p className="text-xs text-primary-500 mt-1">Claude Code & Desktop</p>
              </div>
              <div className="p-3 bg-primary-900 rounded">
                <span className="font-medium text-primary-200">.cursorrules</span>
                <p className="text-xs text-primary-500 mt-1">Cursor IDE</p>
              </div>
              <div className="p-3 bg-primary-900 rounded">
                <span className="font-medium text-primary-200">copilot-instructions.md</span>
                <p className="text-xs text-primary-500 mt-1">GitHub Copilot</p>
              </div>
            </div>
          </div>
        )}

        {showProjectFilesWizard && (
          <div className="mt-6 pt-6 border-t border-primary-700">
            <ProjectFilesWizard
              geminiApiKey={isGeminiConfigured(geminiApiKey) ? geminiApiKey : undefined}
              onClose={() => setShowProjectFilesWizard(false)}
            />
          </div>
        )}
      </Card>

      {/* AI Integration Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold text-primary-100">AI Integration (Optional)</h2>
            <p className="text-sm text-primary-400">
              Connect Gemini API for enhanced file generation and suggestions
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-200 mb-2">
              <strong>Note:</strong> AI integration is optional. The file generator works without it using templates.
              With Gemini, files can be enhanced with project-specific suggestions.
            </p>
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <Key className="w-4 h-4" />
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => {
                    setGeminiApiKey(e.target.value);
                    setKeyValidationResult(null);
                  }}
                  placeholder="Enter your Gemini API key..."
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                variant="secondary"
                onClick={validateApiKey}
                disabled={!geminiApiKey || isValidatingKey}
              >
                {isValidatingKey ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : keyValidationResult === 'valid' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1 text-green-400" />
                    Valid
                  </>
                ) : keyValidationResult === 'invalid' ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-1 text-red-400" />
                    Invalid
                  </>
                ) : (
                  'Validate'
                )}
              </Button>
            </div>
            <p className="text-xs text-primary-500 mt-2">
              Get your API key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {isGeminiConfigured(geminiApiKey) && keyValidationResult === 'valid' && (
            <div className="space-y-3 pt-4 border-t border-primary-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCodebaseAnalysis}
                  onChange={(e) => {
                    setEnableCodebaseAnalysis(e.target.checked);
                    saveGeminiSettings({ enableCodebaseAnalysis: e.target.checked });
                  }}
                  className="rounded text-purple-500"
                />
                <span className="text-sm text-primary-300">
                  Enable codebase analysis for enhanced suggestions
                </span>
              </label>
              <p className="text-xs text-primary-500 ml-6">
                When enabled, Gemini will analyze your project files to provide more accurate suggestions.
                Requires terminal backend connection.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Config File Generator Section */}
      <Card>
        <button
          onClick={() => setShowConfigGenerator(!showConfigGenerator)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <FolderCog className="w-6 h-6 text-cyan-400" />
            <div className="text-left">
              <h2 className="text-xl font-semibold text-primary-100">TaskMaster Config Generator</h2>
              <p className="text-sm text-primary-400">
                Generate .mcp.json and .taskmaster/config.json files
              </p>
            </div>
          </div>
          {showConfigGenerator ? (
            <ChevronUp className="w-5 h-5 text-primary-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-primary-400" />
          )}
        </button>

        {showConfigGenerator && (
          <div className="mt-6 space-y-6">
            <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <h3 className="text-sm font-semibold text-cyan-300 mb-2">What are these files?</h3>
              <ul className="text-sm text-cyan-200 space-y-1">
                <li><strong>.mcp.json</strong> - Configures MCP servers for Claude Code (TaskMaster, filesystem, memory)</li>
                <li><strong>.taskmaster/config.json</strong> - TaskMaster AI project configuration</li>
              </ul>
            </div>

            {/* Project Path Input */}
            <div>
              <label className="label flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Project Path
              </label>
              <Input
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="/path/to/your/project"
                className="font-mono text-sm"
              />
              <p className="text-xs text-primary-500 mt-1">
                {isBackendConnected 
                  ? 'Files will be written directly to this directory' 
                  : 'Backend offline - files will be downloaded instead'}
              </p>
            </div>

            {/* Config Previews */}
            <div className="space-y-3">
              <div>
                <button
                  onClick={() => setShowMcpPreview(!showMcpPreview)}
                  className="flex items-center gap-2 text-sm text-primary-300 hover:text-primary-200"
                >
                  {showMcpPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Preview .mcp.json
                </button>
                {showMcpPreview && (
                  <pre className="mt-2 p-3 bg-primary-900 border border-primary-700 rounded-lg text-xs text-primary-300 overflow-x-auto">
                    {generateMcpJson(projectPath || '/path/to/project')}
                  </pre>
                )}
              </div>
              
              <div>
                <button
                  onClick={() => setShowTaskmasterPreview(!showTaskmasterPreview)}
                  className="flex items-center gap-2 text-sm text-primary-300 hover:text-primary-200"
                >
                  {showTaskmasterPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Preview .taskmaster/config.json
                </button>
                {showTaskmasterPreview && (
                  <pre className="mt-2 p-3 bg-primary-900 border border-primary-700 rounded-lg text-xs text-primary-300 overflow-x-auto">
                    {generateTaskmasterConfig(currentProject?.name || 'My Project')}
                  </pre>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {configWriteStatus === 'success' && (
              <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300">Config files created successfully!</span>
              </div>
            )}
            {configWriteStatus === 'error' && (
              <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">{configWriteError || 'Failed to write config files'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isBackendConnected && wsClient ? (
                <Button
                  onClick={() => {
                    setConfigWriteStatus('writing');
                    setConfigWriteError(null);
                    try {
                      writeAllConfigsViaWebSocket(
                        wsClient,
                        projectPath,
                        currentProject?.name || 'My Project'
                      );
                      // The result will come back via WebSocket
                      setTimeout(() => {
                        if (configWriteStatus === 'writing') {
                          setConfigWriteStatus('success');
                        }
                      }, 1000);
                    } catch (err) {
                      setConfigWriteStatus('error');
                      setConfigWriteError(err instanceof Error ? err.message : 'Unknown error');
                    }
                  }}
                  disabled={!projectPath || configWriteStatus === 'writing'}
                  className="flex-1"
                >
                  {configWriteStatus === 'writing' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileCode className="w-4 h-4 mr-2" />
                  )}
                  Write to Project
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    downloadMcpJson(projectPath || '/path/to/project');
                    setTimeout(() => {
                      downloadTaskmasterConfig(currentProject?.name || 'My Project');
                    }, 100);
                    setConfigWriteStatus('success');
                  }}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Config Files
                </Button>
              )}
              
              <Button
                variant="secondary"
                onClick={() => {
                  downloadMcpJson(projectPath || '/path/to/project');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                .mcp.json
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => {
                  downloadTaskmasterConfig(currentProject?.name || 'My Project');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                config.json
              </Button>
            </div>

            <div className="p-3 bg-primary-800/50 rounded-lg">
              <p className="text-xs text-primary-400">
                <strong>After generating:</strong> Place .mcp.json in your project root. 
                Place config.json in the .taskmaster folder. Then restart Claude Code for changes to take effect.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* MCP Servers Section (Collapsible) */}
      <Card>
        <button
          onClick={() => setShowMcpServers(!showMcpServers)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary-400" />
            <div className="text-left">
              <h2 className="text-xl font-semibold text-primary-100">MCP Server Configuration</h2>
              <p className="text-sm text-primary-400">
                Configure Model Context Protocol servers for Claude Code
              </p>
            </div>
          </div>
          {showMcpServers ? (
            <ChevronUp className="w-5 h-5 text-primary-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-primary-400" />
          )}
        </button>

        {showMcpServers && (
          <div className="mt-6 space-y-6">
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-300 mb-2">What is MCP?</h3>
              <p className="text-sm text-blue-200 mb-2">
                Model Context Protocol (MCP) extends Claude Code with additional capabilities through
                servers. Each server provides specific functionality like file access, memory, or external
                APIs.
              </p>
              <p className="text-sm text-blue-200">
                To add these servers, edit your{' '}
                <code className="bg-primary-900 px-2 py-1 rounded">claude_desktop_config.json</code> file.
              </p>
            </div>

            {mcpServers.map((server) => (
              <div key={server.name} className="p-4 bg-primary-800/50 rounded-lg border border-primary-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-primary-100">{server.name}</h3>
                      {server.optional && (
                        <span className="text-xs px-2 py-0.5 bg-primary-700 text-primary-400 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-primary-400">{server.description}</p>
                  </div>
                  {server.docsUrl && (
                    <a
                      href={server.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <p className="text-sm text-primary-500 mb-3">{server.purpose}</p>

                {server.setup && (
                  <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-yellow-200">{server.setup}</span>
                    </div>
                  </div>
                )}

                {server.note && (
                  <div className="mb-3 p-2 bg-primary-900 rounded text-xs text-primary-400">
                    {server.note}
                  </div>
                )}

                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-primary-400">Configuration:</span>
                  <Button
                    variant="ghost"
                    onClick={() => copyConfig(server.name, server.config)}
                    className="text-xs py-1"
                  >
                    {copiedServer === server.name ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="text-xs bg-primary-900 p-3 rounded overflow-x-auto">
                  <code className="text-primary-300">{server.config}</code>
                </pre>
              </div>
            ))}

            <div className="p-4 bg-primary-800 rounded-lg border border-primary-700">
              <h3 className="font-semibold text-primary-100 mb-3">Installation Steps</h3>
              <ol className="space-y-2 text-sm text-primary-300">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-700 text-primary-100 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>
                    Find <code className="bg-primary-900 px-1 rounded">claude_desktop_config.json</code> in
                    your config directory
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-700 text-primary-100 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Copy the server configs and add to the "mcpServers" object</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-700 text-primary-100 text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>Restart Claude Code for changes to take effect</span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
