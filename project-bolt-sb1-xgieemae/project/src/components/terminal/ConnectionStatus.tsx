import React, { useState } from 'react';
import { Wifi, WifiOff, Loader2, Server, X, Terminal, CheckCircle } from 'lucide-react';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  onTestConnection: () => Promise<boolean>;
}

export function ConnectionStatus({ status, onTestConnection }: ConnectionStatusProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await onTestConnection();
    setTesting(false);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected to Backend';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="border-b border-gray-700 bg-gray-900 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm text-gray-300">{getStatusText()}</span>
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          </div>

          {status === 'disconnected' && (
            <span className="text-xs text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded">
              SIMULATED MODE
            </span>
          )}
          
          {status === 'connected' && (
            <span className="text-xs text-green-500 bg-green-900/20 px-2 py-1 rounded flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              LIVE TERMINAL
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing || status === 'connecting'}
            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : status === 'connected' ? 'Reconnect' : 'Connect'}
          </button>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            {showGuide ? 'Hide' : 'Setup'} Guide
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-gray-200">Backend Server Setup</h3>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <p className="font-medium text-gray-200 mb-3">Quick Start (3 steps):</p>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  <div>
                    <span className="font-medium text-gray-200">Install server dependencies</span>
                    <div className="mt-1">
                      <code className="block text-xs bg-gray-900 px-3 py-2 rounded text-green-400 font-mono">
                        cd server && npm install
                      </code>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  <div>
                    <span className="font-medium text-gray-200">Start the backend server</span>
                    <div className="mt-1">
                      <code className="block text-xs bg-gray-900 px-3 py-2 rounded text-green-400 font-mono">
                        npm run dev
                      </code>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                  <div>
                    <span className="font-medium text-gray-200">Or run both together</span>
                    <div className="mt-1">
                      <code className="block text-xs bg-gray-900 px-3 py-2 rounded text-green-400 font-mono">
                        npm run dev:full
                      </code>
                      <p className="text-xs text-gray-500 mt-1">
                        (from project root - starts frontend + backend)
                      </p>
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            <div className="pt-3 border-t border-gray-700">
              <p className="font-medium text-gray-200 mb-2">What you get:</p>
              <ul className="space-y-1 text-xs text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Real terminal with PowerShell (Windows) or Bash (Mac/Linux)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Run Claude Code CLI directly: <code className="bg-gray-900 px-1 rounded">claude</code>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  File watching for real-time updates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  TaskMaster AI integration (syncs tasks.json)
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                <strong className="text-gray-400">Note:</strong> The backend runs locally on port 3001.
                Make sure Claude Code CLI is installed: <code className="bg-gray-900 px-1 rounded">npm install -g @anthropic-ai/claude-code</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
