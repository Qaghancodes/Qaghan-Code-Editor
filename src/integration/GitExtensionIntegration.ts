import { AdvancedGitService } from '../services/AdvancedGitService';
import { EnhancedExtensionAPI } from '../services/ExtensionAPIEnhancements';
import { NotificationService } from '../services/NotificationService';

export class GitExtensionIntegration {
  constructor(
    private git: AdvancedGitService,
    private extensionApi: EnhancedExtensionAPI,
    private notifications: NotificationService
  ) {
    this.initialize();
  }

  private async initialize() {
    // Register Git source control provider
    this.registerSourceControl();
    
    // Register Git commands
    this.registerGitCommands();
    
    // Register Git views
    this.registerGitViews();
    
    // Set up event handlers
    this.setupEventHandlers();
  }

  private registerSourceControl() {
    const sourceControl = this.extensionApi.scm.createSourceControl('git', 'Git');
    
    sourceControl.inputBox.placeholder = 'Commit message';
    sourceControl.acceptInputCommand = {
      id: 'git.commit',
      title: 'Commit'
    };

    this.setupResourceGroups(sourceControl);
  }

  private setupResourceGroups(sourceControl: any) {
    const stagedGroup = sourceControl.createResourceGroup('staged', 'Staged Changes');
    const unstagedGroup = sourceControl.createResourceGroup('unstaged', 'Changes');
    
    this.git.on('status', async (status) => {
      stagedGroup.resourceStates = status.staged.map(this.createResourceState);
      unstagedGroup.resourceStates = status.modified.map(this.createResourceState);
    });
  }

  private registerGitCommands() {
    this.extensionApi.commands.registerCommand('git.commit', async () => {
      try {
        const message = await this.extensionApi.window.showInputBox({
          placeHolder: 'Commit message'
        });
        
        if (message) {
          await this.git.commit(message);
          this.notifications.show({
            type: 'success',
            message: 'Changes committed successfully'
          });
        }
      } catch (error) {
        this.notifications.show({
          type: 'error',
          message: 'Failed to commit changes',
          detail: error.message
        });
      }
    });

    // Register more Git commands...
  }

  private registerGitViews() {
    // Register Git changes view
    this.extensionApi.registerCustomView({
      id: 'gitChanges',
      title: 'Changes',
      icon: 'git-branch'
    }, {
      getChildren: async () => {
        const status = await this.git.getStatus();
        return [
          ...status.staged.map(file => ({ type: 'staged', file })),
          ...status.modified.map(file => ({ type: 'modified', file }))
        ];
      },
      getTreeItem: (element: any) => ({
        label: element.file,
        description: element.type,
        collapsibleState: 'none',
        command: {
          id: 'git.openFile',
          title: 'Open File',
          arguments: [element.file]
        }
      })
    });

    // Register Git history view
    // Register Git branches view
    // etc...
  }

  private setupEventHandlers() {
    this.git.on('error', (error) => {
      this.notifications.show({
        type: 'error',
        message: 'Git operation failed',
        detail: error.message
      });
    });

    this.git.on('merged', ({ branch }) => {
      this.notifications.show({
        type: 'success',
        message: `Successfully merged branch '${branch}'`
      });
    });

    // Set up more event handlers...
  }

  private createResourceState(file: string) {
    return {
      resourceUri: { path: file },
      decorations: {
        strikeThrough: false,
        tooltip: 'Modified'
      }
    };
  }
} 