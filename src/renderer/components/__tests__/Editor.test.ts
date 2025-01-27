import { Editor } from '../Editor';
import * as monaco from 'monaco-editor';

jest.mock('monaco-editor');

describe('Editor', () => {
  let editor: Editor;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'editor-container';
    document.body.appendChild(container);

    editor = new Editor('editor-container', {
      theme: 'vs-dark',
      fontSize: 14
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  it('should initialize monaco editor with correct config', () => {
    expect(monaco.editor.create).toHaveBeenCalledWith(
      container,
      expect.objectContaining({
        theme: 'vs-dark',
        fontSize: 14,
        automaticLayout: true
      })
    );
  });
}); 