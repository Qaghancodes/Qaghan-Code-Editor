interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  children?: TreeNode[];
  collapsed?: boolean;
  contextMenu?: ContextMenuItem[];
  data?: any;
}

interface ContextMenuItem {
  label: string;
  action: (node: TreeNode) => void;
  icon?: string;
  separator?: boolean;
}

export class TreeView {
  private element: HTMLElement;
  private nodes: TreeNode[] = [];
  private selectedNode?: TreeNode;
  private draggedNode?: TreeNode;

  constructor(containerId: string) {
    this.element = document.getElementById(containerId)!;
    this.element.className = 'tree-view';
    this.setupEventListeners();
  }

  public setNodes(nodes: TreeNode[]) {
    this.nodes = nodes;
    this.render();
  }

  private render() {
    this.element.innerHTML = this.renderNodes(this.nodes);
    this.setupNodeEventListeners();
  }

  private renderNodes(nodes: TreeNode[], level = 0): string {
    return nodes.map(node => `
      <div class="tree-node" data-id="${node.id}" data-level="${level}"
           draggable="true"
           ${node.collapsed ? 'data-collapsed="true"' : ''}>
        <div class="node-content" style="padding-left: ${level * 20}px">
          ${node.children ? `
            <span class="collapse-icon">${node.collapsed ? '▶' : '▼'}</span>
          ` : '<span class="collapse-icon-placeholder"></span>'}
          ${node.icon ? `<span class="node-icon">${node.icon}</span>` : ''}
          <span class="node-label">${node.label}</span>
        </div>
        ${node.children && !node.collapsed ? `
          <div class="node-children">
            ${this.renderNodes(node.children, level + 1)}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  private setupEventListeners() {
    this.element.addEventListener('click', (e) => {
      const nodeElement = (e.target as HTMLElement).closest('.tree-node');
      if (nodeElement) {
        const node = this.findNode(nodeElement.dataset.id!);
        if (node) {
          if ((e.target as HTMLElement).classList.contains('collapse-icon')) {
            this.toggleNode(node);
          } else {
            this.selectNode(node);
          }
        }
      }
    });

    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const nodeElement = (e.target as HTMLElement).closest('.tree-node');
      if (nodeElement) {
        const node = this.findNode(nodeElement.dataset.id!);
        if (node?.contextMenu) {
          this.showContextMenu(e as MouseEvent, node);
        }
      }
    });

    // Drag and drop support
    this.setupDragAndDrop();
  }

  private setupDragAndDrop() {
    this.element.addEventListener('dragstart', (e) => {
      const nodeElement = (e.target as HTMLElement).closest('.tree-node');
      if (nodeElement) {
        this.draggedNode = this.findNode(nodeElement.dataset.id!);
        e.dataTransfer!.setData('text/plain', nodeElement.dataset.id!);
        nodeElement.classList.add('dragging');
      }
    });

    this.element.addEventListener('dragover', (e) => {
      e.preventDefault();
      const nodeElement = (e.target as HTMLElement).closest('.tree-node');
      if (nodeElement) {
        nodeElement.classList.add('drag-over');
      }
    });

    this.element.addEventListener('dragleave', (e) => {
      const nodeElement = (e.target as HTMLElement).closest('.tree-node');
      if (nodeElement) {
        nodeElement.classList.remove('drag-over');
      }
    });

    this.element.addEventListener('drop', (e) => {
      e.preventDefault();
      const nodeElement = (e.target as HTMLElement).closest('.tree-node');
      if (nodeElement) {
        const targetNode = this.findNode(nodeElement.dataset.id!);
        if (this.draggedNode && targetNode) {
          this.moveNode(this.draggedNode, targetNode);
        }
        nodeElement.classList.remove('drag-over');
      }
      this.draggedNode = undefined;
    });
  }

  private findNode(id: string, nodes: TreeNode[] = this.nodes): TreeNode | undefined {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findNode(id, node.children);
        if (found) return found;
      }
    }
    return undefined;
  }

  private toggleNode(node: TreeNode) {
    node.collapsed = !node.collapsed;
    this.render();
  }

  private selectNode(node: TreeNode) {
    this.selectedNode = node;
    this.element.querySelectorAll('.tree-node').forEach(el => {
      el.classList.remove('selected');
      if (el.dataset.id === node.id) {
        el.classList.add('selected');
      }
    });
    this.emit('nodeSelected', node);
  }

  private moveNode(source: TreeNode, target: TreeNode) {
    // Implement node movement logic here
    this.emit('nodeMoved', { source, target });
  }

  private showContextMenu(event: MouseEvent, node: TreeNode) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'absolute';
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;

    node.contextMenu!.forEach(item => {
      if (item.separator) {
        menu.appendChild(document.createElement('hr'));
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.innerHTML = `
          ${item.icon ? `<span class="menu-icon">${item.icon}</span>` : ''}
          <span class="menu-label">${item.label}</span>
        `;
        menuItem.addEventListener('click', () => {
          item.action(node);
          menu.remove();
        });
        menu.appendChild(menuItem);
      }
    });

    document.body.appendChild(menu);
    document.addEventListener('click', () => menu.remove(), { once: true });
  }

  private emit(event: string, data: any) {
    const customEvent = new CustomEvent(event, { detail: data });
    this.element.dispatchEvent(customEvent);
  }
} 