/**
 * Regular Terminal Handler - Claude CLI PTY management
 */

import { spawn, IPty } from 'node-pty';
import * as os from 'os';
import type { TerminalSession } from './types';

export class Terminal {
  private pty: IPty | null = null;
  private workingDirectory: string;

  constructor(workingDir: string = process.cwd()) {
    this.workingDirectory = workingDir;
  }

  /**
   * Spawn terminal PTY process
   */
  spawn(cols: number = 80, rows: number = 24): void {
    if (this.pty) {
      console.warn('[Terminal] PTY already spawned');
      return;
    }

    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const env = { ...process.env };

    try {
      this.pty = spawn(shell, [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: this.workingDirectory,
        env,
        shell: true,
      });
    } catch (error) {
      console.error('[Terminal] Failed to spawn PTY:', error);
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
        console.error('[Terminal] Failed to resize:', error);
      }
    }
  }

  /**
   * Set working directory
   */
  setWorkingDirectory(path: string): void {
    this.workingDirectory = path;
    // Send cd command to terminal
    if (this.pty) {
      const cdCommand = os.platform() === 'win32' ? `cd "${path}"\r` : `cd "${path}"\n`;
      this.pty.write(cdCommand);
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
        console.error('[Terminal] Failed to kill PTY:', error);
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

