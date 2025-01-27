import { WorkspaceService } from '../../services/WorkspaceService';
import { FileSystemService } from '../../services/FileSystemService';
import { GitService } from '../../services/GitService';
import { NotificationService } from '../../services/NotificationService';

describe('Workspace Integration', () => {
  let workspace: WorkspaceService;
  let fileSystem: FileSystemService;
  let git: GitService;
  let notifications: NotificationService;

  beforeEach(() => {
    fileSystem = new FileSystemService();
    git = new GitService({ basePath: '/tmp/test-workspace' });
    notifications = new NotificationService();
    workspace = new WorkspaceService(fileSystem, git, notifications);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should handle workspace initialization with git repository', async () => {
    // Arrange
    const workspacePath = '/tmp/test-workspace';
    const initialFiles = [
      { path: 'src/index.ts', content: 'console.log("Hello");' },
      { path: 'package.json', content: '{"name": "test"}' }
    ];

    // Act
    await workspace.initialize(workspacePath);
    for (const file of initialFiles) {
      await fileSystem.writeFile(
        `${workspacePath}/${file.path}`,
        file.content
      );
    }

    // Assert
    const status = await git.getStatus();
    expect(status.untracked).toHaveLength(2);
    
    const files = await workspace.getFiles();
    expect(files).toHaveLength(2);
    expect(files[0].path).toContain('index.ts');
  });

  it('should handle file changes and git status updates', async () => {
    // Arrange
    const workspacePath = '/tmp/test-workspace';
    await workspace.initialize(workspacePath);
    
    // Act
    await fileSystem.writeFile(
      `${workspacePath}/test.ts`,
      'console.log("Test");'
    );
    await git.add('test.ts');
    await git.commit('Initial commit');
    
    await fileSystem.writeFile(
      `${workspacePath}/test.ts`,
      'console.log("Updated");'
    );

    // Assert
    const status = await git.getStatus();
    expect(status.modified).toHaveLength(1);
    expect(status.modified[0]).toBe('test.ts');

    const notifications = await getNotifications();
    expect(notifications).toContainEqual(
      expect.objectContaining({
        type: 'info',
        message: expect.stringContaining('File changed')
      })
    );
  });

  it('should handle concurrent file operations', async () => {
    // Arrange
    const workspacePath = '/tmp/test-workspace';
    await workspace.initialize(workspacePath);
    
    // Act
    const operations = [
      fileSystem.writeFile(`${workspacePath}/file1.ts`, 'content 1'),
      fileSystem.writeFile(`${workspacePath}/file2.ts`, 'content 2'),
      fileSystem.writeFile(`${workspacePath}/file3.ts`, 'content 3')
    ];

    await Promise.all(operations);
    await git.add('*.ts');
    
    // Assert
    const status = await git.getStatus();
    expect(status.staged).toHaveLength(3);
    
    const files = await workspace.getFiles('*.ts');
    expect(files).toHaveLength(3);
  });

  it('should handle workspace search across files', async () => {
    // Arrange
    const workspacePath = '/tmp/test-workspace';
    await workspace.initialize(workspacePath);
    
    await fileSystem.writeFile(
      `${workspacePath}/file1.ts`,
      'function test() { return true; }'
    );
    await fileSystem.writeFile(
      `${workspacePath}/file2.ts`,
      'function another() { return false; }'
    );

    // Act
    const results = await workspace.search('function', {
      include: '*.ts',
      caseSensitive: false
    });

    // Assert
    expect(results).toHaveLength(2);
    expect(results[0].matches).toHaveLength(1);
    expect(results[1].matches).toHaveLength(1);
  });
});

async function cleanup() {
  // Cleanup test workspace
  const rimraf = require('rimraf');
  await new Promise(resolve => rimraf('/tmp/test-workspace', resolve));
}

async function getNotifications(): Promise<any[]> {
  // Helper to get notifications from the service
  return [];
} 