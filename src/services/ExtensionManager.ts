import { EventEmitter } from 'events';

interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  main: string;
  api: ExtensionAPI;
  dependencies?: string[];
}

interface ExtensionAPI {
  activate: () => Promise<void>;
  deactivate: () => Promise<void>;
  getCommands?: () => Command[];
  getConfiguration?: () => any;
}

export class ExtensionManager extends EventEmitter {
  private extensions: Map<string, Extension> = new Map();
  private activeExtensions: Set<string> = new Set();
  private extensionAPIs: Map<string, any> = new Map();

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    await this.loadBuiltinExtensions();
    await this.loadUserExtensions();
  }

  private async loadBuiltinExtensions() {
    // Load built-in extensions from a predefined directory
    const builtinExtensions = [
      // Add built-in extensions here
    ];

    for (const extension of builtinExtensions) {
      await this.loadExtension(extension);
    }
  }

  private async loadUserExtensions() {
    // Load user-installed extensions from user directory
    const userExtensions = await this.getUserExtensions();
    for (const extension of userExtensions) {
      await this.loadExtension(extension);
    }
  }

  public async installExtension(extensionPath: string): Promise<void> {
    try {
      const extension = await this.loadExtension(extensionPath);
      await this.activateExtension(extension.id);
      this.emit('extensionInstalled', extension);
    } catch (error) {
      this.emit('error', `Failed to install extension: ${error.message}`);
      throw error;
    }
  }

  private async loadExtension(extensionPath: string): Promise<Extension> {
    const extensionModule = await import(extensionPath);
    const extension: Extension = extensionModule.default;

    if (this.validateExtension(extension)) {
      this.extensions.set(extension.id, extension);
      return extension;
    }
    throw new Error(`Invalid extension: ${extensionPath}`);
  }

  private validateExtension(extension: Extension): boolean {
    return !!(
      extension.id &&
      extension.name &&
      extension.version &&
      extension.main &&
      extension.api &&
      typeof extension.api.activate === 'function' &&
      typeof extension.api.deactivate === 'function'
    );
  }

  public async activateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    if (this.activeExtensions.has(extensionId)) {
      return;
    }

    try {
      await extension.api.activate();
      this.activeExtensions.add(extensionId);
      this.emit('extensionActivated', extension);
    } catch (error) {
      this.emit('error', `Failed to activate extension ${extensionId}: ${error.message}`);
      throw error;
    }
  }

  public async deactivateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension || !this.activeExtensions.has(extensionId)) {
      return;
    }

    try {
      await extension.api.deactivate();
      this.activeExtensions.delete(extensionId);
      this.emit('extensionDeactivated', extension);
    } catch (error) {
      this.emit('error', `Failed to deactivate extension ${extensionId}: ${error.message}`);
      throw error;
    }
  }

  public getAPI(extensionId: string): any {
    return this.extensionAPIs.get(extensionId);
  }
} 