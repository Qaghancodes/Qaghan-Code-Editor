import { Editor } from '../../renderer/components/Editor';
import { LanguageService } from '../../services/LanguageService';
import { ThemeService } from '../../services/ThemeService';
import { ExtensionAPI } from '../../services/ExtensionAPI';

describe('Editor Integration', () => {
  let editor: Editor;
  let languageService: LanguageService;
  let themeService: ThemeService;
  let extensionApi: ExtensionAPI;

  beforeEach(async () => {
    languageService = new LanguageService();
    themeService = new ThemeService();
    extensionApi = new ExtensionAPI();
    
    editor = new Editor('editor-container', {
      languageService,
      themeService,
      extensionApi
    });
  });

  it('should integrate with language service for completions', async () => {
    // Arrange
    await languageService.registerLanguage({
      id: 'typescript',
      completionItems: [
        { label: 'console', kind: 'class' },
        { label: 'log', kind: 'method' }
      ]
    });

    // Act
    await editor.setText('console.');
    await editor.triggerCompletion();

    // Assert
    const completions = await editor.getCompletions();
    expect(completions).toContainEqual(
      expect.objectContaining({ label: 'log' })
    );
  });

  it('should handle theme changes', async () => {
    // Arrange
    const darkTheme = {
      id: 'dark',
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4'
      }
    };

    // Act
    await themeService.setTheme(darkTheme);

    // Assert
    const editorElement = document.querySelector('.editor-container');
    const computedStyle = window.getComputedStyle(editorElement!);
    expect(computedStyle.backgroundColor).toBe('#1E1E1E');
  });

  it('should integrate with extension API for custom commands', async () => {
    // Arrange
    let commandExecuted = false;
    extensionApi.registerCommand('editor.customCommand', () => {
      commandExecuted = true;
    });

    // Act
    await editor.executeCommand('editor.customCommand');

    // Assert
    expect(commandExecuted).toBe(true);
  });

  it('should handle multiple cursor operations', async () => {
    // Arrange
    await editor.setText('first line\nsecond line\nthird line');
    
    // Act
    await editor.addCursorAtLine(1);
    await editor.addCursorAtLine(2);
    await editor.insertText('// ');

    // Assert
    const text = await editor.getText();
    expect(text).toBe('// first line\n// second line\n// third line');
  });

  it('should handle undo/redo operations', async () => {
    // Arrange
    await editor.setText('initial');
    
    // Act
    await editor.insertText(' text');
    await editor.undo();
    await editor.redo();

    // Assert
    const text = await editor.getText();
    expect(text).toBe('initial text');
  });
}); 