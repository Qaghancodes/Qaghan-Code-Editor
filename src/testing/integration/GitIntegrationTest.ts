import { AdvancedGitService } from '../../services/AdvancedGitService';
import { EnhancedExtensionAPI } from '../../services/ExtensionAPIEnhancements';
import { NotificationService } from '../../services/NotificationService';
import { GitExtensionIntegration } from '../../integration/GitExtensionIntegration';
import { TestRunner } from '../TestRunner';

describe('GitExtensionIntegration', () => {
  let gitService: AdvancedGitService;
  let extensionApi: EnhancedExtensionAPI;
  let notifications: NotificationService;
  let integration: GitExtensionIntegration;

  beforeEach(() => {
    gitService = new AdvancedGitService({ basePath: '/tmp/test-repo' });
    extensionApi = new EnhancedExtensionAPI();
    notifications = new NotificationService();
    integration = new GitExtensionIntegration(
      gitService,
      extensionApi,
      notifications
    );
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should handle git commit operation', async () => {
    // Arrange
    const commitMessage = 'test commit';
    const mockInputBox = jest.fn().mockResolvedValue(commitMessage);
    extensionApi.window.showInputBox = mockInputBox;

    // Act
    await extensionApi.commands.executeCommand('git.commit');

    // Assert
    expect(mockInputBox).toHaveBeenCalled();
    expect(gitService.commit).toHaveBeenCalledWith(commitMessage);
    expect(notifications.show).toHaveBeenCalledWith({
      type: 'success',
      message: 'Changes committed successfully'
    });
  });

  it('should handle git merge operation', async () => {
    // Arrange
    const branchName = 'feature-branch';
    const mockQuickPick = jest.fn().mockResolvedValue({ label: branchName });
    extensionApi.window.showQuickPick = mockQuickPick;

    // Act
    await extensionApi.commands.executeCommand('git.merge');

    // Assert
    expect(mockQuickPick).toHaveBeenCalled();
    expect(gitService.merge).toHaveBeenCalledWith(branchName, {});
    expect(notifications.show).toHaveBeenCalledWith({
      type: 'success',
      message: `Successfully merged branch '${branchName}'`
    });
  });

  it('should update source control groups on git status change', async () => {
    // Arrange
    const mockStatus = {
      staged: ['file1.txt'],
      modified: ['file2.txt'],
      untracked: []
    };

    // Act
    gitService.emit('status', mockStatus);

    // Assert
    const sourceControl = extensionApi.scm.getSourceControl('git');
    const stagedGroup = sourceControl.getResourceGroup('staged');
    const unstagedGroup = sourceControl.getResourceGroup('unstaged');

    expect(stagedGroup.resourceStates).toHaveLength(1);
    expect(stagedGroup.resourceStates[0].resourceUri.path).toBe('file1.txt');
    expect(unstagedGroup.resourceStates).toHaveLength(1);
    expect(unstagedGroup.resourceStates[0].resourceUri.path).toBe('file2.txt');
  });

  // Add more integration tests...
});

async function cleanup() {
  // Cleanup test repository
} 