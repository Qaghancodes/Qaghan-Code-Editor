import { WorkspaceService } from '../../services/WorkspaceService';
import { FileSystemService } from '../../services/FileSystemService';
import { GitService } from '../../services/GitService';
import { SearchProvider } from '../../services/SearchProvider';
import { LanguageService } from '../../services/LanguageService';

describe('WorkspaceService Integration', () => {
  let workspace: WorkspaceService;
  let fileSystem: FileSystemService;
  let git: GitService;
  let search: SearchProvider;
  let language: LanguageService;

  beforeEach(async () => {
    fileSystem = new FileSystemService();
    git = new GitService({ basePath: '/tmp/test-workspace' });
    search = new SearchProvider();
    language = new LanguageService();
    
    workspace = new WorkspaceService({
      fileSystem,
      git,
      search,
      language
    });

    await workspace.initialize('/tmp/test-workspace');
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should handle file operations with git integration', async () => {
    // Arrange
    const filePath = 'src/test.ts';
    const content = 'console.log("test");';

    // Act
    await workspace.createFile(filePath, content);
    await workspace.stage([filePath]);
    await workspace.commit('Initial commit');

    // Assert
    const status = await git.getStatus();
    expect(status.staged).toHaveLength(0);
    expect(status.modified).toHaveLength(0);

    const fileExists = await fileSystem.exists(filePath);
    expect(fileExists).toBe(true);
  });

  it('should handle workspace-wide search with language features', async () => {
    // Arrange
    await workspace.createFile('src/file1.ts', 'function test1() {}');
    await workspace.createFile('src/file2.ts', 'function test2() {}');

    // Act
    const searchResults = await workspace.search('function', {
      includePattern: ['*.ts'],
      useRegex: false
    });

    const symbols = await workspace.getSymbols('*.ts');

    // Assert
    expect(searchResults).toHaveLength(2);
    expect(symbols).toContainEqual(
      expect.objectContaining({ name: 'test1' })
    );
  });

  it('should handle concurrent file operations', async () => {
    // Arrange
    const operations = [
      workspace.createFile('file1.ts', 'content 1'),
      workspace.createFile('file2.ts', 'content 2'),
      workspace.createFile('file3.ts', 'content 3')
    ];

    // Act
    await Promise.all(operations);

    // Assert
    const files = await workspace.getFiles('*.ts');
    expect(files).toHaveLength(3);

    const status = await git.getStatus();
    expect(status.untracked).toHaveLength(3);
  });

  it('should handle file watching and git status updates', async () => {
    // Arrange
    const filePath = 'src/watched.ts';
    let fileChangeCount = 0;
    let gitStatusChangeCount = 0;

    workspace.onFileChange(() => fileChangeCount++);
    workspace.onGitStatusChange(() => gitStatusChangeCount++);

    // Act
    await workspace.createFile(filePath, 'initial content');
    await workspace.editFile(filePath, 'updated content');
    await workspace.stage([filePath]);

    // Assert
    expect(fileChangeCount).toBe(2); // create + edit
    expect(gitStatusChangeCount).toBeGreaterThan(0);
  });

  it('should handle language service integration', async () => {
    // Arrange
    const filePath = 'src/code.ts';
    const content = `
      interface Test {
        property: string;
      }
      const test: Test = { property: "value" };
    `;

    // Act
    await workspace.createFile(filePath, content);
    const diagnostics = await workspace.getDiagnostics(filePath);
    const completions = await workspace.getCompletions(filePath, { line: 5, character: 12 });

    // Assert
    expect(diagnostics).toHaveLength(0); // No errors
    expect(completions).toContainEqual(
      expect.objectContaining({ label: 'property' })
    );
  });
}); 