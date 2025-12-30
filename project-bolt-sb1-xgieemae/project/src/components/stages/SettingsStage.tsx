import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { Settings, Copy, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export function SettingsStage() {
  const [copiedServer, setCopiedServer] = useState<string | null>(null);

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
          Settings & MCP Integration
        </h1>
        <p className="text-primary-400 mt-2">
          Configure Model Context Protocol servers to enhance Claude Code capabilities.
        </p>
      </div>

      <div className="p-6 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-300 mb-3">What is MCP?</h2>
        <p className="text-sm text-blue-200 mb-3">
          Model Context Protocol (MCP) extends Claude Code with additional capabilities through
          servers. Each server provides specific functionality like file access, memory, or external
          APIs.
        </p>
        <p className="text-sm text-blue-200">
          To add these servers, edit your <code className="bg-primary-900 px-2 py-1 rounded">claude_desktop_config.json</code> file (usually
          in <code className="bg-primary-900 px-2 py-1 rounded">~/.config/claude/</code> or <code className="bg-primary-900 px-2 py-1 rounded">%APPDATA%/Claude/</code>).
        </p>
      </div>

      <div className="space-y-6">
        {mcpServers.map((server) => (
          <Card key={server.name}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-primary-100">{server.name}</h3>
                  {server.optional && (
                    <span className="text-xs px-2 py-1 bg-primary-800 text-primary-300 rounded">
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
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-primary-300 mb-2">Purpose:</h4>
              <p className="text-sm text-primary-400">{server.purpose}</p>
            </div>

            {server.setup && (
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-200">{server.setup}</p>
                </div>
              </div>
            )}

            {server.note && (
              <div className="mb-4 p-3 bg-primary-800 border border-accent-700 rounded">
                <p className="text-sm text-primary-300">{server.note}</p>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-primary-300">Configuration:</h4>
                <Button
                  variant="ghost"
                  onClick={() => copyConfig(server.name, server.config)}
                  disabled={copiedServer === server.name}
                >
                  {copiedServer === server.name ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Config
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs bg-primary-900 p-4 rounded overflow-x-auto border border-accent-700">
                <code className="text-primary-300">{server.config}</code>
              </pre>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-primary-100 mb-4">Installation Steps</h2>
        <ol className="space-y-3 text-sm text-primary-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary-700 text-primary-100 text-xs font-bold">
              1
            </span>
            <div>
              <p className="font-medium text-primary-100 mb-1">Locate your config file</p>
              <p className="text-primary-400">
                Find <code className="bg-primary-900 px-2 py-1 rounded">claude_desktop_config.json</code> in your
                system's config directory.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary-700 text-primary-100 text-xs font-bold">
              2
            </span>
            <div>
              <p className="font-medium text-primary-100 mb-1">Add server configurations</p>
              <p className="text-primary-400">
                Copy the JSON snippets above and add them to the <code className="bg-primary-900 px-2 py-1 rounded">"mcpServers"</code> object in your config.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary-700 text-primary-100 text-xs font-bold">
              3
            </span>
            <div>
              <p className="font-medium text-primary-100 mb-1">Restart Claude Code</p>
              <p className="text-primary-400">
                Close and reopen Claude Code for the changes to take effect.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary-700 text-primary-100 text-xs font-bold">
              4
            </span>
            <div>
              <p className="font-medium text-primary-100 mb-1">Verify installation</p>
              <p className="text-primary-400">
                Check the Claude Code interface for available MCP servers.
              </p>
            </div>
          </li>
        </ol>
      </Card>

      <div className="p-6 bg-primary-800 border border-accent-700 rounded-lg">
        <h3 className="font-semibold text-primary-100 mb-2">VS Code Integration</h3>
        <p className="text-sm text-primary-400 mb-3">
          For GitHub Copilot integration, Orbit can generate a{' '}
          <code className="bg-primary-900 px-2 py-1 rounded">.github/copilot-instructions.md</code> file
          with your project context.
        </p>
        <Button variant="secondary">
          Generate Copilot Instructions
        </Button>
      </div>
    </div>
  );
}
