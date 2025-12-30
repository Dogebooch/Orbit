import React, { useState } from 'react';
import { Wifi, WifiOff, Loader2, Server, X } from 'lucide-react';

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
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing || status === 'connecting'}
            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test Connection'}
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

          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <p className="font-medium text-gray-200 mb-2">To enable real command execution:</p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>
                  <span className="font-medium">Create backend server</span>
                  <div className="mt-1 ml-6 space-y-1">
                    <p className="text-xs text-gray-400">Option A: Separate repository with WebSocket server</p>
                    <p className="text-xs text-gray-400">Option B: Add /server folder to this project</p>
                  </div>
                </li>
                <li>
                  <span className="font-medium">Install dependencies</span>
                  <code className="ml-2 text-xs bg-gray-900 px-2 py-1 rounded text-green-400">
                    npm install ws express
                  </code>
                </li>
                <li>
                  <span className="font-medium">Implement WebSocket endpoint</span>
                  <div className="mt-1 ml-6 text-xs text-gray-400">
                    <p>Listen for command events and execute safely</p>
                    <p>Send output back to client via WebSocket</p>
                  </div>
                </li>
                <li>
                  <span className="font-medium">Set environment variable</span>
                  <code className="ml-2 text-xs bg-gray-900 px-2 py-1 rounded text-green-400">
                    VITE_TERMINAL_WS_URL=ws://localhost:3001
                  </code>
                </li>
                <li>
                  <span className="font-medium">Start backend server</span>
                  <code className="ml-2 text-xs bg-gray-900 px-2 py-1 rounded text-green-400">
                    node server/index.js
                  </code>
                </li>
              </ol>
            </div>

            <div className="pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                <strong className="text-gray-300">Security Note:</strong> The backend should validate all commands
                against a blacklist of dangerous operations before execution. Never execute commands with
                elevated privileges without explicit user confirmation.
              </p>
            </div>

            <div className="pt-2">
              <p className="text-xs text-blue-400">
                The terminal will automatically switch from simulated mode to real execution once
                the backend server is detected.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
