import { GitService } from './GitService';

interface MergeOptions {
  fastForward?: boolean;
  squash?: boolean;
  message?: string;
  strategy?: 'recursive' | 'resolve' | 'octopus' | 'ours' | 'subtree';
}

interface RebaseOptions {
  onto?: string;
  interactive?: boolean;
  preserveMerges?: boolean;
}

interface CherryPickOptions {
  noCommit?: boolean;
  signoff?: boolean;
}

export class AdvancedGitService extends GitService {
  public async merge(branch: string, options: MergeOptions = {}): Promise<void> {
    try {
      const args = ['merge'];
      
      if (options.fastForward === false) args.push('--no-ff');
      if (options.squash) args.push('--squash');
      if (options.message) args.push('-m', options.message);
      if (options.strategy) args.push('--strategy', options.strategy);
      
      args.push(branch);

      await this.git.raw(args);
      this.emit('merged', { branch, options });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async rebase(branch: string, options: RebaseOptions = {}): Promise<void> {
    try {
      const args = ['rebase'];
      
      if (options.interactive) args.push('-i');
      if (options.preserveMerges) args.push('-p');
      if (options.onto) {
        args.push('--onto', options.onto);
      }
      
      args.push(branch);

      await this.git.raw(args);
      this.emit('rebased', { branch, options });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async cherryPick(commits: string[], options: CherryPickOptions = {}): Promise<void> {
    try {
      const args = ['cherry-pick'];
      
      if (options.noCommit) args.push('-n');
      if (options.signoff) args.push('-s');
      
      args.push(...commits);

      await this.git.raw(args);
      this.emit('cherryPicked', { commits, options });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async resolveConflicts(files: string[]): Promise<void> {
    try {
      await this.git.add(files);
      this.emit('conflictsResolved', files);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async getConflictMarkers(file: string): Promise<string[]> {
    try {
      const content = await this.git.show([`HEAD:${file}`]);
      return this.parseConflictMarkers(content);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private parseConflictMarkers(content: string): string[] {
    const markers: string[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('<<<<<<<') ||
          lines[i].startsWith('=======') ||
          lines[i].startsWith('>>>>>>>')) {
        markers.push(lines[i]);
      }
    }
    
    return markers;
  }

  public async createTag(tagName: string, message?: string): Promise<void> {
    try {
      if (message) {
        await this.git.tag(['-a', tagName, '-m', message]);
      } else {
        await this.git.tag([tagName]);
      }
      this.emit('tagCreated', { tagName, message });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async deleteTag(tagName: string): Promise<void> {
    try {
      await this.git.tag(['-d', tagName]);
      this.emit('tagDeleted', tagName);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async reset(commit: string, type: 'soft' | 'mixed' | 'hard' = 'mixed'): Promise<void> {
    try {
      await this.git.reset([`--${type}`, commit]);
      this.emit('reset', { commit, type });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async blame(file: string): Promise<string[]> {
    try {
      const blame = await this.git.raw(['blame', file]);
      return blame.split('\n');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
} 