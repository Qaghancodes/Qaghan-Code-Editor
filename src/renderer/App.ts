import { Editor } from './components/Editor';
import { Sidebar } from './components/Sidebar';
import { FileSystemService } from '../services/FileSystemService';
import { GitService } from '../services/GitService';
import { PluginManager } from '../services/PluginManager';

export class App {
  private editor: Editor;
  private sidebar: Sidebar;
  private fs: FileSystemService;
  private git: GitService;
  private pluginManager: PluginManager;
  private sidebarVisible: boolean = true;

  constructor() {
    this.fs = new FileSystemService(process.cwd());
    this.git = new GitService(process.cwd());
    this.pluginManager = new PluginManager();
    
    this.editor = new Editor('editor-container', {
      theme: 'vs-dark',
      fontSize: 14
    });
    
    this.sidebar = new Sidebar('sidebar-container');
    
    this.initialize();
  }

  private async initialize() {
    await this.loadInitialPlugins();
    this.setupEventListeners();
    await this.git.init();
  }

  private async loadInitialPlugins() {
    // Load core plugins
    const corePlugins = [
      // Add core plugin manifests
    ];

    for (const plugin of corePlugins) {
      await this.pluginManager.loadPlugin(plugin);
      await this.pluginManager.enablePlugin(plugin.id);
    }
  }

  private setupEventListeners() {
    this.fs.on('fileOpened', ({ path, content }) => {
      this.editor.setValue(content);
    });

    this.git.on('statusChanged', (status) => {
      this.sidebar.updateGitStatus(status);
    });
  }

  public handleResize() {
    // Notify the editor to adjust its layout
    this.editor.layout();
  }

  public async saveCurrentFile() {
    const currentFile = this.editor.getCurrentFile();
    if (currentFile) {
      const content = this.editor.getValue();
      await this.fs.saveFile(currentFile.path, content);
    }
  }

  public async openFile() {
    // Implement file open dialog
    // This will need to use electron's dialog API
    const { dialog } = require('electron').remote;
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const content = await this.fs.openFile(filePath);
      this.editor.setValue(content);
    }
  }

  public toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    const sidebarElement = document.getElementById('sidebar-container');
    if (sidebarElement) {
      sidebarElement.style.display = this.sidebarVisible ? 'block' : 'none';
    }
    this.handleResize();
  }
} 