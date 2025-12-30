import * as pty from 'node-pty';
import type { IPty } from 'node-pty';
import type { ServerMessage } from './types.js';

// Determine shell based on platform
const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

export class TerminalManager {
  private ptyProcess: IPty | null = null;
  private onData: (message: ServerMessage) => void;
  private workingDirectory: string;

  constructor(
    onData: (message: ServerMessage) => void,
    workingDirectory: string = process.cwd()
  ) {
    this.onData = onData;
    this.workingDirectory = workingDirectory;
  }

  start(): void {
    if (this.ptyProcess) {
      console.log('[Terminal] Already running, skipping start');
      return;
    }

    try {
      console.log(`[Terminal] Starting ${shell} in ${this.workingDirectory}`);
      
      this.ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: this.workingDirectory,
        env: process.env as Record<string, string>,
      });

      this.ptyProcess.onData((data: string) => {
        this.onData({ type: 'terminal:output', data });
      });

      this.ptyProcess.onExit(({ exitCode }) => {
        console.log(`[Terminal] Process exited with code ${exitCode}`);
        this.onData({ type: 'terminal:exit', code: exitCode });
        this.ptyProcess = null;
      });

      this.onData({ type: 'terminal:ready' });
      console.log('[Terminal] Started successfully');
    } catch (error) {
      console.error('[Terminal] Failed to start:', error);
      this.onData({
        type: 'error',
        message: `Failed to start terminal: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  write(data: string): void {
    if (this.ptyProcess) {
      this.ptyProcess.write(data);
    } else {
      console.warn('[Terminal] Cannot write - process not running');
    }
  }

  resize(cols: number, rows: number): void {
    if (this.ptyProcess) {
      try {
        this.ptyProcess.resize(cols, rows);
        console.log(`[Terminal] Resized to ${cols}x${rows}`);
      } catch (error) {
        console.error('[Terminal] Resize failed:', error);
      }
    }
  }

  setWorkingDirectory(path: string): void {
    this.workingDirectory = path;
    // If terminal is running, change directory
    if (this.ptyProcess) {
      const cdCommand = process.platform === 'win32'
        ? `cd "${path}"\r`
        : `cd "${path}"\n`;
      this.write(cdCommand);
    }
  }

  getWorkingDirectory(): string {
    return this.workingDirectory;
  }

  stop(): void {
    if (this.ptyProcess) {
      console.log('[Terminal] Stopping process');
      this.ptyProcess.kill();
      this.ptyProcess = null;
    }
  }

  isRunning(): boolean {
    return this.ptyProcess !== null;
  }
}

