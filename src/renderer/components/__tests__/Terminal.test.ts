import { Terminal } from '../Terminal';

describe('Terminal', () => {
  let terminal: Terminal;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'terminal-container';
    document.body.appendChild(container);
    terminal = new Terminal('terminal-container');
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should create input and output elements', () => {
    const input = container.querySelector('.terminal-input');
    const output = container.querySelector('.terminal-output');
    
    expect(input).toBeTruthy();
    expect(output).toBeTruthy();
  });

  it('should handle command input', () => {
    const input = container.querySelector('.terminal-input') as HTMLInputElement;
    const output = container.querySelector('.terminal-output') as HTMLElement;

    input.value = 'test command';
    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));

    const outputText = output.textContent;
    expect(outputText).toContain('test command');
  });
}); 