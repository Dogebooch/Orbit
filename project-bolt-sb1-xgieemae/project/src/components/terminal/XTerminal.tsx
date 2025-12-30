import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface XTerminalProps {
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
  fontSize?: number;
  colorScheme?: 'dark' | 'matrix' | 'ocean';
}

// Color schemes for the terminal
const colorSchemes = {
  dark: {
    background: '#0a0a0a',
    foreground: '#e4e4e7',
    cursor: '#22c55e',
    cursorAccent: '#0a0a0a',
    selectionBackground: '#3f3f46',
    black: '#18181b',
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#eab308',
    blue: '#3b82f6',
    magenta: '#a855f7',
    cyan: '#06b6d4',
    white: '#e4e4e7',
    brightBlack: '#52525b',
    brightRed: '#f87171',
    brightGreen: '#4ade80',
    brightYellow: '#facc15',
    brightBlue: '#60a5fa',
    brightMagenta: '#c084fc',
    brightCyan: '#22d3ee',
    brightWhite: '#fafafa',
  },
  matrix: {
    background: '#0d0d0d',
    foreground: '#00ff00',
    cursor: '#00ff00',
    cursorAccent: '#0d0d0d',
    selectionBackground: '#003300',
    black: '#0d0d0d',
    red: '#ff0000',
    green: '#00ff00',
    yellow: '#ffff00',
    blue: '#0000ff',
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#00ff00',
    brightBlack: '#003300',
    brightRed: '#ff3333',
    brightGreen: '#33ff33',
    brightYellow: '#ffff33',
    brightBlue: '#3333ff',
    brightMagenta: '#ff33ff',
    brightCyan: '#33ffff',
    brightWhite: '#66ff66',
  },
  ocean: {
    background: '#0c1929',
    foreground: '#c0c5ce',
    cursor: '#5fb3b3',
    cursorAccent: '#0c1929',
    selectionBackground: '#1b2b34',
    black: '#1b2b34',
    red: '#ec5f67',
    green: '#99c794',
    yellow: '#fac863',
    blue: '#6699cc',
    magenta: '#c594c5',
    cyan: '#5fb3b3',
    white: '#c0c5ce',
    brightBlack: '#65737e',
    brightRed: '#ec5f67',
    brightGreen: '#99c794',
    brightYellow: '#fac863',
    brightBlue: '#6699cc',
    brightMagenta: '#c594c5',
    brightCyan: '#5fb3b3',
    brightWhite: '#d8dee9',
  },
};

export const XTerminal: React.FC<XTerminalProps> = ({
  onData,
  onResize,
  fontSize = 14,
  colorScheme = 'dark',
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Handle terminal resize
  const handleResize = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current) {
      try {
        fitAddonRef.current.fit();
        const { cols, rows } = xtermRef.current;
        onResize(cols, rows);
      } catch (error) {
        console.error('[XTerminal] Resize error:', error);
      }
    }
  }, [onResize]);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const theme = colorSchemes[colorScheme];
    
    const terminal = new Terminal({
      fontSize,
      fontFamily: '"Cascadia Code", "Fira Code", Consolas, "Courier New", monospace',
      theme,
      cursorBlink: true,
      cursorStyle: 'block',
      allowTransparency: true,
      scrollback: 10000,
      tabStopWidth: 4,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);
    
    // Fit after a short delay to ensure container is sized
    setTimeout(() => {
      fitAddon.fit();
      const { cols, rows } = terminal;
      onResize(cols, rows);
    }, 100);

    // Handle user input
    terminal.onData((data) => {
      onData(data);
    });

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle window resize
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Update font size
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = fontSize;
      handleResize();
    }
  }, [fontSize, handleResize]);

  // Update color scheme
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = colorSchemes[colorScheme];
    }
  }, [colorScheme]);

  // Method to write data to terminal (called from parent)
  const write = useCallback((data: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(data);
    }
  }, []);

  // Method to clear terminal
  const clear = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  }, []);

  // Method to focus terminal
  const focus = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.focus();
    }
  }, []);

  // Expose methods via ref
  useEffect(() => {
    const element = terminalRef.current;
    if (element) {
      (element as HTMLDivElement & { 
        terminalWrite: typeof write;
        terminalClear: typeof clear;
        terminalFocus: typeof focus;
        terminalFit: typeof handleResize;
      }).terminalWrite = write;
      (element as HTMLDivElement & { terminalClear: typeof clear }).terminalClear = clear;
      (element as HTMLDivElement & { terminalFocus: typeof focus }).terminalFocus = focus;
      (element as HTMLDivElement & { terminalFit: typeof handleResize }).terminalFit = handleResize;
    }
  }, [write, clear, focus, handleResize]);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full"
      style={{ backgroundColor: colorSchemes[colorScheme].background }}
    />
  );
};

// Type for accessing terminal methods from the ref
export interface XTerminalRef {
  terminalWrite: (data: string) => void;
  terminalClear: () => void;
  terminalFocus: () => void;
  terminalFit: () => void;
}

