interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: string;
  contextMenu?: MenuItem[];
}

interface MenuItem {
  label: string;
  action: () => void;
}

export class Breadcrumbs {
  private element: HTMLElement;
  private items: BreadcrumbItem[] = [];

  constructor(containerId: string) {
    this.element = document.getElementById(containerId)!;
    this.element.className = 'breadcrumbs';
    this.setupEventListeners();
  }

  public setPath(items: BreadcrumbItem[]): void {
    this.items = items;
    this.render();
  }

  private render(): void {
    this.element.innerHTML = this.items
      .map((item, index) => this.createBreadcrumbItem(item, index))
      .join('');
  }

  private createBreadcrumbItem(item: BreadcrumbItem, index: number): string {
    const separator = index < this.items.length - 1 ? '<span class="separator">/</span>' : '';
    const iconHtml = item.icon ? `<span class="icon">${item.icon}</span>` : '';
    
    return `
      <div class="breadcrumb-item" data-id="${item.id}">
        ${iconHtml}
        <span class="label">${item.label}</span>
        ${separator}
      </div>
    `;
  }

  private setupEventListeners(): void {
    this.element.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('.breadcrumb-item');
      if (item) {
        const id = item.getAttribute('data-id')!;
        const breadcrumb = this.items.find(i => i.id === id);
        
        if (breadcrumb?.contextMenu) {
          this.showContextMenu(e as MouseEvent, breadcrumb.contextMenu);
        }
      }
    });
  }

  private showContextMenu(event: MouseEvent, items: MenuItem[]): void {
    event.preventDefault();
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'absolute';
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;

    items.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';
      menuItem.textContent = item.label;
      menuItem.addEventListener('click', () => {
        item.action();
        menu.remove();
      });
      menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);
    
    document.addEventListener('click', () => menu.remove(), { once: true });
  }
} 