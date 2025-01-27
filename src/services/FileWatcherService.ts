import { watch, FSWatcher } from 'fs';
import { EventEmitter } from 'events';
import { debounce } from 'lodash';

interface WatchOptions {
  recursive?: boolean;
  ignorePatterns?: string[];
  debounceMs?: number;
}

export class FileWatcherService extends EventEmitter {
  private watchers: Map<string, FSWatcher> = new Map();
  private ignorePatterns: RegExp[] = [];

  constructor() {
    super();
    this.handleChange = debounce(this.handleChange.bind(this), 300);
  }

  public watch(path: string, options: WatchOptions = {}): void {
    if (this.watchers.has(path)) {
      return;
    }

    this.ignorePatterns = (options.ignorePatterns || [])
      .map(pattern => new RegExp(pattern));

    const watcher = watch(
      path,
      { recursive: options.recursive },
      (eventType, filename) => {
        if (filename && !this.isIgnored(filename)) {
          this.handleChange(eventType, filename, path);
        }
      }
    );

    this.watchers.set(path, watcher);
    watcher.on('error', (error) => {
      this.emit('error', error);
    });
  }

  private isIgnored(filename: string): boolean {
    return this.ignorePatterns.some(pattern => pattern.test(filename));
  }

  private handleChange(eventType: string, filename: string, watchPath: string) {
    this.emit('change', {
      type: eventType,
      path: filename,
      watchPath
    });
  }

  public unwatch(path: string): void {
    const watcher = this.watchers.get(path);
    if (watcher) {
      watcher.close();
      this.watchers.delete(path);
    }
  }

  public unwatchAll(): void {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers.clear();
  }
} 