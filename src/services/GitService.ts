import { SimpleGit, simpleGit, SimpleGitOptions } from 'simple-git';
import { EventEmitter } from 'events';

interface GitConfig {
  basePath: string;
  username?: string;
  email?: string;
}

interface GitStatus {
  branch: string;
  tracking: string | null;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  conflicts: string[];
}

interface GitDiff {
  file: string;
  hunks: GitHunk[];
}

interface GitHunk {
  content: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
}

export class GitService extends EventEmitter {
  private git: SimpleGit;
  private config: GitConfig;
  private statusPollingInterval?: NodeJS.Timeout;

  constructor(config: GitConfig) {
    super();
    this.config = config;
    
    const options: SimpleGitOptions = {
      baseDir: config.basePath,
      binary: 'git',
      maxConcurrentProcesses: 6,
    };

    this.git = simpleGit(options);
    this.initialize();
  }

  private async initialize() {
    try {
      await this.git.init();
      if (this.config.username && this.config.email) {
        await this.setUserConfig();
      }
      this.startStatusPolling();
    } catch (error) {
      this.emit('error', error);
    }
  }

  private async setUserConfig() {
    if (this.config.username) {
      await this.git.addConfig('user.name', this.config.username);
    }
    if (this.config.email) {
      await this.git.addConfig('user.email', this.config.email);
    }
  }

  private startStatusPolling(interval: number = 5000) {
    this.statusPollingInterval = setInterval(async () => {
      try {
        const status = await this.getStatus();
        this.emit('status', status);
      } catch (error) {
        this.emit('error', error);
      }
    }, interval);
  }

  public async getStatus(): Promise<GitStatus> {
    const status = await this.git.status();
    return {
      branch: status.current,
      tracking: status.tracking,
      ahead: status.ahead,
      behind: status.behind,
      staged: status.staged,
      modified: status.modified,
      untracked: status.not_added,
      conflicts: status.conflicted
    };
  }

  public async add(files: string | string[]): Promise<void> {
    try {
      await this.git.add(files);
      this.emit('filesStaged', files);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async commit(message: string, options: { amend?: boolean } = {}): Promise<void> {
    try {
      await this.git.commit(message, { '--amend': options.amend });
      this.emit('committed', { message, options });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async checkout(branch: string, options: { create?: boolean } = {}): Promise<void> {
    try {
      if (options.create) {
        await this.git.checkoutLocalBranch(branch);
      } else {
        await this.git.checkout(branch);
      }
      this.emit('checkout', branch);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async pull(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    try {
      await this.git.pull(remote, branch);
      this.emit('pulled', { remote, branch });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async push(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    try {
      await this.git.push(remote, branch);
      this.emit('pushed', { remote, branch });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async getDiff(file?: string): Promise<GitDiff[]> {
    try {
      const diff = await this.git.diff(['--unified=3', file].filter(Boolean));
      return this.parseDiff(diff);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private parseDiff(diff: string): GitDiff[] {
    // Implementation of diff parsing logic
    // This would parse the git diff output into a structured format
    return [];
  }

  public async getLog(options: { maxCount?: number, branch?: string } = {}): Promise<any[]> {
    try {
      const logOptions = {
        maxCount: options.maxCount || 50,
        ...(options.branch && { branch: options.branch })
      };
      
      return await this.git.log(logOptions);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async stash(message?: string): Promise<void> {
    try {
      if (message) {
        await this.git.stash(['save', message]);
      } else {
        await this.git.stash();
      }
      this.emit('stashed', message);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async stashPop(): Promise<void> {
    try {
      await this.git.stash(['pop']);
      this.emit('stashPopped');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public dispose() {
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval);
    }
  }
} 