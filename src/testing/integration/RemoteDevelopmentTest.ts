import { RemoteDevelopmentService } from '../../services/RemoteDevelopmentService';
import { WorkspaceService } from '../../services/WorkspaceService';
import { FileSystemService } from '../../services/FileSystemService';
import { LanguageService } from '../../services/LanguageService';

describe('Remote Development Integration', () => {
  let remote: RemoteDevelopmentService;
  let workspace: WorkspaceService;
  let fileSystem: FileSystemService;
  let language: LanguageService;

  beforeEach(async () => {
    fileSystem = new FileSystemService();
    language = new LanguageService();
    workspace = new WorkspaceService({ fileSystem, language });
    remote = new RemoteDevelopmentService({
      workspace,
      connectionOptions: {
        host: 'test-host',
        port: 8080,
        secure: true
      }
    });
  });

  it('should handle remote workspace operations', async () => {
    // Arrange
    await remote.connect();
    
    // Act
    await remote.createFile('remote.ts', 'console.log("remote");');
    const files = await remote.listFiles();
    
    // Assert
    expect(files).toContain('remote.ts');
    
    const content = await remote.readFile('remote.ts');
    expect(content).toContain('console.log("remote")');
  });

  it('should synchronize file changes', async () => {
    // Arrange
    await remote.connect();
    let changeDetected = false;
    
    remote.onFileChange(() => {
      changeDetected = true;
    });

    // Act
    await workspace.createFile('local.ts', 'local content');
    await remote.synchronize();

    // Assert
    expect(changeDetected).toBe(true);
    const remoteContent = await remote.readFile('local.ts');
    expect(remoteContent).toBe('local content');
  });

  it('should handle remote language features', async () => {
    // Arrange
    await remote.connect();
    await remote.createFile('test.ts', `
      interface Test {
        property: string;
      }
    `);

    // Act
    const completions = await remote.getCompletions('test.ts', {
      line: 2,
      character: 8
    });

    // Assert
    expect(completions).toContainEqual(
      expect.objectContaining({ label: 'property' })
    );
  });

  it('should handle connection interruptions', async () => {
    // Arrange
    await remote.connect();
    await remote.createFile('test.ts', 'content');

    // Act
    await remote.disconnect();
    await remote.reconnect();

    // Assert
    const content = await remote.readFile('test.ts');
    expect(content).toBe('content');
  });

  it('should handle concurrent remote operations', async () => {
    // Arrange
    await remote.connect();
    
    // Act
    const operations = [
      remote.createFile('file1.ts', 'content 1'),
      remote.createFile('file2.ts', 'content 2'),
      remote.createDirectory('folder'),
      remote.createFile('folder/file3.ts', 'content 3')
    ];

    await Promise.all(operations);

    // Assert
    const files = await remote.listFiles('**/*.ts');
    expect(files).toHaveLength(3);
  });
}); 