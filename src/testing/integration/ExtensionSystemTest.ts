import { ExtensionAPI } from '../../services/ExtensionAPI';
import { ExtensionManager } from '../../services/ExtensionManager';
import { NotificationService } from '../../services/NotificationService';
import { WorkspaceService } from '../../services/WorkspaceService';

describe('Extension System Integration', () => {
  let extensionApi: ExtensionAPI;
  let extensionManager: ExtensionManager;
  let notifications: NotificationService;
  let workspace: WorkspaceService;

  beforeEach(() => {
    notifications = new NotificationService();
    workspace = new WorkspaceService();
    extensionApi = new ExtensionAPI();
    extensionManager = new ExtensionManager(extensionApi, notifications, workspace);
  });

  it('should load and activate extension', async () => {
    // Arrange
    const testExtension = {
      id: 'test.extension',
      name: 'Test Extension',
      version: '1.0.0',
      main: './dist/extension.js',
      contributes: {
        commands: [{
          id: 'test.command',
          title: 'Test Command'
        }]
      }
    };

    // Act
    await extensionManager.loadExtension(testExtension);
    await extensionManager.activateExtension('test.extension');

    // Assert
    const commands = extensionApi.getCommands();
    expect(commands).toContain('test.command');
    
    const notifications = await getNotifications();
    expect(notifications).toContain('Extension Test Extension activated');
  });

  it('should handle extension API events', async () => {
    // Arrange
    let eventFired = false;
    extensionApi.workspace.onDidChangeTextDocument(() => {
      eventFired = true;
    });

    // Act
    await workspace.openFile('test.ts');
    await workspace.editFile('test.ts', 'new content');

    // Assert
    expect(eventFired).toBe(true);
  });

  it('should handle extension errors gracefully', async () => {
    // Arrange
    const errorExtension = {
      id: 'error.extension',
      name: 'Error Extension',
      main: './dist/error-extension.js'
    };

    // Act
    try {
      await extensionManager.loadExtension(errorExtension);
    } catch (error) {
      // Assert
      const notifications = await getNotifications();
      expect(notifications).toContain('Failed to load extension Error Extension');
    }
  });
});

async function getNotifications(): Promise<string[]> {
  // Implementation to get notifications
  return [];
} 