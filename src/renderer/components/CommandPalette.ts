import { EventEmitter } from 'events';

interface Command {
  id: string;
  title: string;
  category: string;
  keybinding?: string;
  handler: () => void;
}

export class CommandPalette extends EventEmitter {
  private element: HTMLElement;
  private commands: Map<string, Command> = new Map();
  private isVisible: boolean = false;

  constructor() {
    super();
    this.createPaletteElement();
    this.setupKeyboardShortcuts();
  }

  private createPaletteElement() {
    this.element = document.createElement('div');
    this.element.className = 'command-palette';
    this.element.innerHTML = `
      <div class="command-palette-overlay"></div>
      <div class="command-palette-container">
        <input type="text" class="command-palette-input" placeholder="Type a command...">
        <div class="command-palette-results"></div>
      </div>
    `;
    document.body.appendChild(this.element);

    const input = this.element.querySelector('.command-palette-input') as HTMLInputElement;
    input.addEventListener('input', () => this.filterCommands(input.value));
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  public registerCommand(command: Command) {
    this.commands.set(command.id, command);
  }

  private filterCommands(query: string) {
    const results = Array.from(this.commands.values())
      .filter(cmd => 
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
      );

    this.renderResults(results);
  }

  private renderResults(commands: Command[]) {
    const resultsContainer = this.element.querySelector('.command-palette-results')!;
    resultsContainer.innerHTML = commands
      .map(cmd => `
        <div class="command-palette-item" data-command-id="${cmd.id}">
          <span class="command-title">${cmd.title}</span>
          <span class="command-category">${cmd.category}</span>
          ${cmd.keybinding ? `<span class="command-keybinding">${cmd.keybinding}</span>` : ''}
        </div>
      `)
      .join('');

    resultsContainer.querySelectorAll('.command-palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const commandId = item.getAttribute('data-command-id')!;
        this.executeCommand(commandId);
      });
    });
  }

  private executeCommand(commandId: string) {
    const command = this.commands.get(commandId);
    if (command) {
      command.handler();
      this.hide();
    }
  }

  public toggle() {
    this.isVisible ? this.hide() : this.show();
  }

  private show() {
    this.isVisible = true;
    this.element.classList.add('visible');
    const input = this.element.querySelector('.command-palette-input') as HTMLInputElement;
    input.focus();
    this.filterCommands('');
  }

  private hide() {
    this.isVisible = false;
    this.element.classList.remove('visible');
  }
} 