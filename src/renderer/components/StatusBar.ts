interface StatusBarItem {
  id: string;
  text: string;
  tooltip?: string;
  command?: string;
  priority: number;
  alignment: 'left' | 'right';
}

export class StatusBar {
  private element: HTMLElement;
  private leftSection: HTMLElement;
  private rightSection: HTMLElement;
  private items: Map<string, StatusBarItem> = new Map();

  constructor(containerId: string) {
    this.element = document.getElementById(containerId)!;
    this.initialize();
  }

  private initialize() {
    this.element.className = 'status-bar';
    this.leftSection = document.createElement('div');
    this.rightSection = document.createElement('div');
    
    this.leftSection.className = 'status-bar-left';
    this.rightSection.className = 'status-bar-right';
    
    this.element.appendChild(this.leftSection);
    this.element.appendChild(this.rightSection);
  }

  public addItem(item: StatusBarItem): void {
    this.items.set(item.id, item);
    this.renderItems();
  }

  public updateItem(id: string, updates: Partial<StatusBarItem>): void {
    const item = this.items.get(id);
    if (item) {
      Object.assign(item, updates);
      this.renderItems();
    }
  }

  public removeItem(id: string): void {
    this.items.delete(id);
    this.renderItems();
  }

  private renderItems(): void {
    this.leftSection.innerHTML = '';
    this.rightSection.innerHTML = '';

    const sortedItems = Array.from(this.items.values())
      .sort((a, b) => b.priority - a.priority);

    sortedItems.forEach(item => {
      const itemElement = this.createItemElement(item);
      if (item.alignment === 'left') {
        this.leftSection.appendChild(itemElement);
      } else {
        this.rightSection.appendChild(itemElement);
      }
    });
  }

  private createItemElement(item: StatusBarItem): HTMLElement {
    const element = document.createElement('div');
    element.className = 'status-bar-item';
    element.textContent = item.text;
    
    if (item.tooltip) {
      element.title = item.tooltip;
    }
    
    if (item.command) {
      element.classList.add('clickable');
      element.addEventListener('click', () => {
        this.emit('command', item.command);
      });
    }

    return element;
  }
} 