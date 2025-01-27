import { E2ETestRunner } from './E2ETestRunner';

describe('Feature-Specific End-to-End Tests', () => {
  let runner: E2ETestRunner;
  let context: any;

  beforeEach(async () => {
    runner = new E2ETestRunner();
    context = await runner.setup();
  });

  afterEach(async () => {
    await runner.teardown();
  });

  describe('Intellisense Features', () => {
    it('should provide accurate completions', async () => {
      const { helpers } = context;

      // Create test file
      await helpers.openFile('test.ts');
      await helpers.typeText('.editor', `
        interface User {
          name: string;
          age: number;
        }
        const user: User = {
          
        }
      `);

      // Trigger completion
      await helpers.typeText('.editor', 'n');
      await helpers.waitForElement('.completion-list');

      // Verify completion
      const completions = await helpers.getCompletionItems();
      expect(completions).toContain('name');
      expect(completions).toContain('age');
    });

    it('should show hover information', async () => {
      const { helpers } = context;

      await helpers.openFile('test.ts');
      await helpers.typeText('.editor', `
        function add(a: number, b: number): number {
          return a + b;
        }
      `);

      // Hover over function
      await helpers.hoverElement('.editor [data-token="add"]');

      // Verify hover info
      const hoverContent = await helpers.waitForElement('.hover-content');
      expect(hoverContent).toContain('(a: number, b: number) => number');
    });
  });

  describe('Git Integration Features', () => {
    it('should show inline git blame', async () => {
      const { helpers } = context;

      // Set up git repository
      await helpers.executeCommand('Initialize Repository');
      await helpers.createAndCommitFile('test.ts', 'initial content');

      // Show git blame
      await helpers.executeCommand('Toggle Git Blame');

      // Verify blame information
      const blameInfo = await helpers.waitForElement('.git-blame-info');
      expect(blameInfo).toContain('Initial commit');
    });

    it('should handle merge conflicts', async () => {
      const { helpers } = context;

      // Create branch and make changes
      await helpers.executeCommand('Create Branch');
      await helpers.typeText('.quick-input-input', 'feature');
      await helpers.editFile('test.ts', 'feature change');
      await helpers.commitChanges('Feature commit');

      // Switch to main and make conflicting changes
      await helpers.executeCommand('Switch Branch');
      await helpers.clickElement('[data-branch="main"]');
      await helpers.editFile('test.ts', 'main change');
      await helpers.commitChanges('Main commit');

      // Merge and handle conflict
      await helpers.executeCommand('Merge Branch');
      await helpers.clickElement('[data-branch="feature"]');

      // Verify conflict markers
      const editorContent = await helpers.getEditorContent();
      expect(editorContent).toContain('<<<<<<<');
      expect(editorContent).toContain('=======');
      expect(editorContent).toContain('>>>>>>>');
    });
  });

  describe('Debug Features', () => {
    it('should handle conditional breakpoints', async () => {
      const { helpers } = context;

      // Create test file with loop
      await helpers.openFile('debug.ts');
      await helpers.typeText('.editor', `
        for (let i = 0; i < 10; i++) {
          console.log(i);
        }
      `);

      // Set conditional breakpoint
      await helpers.rightClick('.editor-gutter-line-2');
      await helpers.clickElement('.context-menu-item[data-action="add-conditional-breakpoint"]');
      await helpers.typeText('.breakpoint-condition-input', 'i === 5');

      // Start debugging
      await helpers.executeCommand('Start Debugging');

      // Verify break condition
      const debugVariable = await helpers.waitForElement('.debug-variable[data-name="i"]');
      expect(await debugVariable.getText()).toBe('5');
    });
  });
}); 