import { E2ETestRunner } from './E2ETestRunner';

describe('Advanced End-to-End Workflows', () => {
  let runner: E2ETestRunner;
  let context: any;

  beforeEach(async () => {
    runner = new E2ETestRunner();
    context = await runner.setup();
  });

  afterEach(async () => {
    await runner.teardown();
  });

  it('should handle debugging workflow', async () => {
    const { helpers } = context;

    // Set up test file with breakpoint
    await helpers.openFile('debug-test.ts');
    await helpers.typeText('.editor', `
      function calculateSum(a: number, b: number): number {
        let result = a + b;
        return result;
      }
      
      console.log(calculateSum(5, 3));
    `);

    // Set breakpoint
    await helpers.clickElement('.editor-gutter-line-4');
    
    // Start debugging
    await helpers.executeCommand('Start Debugging');
    
    // Wait for breakpoint hit
    await helpers.waitForElement('.debug-breakpoint-hit');
    
    // Check variable value
    const variableValue = await helpers.waitForElement('.debug-variable-value');
    expect(await variableValue.getText()).toBe('8');

    // Continue execution
    await helpers.clickElement('.debug-continue');
    
    // Verify debug session ended
    await helpers.waitForElement('.debug-stopped');
  });

  it('should handle workspace symbols navigation', async () => {
    const { helpers } = context;

    // Open multiple files with symbols
    await helpers.openFile('file1.ts');
    await helpers.typeText('.editor', `
      class TestClass {
        testMethod() {}
      }
    `);

    await helpers.openFile('file2.ts');
    await helpers.typeText('.editor', `
      interface TestInterface {
        property: string;
      }
    `);

    // Open symbols
    await helpers.executeCommand('Go to Symbol in Workspace');
    await helpers.typeText('.quick-input-input', 'Test');

    // Verify symbols are found
    const symbols = await helpers.waitForElement('.quick-input-list');
    expect(symbols).toContain('TestClass');
    expect(symbols).toContain('TestInterface');

    // Navigate to symbol
    await helpers.clickElement('[data-symbol-name="TestClass"]');
    
    // Verify navigation
    const activeTab = await helpers.waitForElement('.tab.active');
    expect(activeTab).toContain('file1.ts');
  });

  it('should handle multiple terminal sessions', async () => {
    const { helpers } = context;

    // Create terminals
    await helpers.executeCommand('Create New Terminal');
    await helpers.executeCommand('Create New Terminal');

    // Switch between terminals
    await helpers.clickElement('[data-terminal-id="1"]');
    await helpers.typeText('.terminal-input', 'echo "Terminal 1"');
    
    await helpers.clickElement('[data-terminal-id="2"]');
    await helpers.typeText('.terminal-input', 'echo "Terminal 2"');

    // Verify terminal output
    const terminal1Output = await helpers.waitForElement('[data-terminal-id="1"] .terminal-output');
    const terminal2Output = await helpers.waitForElement('[data-terminal-id="2"] .terminal-output');
    
    expect(terminal1Output).toContain('Terminal 1');
    expect(terminal2Output).toContain('Terminal 2');
  });
}); 