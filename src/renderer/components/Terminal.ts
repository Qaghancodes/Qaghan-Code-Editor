export class Terminal {
  private element: HTMLElement;
  private input: HTMLInputElement;
  private output: HTMLElement;

  constructor(containerId: string) {
    this.element = document.getElementById(containerId)!;
    this.setupTerminal();
  }

  private setupTerminal() {
    this.output = document.createElement('div');
    this.output.className = 'terminal-output';
    
    this.input = document.createElement('input');
    this.input.className = 'terminal-input';
    this.input.type = 'text';
    
    this.element.appendChild(this.output);
    this.element.appendChild(this.input);
    
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleCommand(this.input.value);
        this.input.value = '';
      }
    });
  }

  private handleCommand(command: string) {
    // Add command to output
    const commandElement = document.createElement('div');
    commandElement.textContent = `$ ${command}`;
    this.output.appendChild(commandElement);
    
    // Here you would typically process the command
    // For now, we'll just echo it back
    const responseElement = document.createElement('div');
    responseElement.textContent = `Command received: ${command}`;
    this.output.appendChild(responseElement);
    
    // Scroll to bottom
    this.output.scrollTop = this.output.scrollHeight;
  }
} 