import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { ProjectContext } from './types.js';

export interface GeminiCLIConfig {
  workingDirectory: string;
  projectContext?: ProjectContext;
}

export class GeminiCLIManager {
  private process: ChildProcess | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private responseHandlers = new Map<string, (response: string) => void>();
  private errorHandlers = new Map<string, (error: string) => void>();
  private outputBuffer = '';
  private onMessage: (message: { type: string; [key: string]: unknown }) => void;

  constructor(
    onMessage: (message: { type: string; [key: string]: unknown }) => void,
    private config: GeminiCLIConfig
  ) {
    this.onMessage = onMessage;
  }

  /**
   * Initialize Gemini CLI with context from guides and project info
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      this.onMessage({ type: 'gemini:status', status: 'initializing' });

      // Load guide files
      const guidesDir = path.join(this.config.workingDirectory, 'guides');
      const vibeGuidePath = path.join(guidesDir, 'vibe-coding-guide.md');
      const taskmasterGuidePath = path.join(guidesDir, 'taskmaster-guide.md');

      let vibeGuide = '';
      let taskmasterGuide = '';

      if (fs.existsSync(vibeGuidePath)) {
        vibeGuide = fs.readFileSync(vibeGuidePath, 'utf-8');
      }

      if (fs.existsSync(taskmasterGuidePath)) {
        taskmasterGuide = fs.readFileSync(taskmasterGuidePath, 'utf-8');
      }

      // Build initialization context
      const initContext = this.buildInitializationContext(vibeGuide, taskmasterGuide);

      // Spawn Gemini CLI process
      // Note: Assuming 'gemini' CLI is available in PATH
      // You may need to adjust this based on actual Gemini CLI installation
      this.process = spawn('gemini', ['chat'], {
        cwd: this.config.workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      });

      if (!this.process) {
        throw new Error('Failed to spawn Gemini CLI process');
      }

      // Handle stdout
      this.process.stdout?.on('data', (data: Buffer) => {
        this.outputBuffer += data.toString();
        this.processOutput();
      });

      // Handle stderr
      this.process.stderr?.on('data', (data: Buffer) => {
        const error = data.toString();
        console.error('[Gemini CLI] stderr:', error);
        // Check if it's an actual error or just info
        if (error.toLowerCase().includes('error')) {
          this.onMessage({ type: 'gemini:error', error });
        }
      });

      // Handle process exit
      this.process.on('exit', (code) => {
        console.log(`[Gemini CLI] Process exited with code ${code}`);
        this.process = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        if (code !== 0 && code !== null) {
          this.onMessage({ type: 'gemini:error', error: `Process exited with code ${code}` });
        }
      });

      // Handle process error
      this.process.on('error', (error) => {
        console.error('[Gemini CLI] Process error:', error);
        this.onMessage({ type: 'gemini:error', error: error.message });
        this.process = null;
        this.isInitialized = false;
        this.initializationPromise = null;
      });

      // Send initialization context
      await this.sendInitialization(initContext);

      this.isInitialized = true;
      this.onMessage({ type: 'gemini:status', status: 'ready' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Gemini CLI] Initialization failed:', errorMessage);
      this.onMessage({ type: 'gemini:status', status: 'error' });
      this.onMessage({ type: 'gemini:error', error: errorMessage });
      throw error;
    }
  }

  /**
   * Build initialization context from guides and project info
   */
  private buildInitializationContext(vibeGuide: string, taskmasterGuide: string): string {
    const parts: string[] = [];

    parts.push(`You are Jarvis, an AI assistant integrated into the Orbit Mission Control application.`);
    parts.push(`\n## Your Role`);
    parts.push(`You help users plan and develop their software projects using the "vibe coding" methodology.`);
    parts.push(`You have access to comprehensive guides and project context to provide informed assistance.`);

    if (vibeGuide) {
      parts.push(`\n## Comprehensive Guide to Vibe Coding`);
      parts.push(vibeGuide.substring(0, 10000)); // Limit to first 10k chars
    }

    if (taskmasterGuide) {
      parts.push(`\n## TaskMaster Setup Guide`);
      parts.push(taskmasterGuide.substring(0, 10000)); // Limit to first 10k chars
    }

    if (this.config.projectContext) {
      const ctx = this.config.projectContext;
      parts.push(`\n## Current Project Context`);
      
      if (ctx.projectName) {
        parts.push(`Project Name: ${ctx.projectName}`);
      }
      
      if (ctx.description) {
        parts.push(`Description: ${ctx.description}`);
      }
      
      if (ctx.techStack) {
        parts.push(`Tech Stack:`);
        if (ctx.techStack.languages.length > 0) {
          parts.push(`- Languages: ${ctx.techStack.languages.join(', ')}`);
        }
        if (ctx.techStack.frameworks.length > 0) {
          parts.push(`- Frameworks: ${ctx.techStack.frameworks.join(', ')}`);
        }
      }
      
      if (ctx.generatedFiles && ctx.generatedFiles.length > 0) {
        parts.push(`Generated Files: ${ctx.generatedFiles.join(', ')}`);
      }
    }

    parts.push(`\n## Orbit Mission Control Information`);
    parts.push(`Orbit is a desktop application that helps developers maintain strategic context throughout AI-assisted development.`);
    parts.push(`The app enforces a workflow where Vision and User personas drive code decisions.`);
    parts.push(`Users move between rapid prototyping (Bolt.new) and production code (VS Code).`);
    parts.push(`\nYou are now onboarded and ready to assist users with their projects.`);

    return parts.join('\n');
  }

