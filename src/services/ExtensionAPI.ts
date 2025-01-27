import { EventEmitter } from 'events';

interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  main: string;
  contributes?: {
    commands?: CommandContribution[];
    views?: ViewContribution[];
    menus?: MenuContribution[];
    keybindings?: KeybindingContribution[];
  };
}

interface CommandContribution {
  id: string;
  title: string;
  category?: string;
}

interface ViewContribution {
  id: string;
  name: string;
  location: 'sidebar' | 'panel' | 'statusbar';
}

interface MenuContribution {
  command: string;
  when?: string;
  group?: string;
}

interface KeybindingContribution {
  command: string;
  key: string;
  when?: string;
}

export class ExtensionAPI extends EventEmitter {
  private extensions: Map<string, ExtensionManifest> = new Map();
  private activatedExtensions: Set<string> = new Set();
  private extensionContexts: Map<string, ExtensionContext> = new Map();

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    // Set up extension host environment
    this.registerBuiltinAPIs();
  }

  private registerBuiltinAPIs() {
    // Register core APIs available to extensions
    const apis = {
      workspace: {
        onDidChangeTextDocument: this.createEventEmitter(),
        onDidSaveTextDocument: this.createEventEmitter(),
        getConfiguration: (section?: string) => {
          // Implementation for getting workspace configuration
        },
        findFiles: async (include: string, exclude?: string) => {
          // Implementation for file search
        }
      },
      
      window: {
        showInformationMessage: (message: string, ...items: string[]) => {
          return this.showMessage('info', message, items);
        },
        showErrorMessage: (message: string, ...items: string[]) => {
          return this.showMessage('error', message, items);
        },
        createOutputChannel: (name: string) => {
          return this.createOutputChannel(name);
        },
        createWebviewPanel: (viewType: string, title: string, options: any) => {
          return this.createWebviewPanel(viewType, title, options);
        }
      },
      
      commands: {
        registerCommand: (id: string, callback: (...args: any[]) => any) => {
          return this.registerCommand(id, callback);
        },
        executeCommand: (id: string, ...args: any[]) => {
          return this.executeCommand(id, ...args);
        }
      },
      
      languages: {
        registerCompletionItemProvider: (language: string, provider: any) => {
          return this.registerCompletionProvider(language, provider);
        },
        registerHoverProvider: (language: string, provider: any) => {
          return this.registerHoverProvider(language, provider);
        }
      }
    };

    return apis;
  }

  public async loadExtension(manifest: ExtensionManifest): Promise<void> {
    try {
      const extensionModule = await import(manifest.main);
      const context = this.createExtensionContext(manifest);
      
      this.extensions.set(manifest.id, manifest);
      this.extensionContexts.set(manifest.id, context);

      if (typeof extensionModule.activate === 'function') {
        await extensionModule.activate(context);
        this.activatedExtensions.add(manifest.id);
      }

      this.registerContributions(manifest);
    } catch (error) {
      console.error(`Failed to load extension ${manifest.id}:`, error);
      throw error;
    }
  }

  private createExtensionContext(manifest: ExtensionManifest): ExtensionContext {
    return {
      subscriptions: [],
      extensionPath: '', // Set actual path
      storagePath: '', // Set actual path
      globalState: new MemoryStorage(),
      workspaceState: new MemoryStorage(),
      extensionUri: null, // Set actual URI
      environmentVariableCollection: new Map(),
      extensionMode: 'development', // Or 'production'
      logPath: '', // Set actual path
    };
  }

  private registerContributions(manifest: ExtensionManifest) {
    const { contributes } = manifest;
    if (!contributes) return;

    // Register commands
    contributes.commands?.forEach(command => {
      this.registerCommand(command.id, () => {
        this.executeCommand(command.id);
      });
    });

    // Register views
    contributes.views?.forEach(view => {
      this.registerView(view);
    });

    // Register menus
    contributes.menus?.forEach(menu => {
      this.registerMenuItem(menu);
    });

    // Register keybindings
    contributes.keybindings?.forEach(keybinding => {
      this.registerKeybinding(keybinding);
    });
  }

  private registerCommand(id: string, callback: (...args: any[]) => any) {
    // Implementation for command registration
  }

  private registerView(view: ViewContribution) {
    // Implementation for view registration
  }

  private registerMenuItem(menu: MenuContribution) {
    // Implementation for menu item registration
  }

  private registerKeybinding(keybinding: KeybindingContribution) {
    // Implementation for keybinding registration
  }

  private createEventEmitter() {
    const emitter = new EventEmitter();
    return {
      event: (listener: (...args: any[]) => any) => {
        emitter.on('event', listener);
        return {
          dispose: () => {
            emitter.removeListener('event', listener);
          }
        };
      },
      fire: (...args: any[]) => {
        emitter.emit('event', ...args);
      }
    };
  }

  public async deactivateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension || !this.activatedExtensions.has(extensionId)) {
      return;
    }

    try {
      const extensionModule = await import(extension.main);
      if (typeof extensionModule.deactivate === 'function') {
        await extensionModule.deactivate();
      }
      this.activatedExtensions.delete(extensionId);
    } catch (error) {
      console.error(`Failed to deactivate extension ${extensionId}:`, error);
      throw error;
    }
  }
}

class MemoryStorage {
  private storage = new Map<string, any>();

  public get<T>(key: string): T | undefined {
    return this.storage.get(key);
  }

  public update(key: string, value: any): void {
    this.storage.set(key, value);
  }

  public delete(key: string): void {
    this.storage.delete(key);
  }
} 