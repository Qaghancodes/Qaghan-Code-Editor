import { E2ETestRunner } from './E2ETestRunner';

describe('End-to-End Workflows', () => {
  let runner: E2ETestRunner;
  let context: any;

  beforeEach(async () => {
    runner = new E2ETestRunner();
    context = await runner.setup();
  });

  afterEach(async () => {
    await runner.teardown();
  });

  it('should complete basic editing workflow', async () => {
    const { helpers } = context;

    // Open a new file
    await helpers.executeCommand('New File');
    await helpers.typeText('.editor', 'function test() {\n  return true;\n}');

    // Save the file
    await helpers.executeCommand('Save');
    await helpers.typeText('.quick-input-input', 'test.ts');
    await helpers.clickElement('.quick-input-button');

    // Verify file is saved
    const notifications = await helpers.getNotifications();
    expect(notifications).toContain('File saved successfully');

    // Open command palette and format document
    await helpers.executeCommand('Format Document');

    // Verify formatting
    const editorContent = await helpers.waitForElement('.editor');
    const text = await editorContent.getText();
    expect(text).toMatch(/function test\(\) {\n  return true;\n}/);
  });

  it('should handle git workflow', async () => {
    const { helpers } = context;

    // Create and modify file
    await helpers.executeCommand('New File');
    await helpers.typeText('.editor', 'console.log("test");');
    await helpers.executeCommand('Save');
    await helpers.typeText('.quick-input-input', 'index.ts');
    await helpers.clickElement('.quick-input-button');

    // Stage changes
    await helpers.clickElement('.source-control-button');
    await helpers.clickElement('.stage-changes-button');

    // Commit changes
    await helpers.typeText('.source-control-input', 'Initial commit');
    await helpers.clickElement('.commit-button');

    // Verify commit
    const notifications = await helpers.getNotifications();
    expect(notifications).toContain('Changes committed successfully');
  });

  it('should handle search and replace workflow', async () => {
    const { helpers } = context;

    // Open file
    await helpers.openFile('test.ts');

    // Perform search
    await helpers.executeCommand('Find in Files');
    await helpers.typeText('.search-input', 'function');
    
    // Wait for search results
    const searchResults = await helpers.waitForElement('.search-result-item');
    expect(searchResults).toBeTruthy();

    // Replace occurrence
    await helpers.clickElement('.replace-button');
    await helpers.typeText('.replace-input', 'const');
    await helpers.clickElement('.replace-all-button');

    // Verify replacement
    const editorContent = await helpers.waitForElement('.editor');
    const text = await editorContent.getText();
    expect(text).not.toContain('function');
    expect(text).toContain('const');
  });
}); 