import { Editor } from '../../renderer/components/Editor';
import { TaskRunner } from '../../services/TaskRunner';
import { SnippetManager } from '../../services/SnippetManager';

describe('Editor Integration', () => {
  let editor: Editor;
  let taskRunner: TaskRunner;
  let snippetManager: SnippetManager;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="editor-container"></div>';
    
    editor = new Editor('editor-container', {
      theme: 'vs-dark',
      language: 'typescript'
    });
    
    taskRunner = new TaskRunner();
    snippetManager = new SnippetManager(localStorage);
  });

  it('should integrate with task runner', async () => {
    const task = {
      id: 'format',
      name: 'Format Code',
      command: 'prettier',
      args: ['--write', 'test.ts']
    };

    taskRunner.registerTask(task);
    await taskRunner.runTask('format');
    
    // Verify editor content is formatted
    expect(editor.getValue()).toMatch(/formatted content/);
  });

  it('should integrate with snippet manager', () => {
    const snippet = {
      id: 'react-component',
      name: 'React Component',
      description: 'Basic React component template',
      language: 'typescript',
      code: 'export const Component = () => {\n  return <div>Hello</div>;\n};',
      tags: ['react', 'template']
    };

    snippetManager.saveSnippet(snippet);
    editor.insertSnippet(snippet.id);
    
    expect(editor.getValue()).toContain(snippet.code);
  });
}); 