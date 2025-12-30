/**
 * Gemini Terminal - PTY process management for Gemini CLI
 * Similar to terminal.ts but for Gemini CLI
 */

import { spawn, IPty } from 'node-pty';
import * as os from 'os';

export interface GeminiTerminalConfig {
  apiKey?: string;
  workingDir?: string;
}

export class GeminiTerminal {
  private pty: IPty | null = null;
  private config: GeminiTerminalConfig;

  constructor(config: GeminiTerminalConfig = {}) {
    this.config = config;
  }

  /**
   * Spawn Gemini CLI PTY process
   */
  spawn(cols: number = 80, rows: number = 24): void {
    if (this.pty) {
      console.warn('[GeminiTerminal] PTY already spawned');
      return;
    }

    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const env = { ...process.env };
    
    // Set Gemini API key if provided
    if (this.config.apiKey) {
      env.GEMINI_API_KEY = this.config.apiKey;
    }

    try {
      this.pty = spawn(shell, [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: this.config.workingDir || process.cwd(),
        env,
        shell: true,
      });

      // Initialize Gemini CLI
      this.pty.write('gemini\r');
    } catch (error) {
      console.error('[GeminiTerminal] Failed to spawn PTY:', error);
      throw error;
    }
  }

  /**
   * Write data to PTY
   */
  write(data: string): void {
    if (this.pty) {
      this.pty.write(data);
    }
  }

  /**
   * Resize PTY
   */
  resize(cols: number, rows: number): void {
    if (this.pty) {
      try {
        this.pty.resize(cols, rows);
      } catch (error) {
        console.error('[GeminiTerminal] Failed to resize:', error);
      }
    }
  }

  /**
   * Kill PTY process
   */
  kill(): void {
    if (this.pty) {
      try {
        this.pty.kill();
      } catch (error) {
        console.error('[GeminiTerminal] Failed to kill PTY:', error);
      }
      this.pty = null;
    }
  }

  /**
   * Get PTY for attaching data handler
   */
  getPty(): IPty | null {
    return this.pty;
  }

  /**
   * Check if PTY is active
   */
  isActive(): boolean {
    return this.pty !== null;
  }
}

