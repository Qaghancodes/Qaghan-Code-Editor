interface QuickInputOptions {
  placeholder?: string;
  items: QuickInputItem[];
  onSelect: (item: QuickInputItem) => void;
  onFilter?: (value: string) => QuickInputItem[];
}

interface QuickInputItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  detail?: string;
}

export class QuickInput {
  private element: HTMLElement;
  private input: HTMLInputElement;
  private itemsList: HTMLElement;
  private options: QuickInputOptions;
  private visible: boolean = false;

  constructor() {
    this.createElements();
    this.setupEventListeners();
  }

  private createElements() {
    this.element = document.createElement('div');
    this.element.className = 'quick-input hidden';
    
    this.element.innerHTML = `
      <div class="quick-input-container">
        <input type="text" class="quick-input-field" />
        <div class="quick-input-items"></div>
      </div>
    `;

    this.input = this.element.querySelector('.quick-input-field')!;
    this.itemsList = this.element.querySelector('.quick-input-items')!;
    
    document.body.appendChild(this.element);
  }

  private setupEventListeners() {
    this.input.addEventListener('input', () => this.handleInput());
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target as Node)) {
        this.hide();
      }
    });
  }

  public show(options: QuickInputOptions) {
    this.options = options;
    this.visible = true;
    this.element.classList.remove('hidden');
    this.input.placeholder = options.placeholder || '';
    this.input.focus();
    this.renderItems(options.items);
  }

  public hide() {
    this.visible = false;
    this.element.classList.add('hidden');
    this.input.value = '';
  }

  private handleInput() {
    const value = this.input.value;
    const filteredItems = this.options.onFilter 
      ? this.options.onFilter(value)
      : this.filterItems(value);
    this.renderItems(filteredItems);
  }

  private filterItems(value: string): QuickInputItem[] {
    const searchValue = value.toLowerCase();
    return this.options.items.filter(item =>
      item.label.toLowerCase().includes(searchValue) ||
      item.description?.toLowerCase().includes(searchValue)
    );
  }

  private renderItems(items: QuickInputItem[]) {
    this.itemsList.innerHTML = items.map(item => `
      <div class="quick-input-item" data-id="${item.id}">
        ${item.icon ? `<span class="icon">${item.icon}</span>` : ''}
        <div class="item-content">
          <div class="item-label">${item.label}</div>
          ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
          ${item.detail ? `<div class="item-detail">${item.detail}</div>` : ''}
        </div>
      </div>
    `).join('');

    this.itemsList.querySelectorAll('.quick-input-item').forEach(element => {
      element.addEventListener('click', () => {
        const id = element.getAttribute('data-id')!;
        const item = items.find(i => i.id === id);
        if (item) {
          this.options.onSelect(item);
          this.hide();
        }
      });
    });
  }

  private handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        this.hide();
        break;
      case 'Enter':
        const selectedItem = this.itemsList.querySelector('.selected');
        if (selectedItem) {
          const id = selectedItem.getAttribute('data-id')!;
          const item = this.options.items.find(i => i.id === id);
          if (item) {
            this.options.onSelect(item);
            this.hide();
          }
        }
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        this.handleArrowNavigation(event.key === 'ArrowDown');
        event.preventDefault();
        break;
    }
  }

  private handleArrowNavigation(down: boolean) {
    const items = this.itemsList.querySelectorAll('.quick-input-item');
    const selected = this.itemsList.querySelector('.selected');
    
    if (!selected) {
      items[down ? 0 : items.length - 1].classList.add('selected');
      return;
    }

    const currentIndex = Array.from(items).indexOf(selected);
    selected.classList.remove('selected');
    
    const newIndex = down
      ? (currentIndex + 1) % items.length
      : (currentIndex - 1 + items.length) % items.length;
    
    items[newIndex].classList.add('selected');
    items[newIndex].scrollIntoView({ block: 'nearest' });
  }
} 