  /**
   * Send initialization context to Gemini CLI
   */
  private async sendInitialization(context: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin) {
        reject(new Error('Process not available'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Initialization timeout'));
      }, 30000); // 30 second timeout

      // Send context as initial message
      const initMessage = `\n${context}\n\nPlease acknowledge that you understand your role as Jarvis and are ready to assist.\n`;
      
      this.process.stdin.write(initMessage, (error) => {
        if (error) {
          clearTimeout(timeout);
          reject(error);
        } else {
          // Wait a bit for acknowledgment
          setTimeout(() => {
            clearTimeout(timeout);
            resolve();
          }, 2000);
        }
      });
    });
  }

  /**
   * Process accumulated output buffer
   */
  private processOutput(): void {
    // Look for complete responses (this is a simplified parser)
    // In a real implementation, you'd need to parse Gemini CLI output format
    const lines = this.outputBuffer.split('\n');
    
    // Check if we have a complete response (ends with a prompt or marker)
    // For now, we'll send chunks as they come
    if (this.outputBuffer.length > 100) {
      // Send accumulated output
      const response = this.outputBuffer;
      this.outputBuffer = '';
      
      // Try to find request ID in response (if we stored it)
      // For now, send to all pending handlers
      this.responseHandlers.forEach((handler, requestId) => {
        handler(response);
        this.responseHandlers.delete(requestId);
      });
      
      // Also send as general response
      this.onMessage({ type: 'gemini:response', response });
    }
  }

  /**
   * Send a prompt to Gemini CLI
   */
  async sendPrompt(prompt: string, requestId?: string): Promise<void> {
    if (!this.isInitialized || !this.process || !this.process.stdin) {
      // Try to initialize if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      if (!this.process || !this.process.stdin) {
        throw new Error('Gemini CLI process not available');
      }
    }

    return new Promise((resolve, reject) => {
      // Store response handler if requestId provided
      if (requestId) {
        this.responseHandlers.set(requestId, () => {
          resolve();
        });
        this.errorHandlers.set(requestId, (error) => {
          reject(new Error(error));
        });
      }

      const fullPrompt = `${prompt}\n\n`;
      this.process!.stdin!.write(fullPrompt, (error) => {
        if (error) {
          if (requestId) {
            this.responseHandlers.delete(requestId);
            this.errorHandlers.delete(requestId);
          }
          reject(error);
        } else {
          if (!requestId) {
            resolve();
          }
          // Response will be handled by processOutput
        }
      });
    });
  }

  /**
   * Stop the Gemini CLI process
   */
  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.isInitialized = false;
    this.initializationPromise = null;
    this.responseHandlers.clear();
    this.errorHandlers.clear();
    this.outputBuffer = '';
  }

  /**
   * Check if the process is running
   */
  isRunning(): boolean {
    return this.process !== null && this.isInitialized;
  }
}

