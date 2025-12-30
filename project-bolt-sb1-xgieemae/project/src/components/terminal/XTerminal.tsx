import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
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

export const XTerminal = forwardRef<XTerminalRef, XTerminalProps>(({
  onData,
  onResize,
  fontSize = 14,
  colorScheme = 'dark',
}, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const isDisposedRef = useRef(false);

  // Refs for callbacks to avoid re-initializing terminal on prop changes
  const onDataRef = useRef(onData);
  const onResizeRef = useRef(onResize);

  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  // Handle terminal resize with debouncing and safety checks
  const handleResize = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:111',message:'handleResize called',data:{isDisposed:isDisposedRef.current,hasFitAddon:!!fitAddonRef.current,hasXterm:!!xtermRef.current,hasTerminalRef:!!terminalRef.current,hasElement:xtermRef.current?.element!==null},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    // Check if terminal is disposed - prevent operations on disposed terminal
    if (isDisposedRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:114',message:'Terminal disposed, skipping fit',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return;
    }
    if (fitAddonRef.current && xtermRef.current && terminalRef.current) {
      // Check if terminal is fully initialized (has element attached)
      if (!xtermRef.current.element) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:119',message:'Terminal not ready - no element, skipping fit',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return;
      }
      
      // Additional check: verify terminal's internal state is valid
      // Accessing private _core to check if terminal is still valid
      const terminal = xtermRef.current as any;
      if (terminal._core && terminal._core._renderService && !terminal._core._renderService.dimensions) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:126',message:'Terminal internal state invalid - missing dimensions',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        return;
      }
      
      try {
        // Check if container has dimensions before fitting
        const rect = terminalRef.current.getBoundingClientRect();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:131',message:'Container dimensions check',data:{width:rect.width,height:rect.height},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        if (rect.width === 0 || rect.height === 0) {
          // Container not sized yet, schedule retry
          setTimeout(handleResize, 50);
          return;
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:138',message:'About to call fit()',data:{hasElement:!!xtermRef.current.element,hasCore:!!(terminal._core)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        fitAddonRef.current.fit();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:141',message:'fit() completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        const { cols, rows } = xtermRef.current;
        onResizeRef.current(cols, rows);
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:145',message:'Resize error caught',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        console.error('[XTerminal] Resize error:', error);
      }
    }
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    terminalWrite: (data: string) => {
      if (xtermRef.current) {
        xtermRef.current.write(data);
      }
    },
    terminalClear: () => {
      if (xtermRef.current) {
        xtermRef.current.clear();
      }
    },
    terminalFocus: () => {
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
    },
    terminalFit: handleResize,
  }), [handleResize]);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;
    
    // Reset disposal flag for new terminal instance
    isDisposedRef.current = false;
    
    // Set up global error handler for xterm async errors
    const xtermErrorHandler = (event: ErrorEvent) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:197',message:'Global error caught',data:{message:event.message,filename:event.filename,lineno:event.lineno,error:event.error?.message,isDisposed:isDisposedRef.current,hasXterm:!!xtermRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      // Check if this is the xterm dimensions error
      if (event.message && event.message.includes('dimensions') && event.filename && event.filename.includes('xterm')) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:201',message:'XTerm dimensions error caught - suppressing',data:{isDisposed:isDisposedRef.current,hasXterm:!!xtermRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        // Suppress the error if terminal is disposed or not available
        if (isDisposedRef.current || !xtermRef.current) {
          event.preventDefault();
          return true; // Prevent default error handling
        }
      }
      return false;
    };
    window.addEventListener('error', xtermErrorHandler);

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

    // Wait for container to be properly sized before opening
    const ensureContainerSized = () => {
      if (!terminalRef.current) return;
      const rect = terminalRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Container not sized yet, retry
        requestAnimationFrame(ensureContainerSized);
        return;
      }
      
      // Container is sized, open terminal
      terminal.open(terminalRef.current);
      
      // Fit after opening
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
          const { cols, rows } = terminal;
          onResizeRef.current(cols, rows);
        } catch (error) {
          console.error('[XTerminal] Initial fit error:', error);
          // Retry after a short delay
          setTimeout(() => {
            try {
              fitAddon.fit();
              const { cols, rows } = terminal;
              onResizeRef.current(cols, rows);
            } catch (retryError) {
              console.error('[XTerminal] Retry fit error:', retryError);
            }
          }, 100);
        }
      });
    };

    ensureContainerSized();

    // Handle user input
    terminal.onData((data) => {
      onDataRef.current(data);
    });

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;
    
    // Focus terminal after initialization
    // Use requestAnimationFrame to ensure DOM is ready, then focus
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (terminal && terminal.element) {
          // Focus the terminal element directly first, then call terminal.focus()
          if (terminal.element instanceof HTMLElement) {
            terminal.element.focus();
          }
          terminal.focus();
        }
      });
    });

    // Handle window resize
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver for container size changes
    // Delay ResizeObserver setup until after terminal is fully initialized
    let resizeObserver: ResizeObserver | null = null;
    const setupResizeObserver = () => {
      if (terminalRef.current && terminal.element) {
        resizeObserver = new ResizeObserver(() => {
          handleResize();
        });
        resizeObserver.observe(terminalRef.current);
      } else {
        // Terminal not ready yet, retry
        requestAnimationFrame(setupResizeObserver);
      }
    };
    // Wait for terminal to be fully opened before setting up ResizeObserver
    requestAnimationFrame(() => {
      requestAnimationFrame(setupResizeObserver);
    });

    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:325',message:'Cleanup started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      // Mark as disposed first to prevent any pending operations
      isDisposedRef.current = true;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('error', xtermErrorHandler);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      // Only dispose if this is still the current terminal instance
      if (xtermRef.current === terminal) {
        try {
          terminal.dispose();
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:337',message:'Dispose error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.error('[XTerminal] Dispose error:', error);
        }
        xtermRef.current = null;
        fitAddonRef.current = null;
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06ca521e-9958-4520-b054-3b4dc07ce95c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'XTerminal.tsx:343',message:'Cleanup completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    };
  }, []); // Run once on mount

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

  // Log focus/blur events and ensure terminal gets focus on click
  useEffect(() => {
    const handleFocus = () => {
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
    };
    const handleBlur = () => {
      // No-op
    };
    const handleClick = (e: MouseEvent) => {
      // Focus the terminal when clicking anywhere in the container
      if (xtermRef.current) {
        // Small delay to ensure click event completes first
        setTimeout(() => {
          xtermRef.current?.focus();
        }, 0);
      }
    };
    
    const container = terminalRef.current;
    if (container) {
      container.addEventListener('focus', handleFocus);
      container.addEventListener('blur', handleBlur);
      container.addEventListener('click', handleClick, true); // Use capture phase
      container.addEventListener('mousedown', handleClick, true); // Also on mousedown
      return () => {
        container.removeEventListener('focus', handleFocus);
        container.removeEventListener('blur', handleBlur);
        container.removeEventListener('click', handleClick, true);
        container.removeEventListener('mousedown', handleClick, true);
      };
    }
  }, []);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full"
      style={{ backgroundColor: colorSchemes[colorScheme].background }}
      tabIndex={-1}
      onMouseDown={(e) => {
        // Prevent default to avoid stealing focus from terminal
        e.preventDefault();
        if (xtermRef.current) {
          xtermRef.current.focus();
        }
      }}
    />
  );
});

XTerminal.displayName = 'XTerminal';

// Type for accessing terminal methods from the ref
export interface XTerminalRef {
  terminalWrite: (data: string) => void;
  terminalClear: () => void;
  terminalFocus: () => void;
  terminalFit: () => void;
}

