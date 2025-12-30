import React, { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TerminalOutputItem {
  id: string;
  command: string;
  output: string;
  status: 'success' | 'error' | 'running';
  isSimulated: boolean;
  executedAt: Date;
  durationMs: number;
}

interface TerminalOutputProps {
  items: TerminalOutputItem[];
  showTimestamps: boolean;
  autoScroll: boolean;
  fontSize: number;
}

export function TerminalOutput({ items, showTimestamps, autoScroll, fontSize }: TerminalOutputProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [items, autoScroll]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  return (
    <div
      ref={outputRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ fontSize: `${fontSize}px` }}
    >
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-full text-green-400/50">
          <div className="text-center space-y-2">
            <p className="font-mono">Terminal ready. Type 'help' for available commands.</p>
            <p className="text-xs opacity-70">SIMULATED MODE - Connect backend for real execution</p>
          </div>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="space-y-1 animate-fade-in">
            <div className="flex items-start gap-2">
              <span className="text-green-400 flex-shrink-0">$</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-green-300 font-mono">{item.command}</span>
                  {showTimestamps && (
                    <span className="text-gray-600 text-xs">
                      [{formatTime(item.executedAt)}]
                    </span>
                  )}
                  {item.isSimulated && (
                    <span className="text-yellow-500/70 text-xs">[simulated]</span>
                  )}
                  <span className="flex-shrink-0">
                    {item.status === 'running' && (
                      <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    )}
                    {item.status === 'error' && (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                  </span>
                </div>
              </div>
            </div>

            {item.output && (
              <div className={`pl-4 font-mono whitespace-pre-wrap ${
                item.status === 'error' ? 'text-red-400' : 'text-gray-300'
              }`}>
                {item.output}
              </div>
            )}

            {item.status === 'success' && item.durationMs > 0 && (
              <div className="pl-4 text-xs text-gray-600">
                Completed in {item.durationMs}ms
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
