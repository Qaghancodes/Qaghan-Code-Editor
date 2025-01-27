import { EventEmitter } from 'events';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface ProjectConfig {
  name: string;
  root: string;
  excludePatterns: string[];
  buildCommand?: string;
  testCommand?: string;
  environments: {
    [key: string]: { [key: string]: string };
  };
}

export class ProjectManagerService extends EventEmitter {
  private projects: Map<string, ProjectConfig> = new Map();
  private activeProject?: string;
  private configPath: string = 'projects.json';

  constructor() {
    super();
    this.loadProjects();
  }

  private async loadProjects() {
    try {
      const data = await readFile(this.configPath, 'utf-8');
      const projects = JSON.parse(data);
      projects.forEach((project: ProjectConfig) => {
        this.projects.set(project.name, project);
      });
    } catch (error) {
      this.emit('error', 'Failed to load projects');
    }
  }

  public async saveProjects() {
    try {
      const data = JSON.stringify(Array.from(this.projects.values()), null, 2);
      await writeFile(this.configPath, data, 'utf-8');
    } catch (error) {
      this.emit('error', 'Failed to save projects');
    }
  }

  public async addProject(config: ProjectConfig) {
    this.projects.set(config.name, config);
    await this.saveProjects();
    this.emit('projectAdded', config);
  }

  public async removeProject(name: string) {
    if (this.projects.delete(name)) {
      await this.saveProjects();
      this.emit('projectRemoved', name);
    }
  }

  public async setActiveProject(name: string) {
    if (this.projects.has(name)) {
      this.activeProject = name;
      this.emit('activeProjectChanged', name);
    }
  }

  public getActiveProject(): ProjectConfig | undefined {
    return this.activeProject ? this.projects.get(this.activeProject) : undefined;
  }

  public getAllProjects(): ProjectConfig[] {
    return Array.from(this.projects.values());
  }
} 