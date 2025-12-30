import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import type { ServerMessage } from './types.js';

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private onEvent: (message: ServerMessage) => void;
  private watchPath: string | null = null;

  constructor(onEvent: (message: ServerMessage) => void) {
    this.onEvent = onEvent;
  }

  start(directoryPath: string): void {
    if (this.watcher) {
      this.stop();
    }

    this.watchPath = directoryPath;
    console.log(`[Watcher] Starting watch on: ${directoryPath}`);

    // Watch the directory with sensible defaults
    this.watcher = chokidar.watch(directoryPath, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/*.log',
        '**/package-lock.json',
        '**/.DS_Store',
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    this.watcher
      .on('add', (filePath) => {
        const relativePath = path.relative(directoryPath, filePath);
        console.log(`[Watcher] File added: ${relativePath}`);
        this.onEvent({
          type: 'file:changed',
          path: relativePath,
          event: 'add',
        });
      })
      .on('change', (filePath) => {
        const relativePath = path.relative(directoryPath, filePath);
        console.log(`[Watcher] File changed: ${relativePath}`);
        this.onEvent({
          type: 'file:changed',
          path: relativePath,
          event: 'change',
        });
      })
      .on('unlink', (filePath) => {
        const relativePath = path.relative(directoryPath, filePath);
        console.log(`[Watcher] File removed: ${relativePath}`);
        this.onEvent({
          type: 'file:changed',
          path: relativePath,
          event: 'unlink',
        });
      })
      .on('error', (error) => {
        console.error('[Watcher] Error:', error);
        this.onEvent({
          type: 'error',
          message: `File watcher error: ${error.message}`,
        });
      })
      .on('ready', () => {
        console.log('[Watcher] Ready and watching for changes');
      });
  }

  stop(): void {
    if (this.watcher) {
      console.log('[Watcher] Stopping');
      this.watcher.close();
      this.watcher = null;
      this.watchPath = null;
    }
  }

  getWatchPath(): string | null {
    return this.watchPath;
  }

  isWatching(): boolean {
    return this.watcher !== null;
  }
}

