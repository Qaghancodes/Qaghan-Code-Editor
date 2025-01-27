import { ComponentTestRunner } from './ComponentTestRunner';
import { TreeView } from '../../renderer/components/TreeView';

describe('TreeView Component', () => {
  let testRunner: ComponentTestRunner;
  let context: any;
  let treeView: TreeView;

  beforeEach(async () => {
    testRunner = new ComponentTestRunner();
    context = await testRunner.setup();
    
    // Create container for TreeView
    const treeContainer = document.createElement('div');
    treeContainer.id = 'tree-view';
    context.container.appendChild(treeContainer);
    
    treeView = new TreeView('tree-view');
  });

  afterEach(() => {
    context.cleanup();
  });

  it('should render tree nodes correctly', async () => {
    // Arrange
    const testNodes = [
      {
        id: '1',
        label: 'Root',
        children: [
          {
            id: '1.1',
            label: 'Child 1'
          },
          {
            id: '1.2',
            label: 'Child 2'
          }
        ]
      }
    ];

    // Act
    treeView.setNodes(testNodes);

    // Assert
    await context.waitFor(() => {
      const rootNode = document.querySelector('[data-id="1"]');
      const childNodes = document.querySelectorAll('[data-level="1"]');
      return rootNode && childNodes.length === 2;
    });

    const rootNode = document.querySelector('[data-id="1"]');
    expect(rootNode?.textContent).toContain('Root');

    const childNodes = document.querySelectorAll('[data-level="1"]');
    expect(childNodes[0]?.textContent).toContain('Child 1');
    expect(childNodes[1]?.textContent).toContain('Child 2');
  });

  it('should handle node collapse/expand', async () => {
    // Arrange
    const testNodes = [{
      id: '1',
      label: 'Root',
      children: [{ id: '1.1', label: 'Child' }]
    }];
    treeView.setNodes(testNodes);

    // Act
    const rootNode = document.querySelector('[data-id="1"]');
    const collapseIcon = rootNode?.querySelector('.collapse-icon');
    context.fireEvent.click(collapseIcon as HTMLElement);

    // Assert
    await context.waitFor(() => {
      const rootNode = document.querySelector('[data-id="1"]');
      return rootNode?.hasAttribute('data-collapsed');
    });

    expect(document.querySelector('[data-id="1.1"]')).toBeNull();
  });

  it('should handle node selection', async () => {
    // Arrange
    const testNodes = [{
      id: '1',
      label: 'Root'
    }];
    treeView.setNodes(testNodes);

    let selectedNode: any = null;
    treeView.on('nodeSelected', (node) => {
      selectedNode = node;
    });

    // Act
    const node = document.querySelector('[data-id="1"]');
    context.fireEvent.click(node as HTMLElement);

    // Assert
    expect(selectedNode).toBeTruthy();
    expect(selectedNode.id).toBe('1');
    expect(node?.classList.contains('selected')).toBe(true);
  });

  it('should handle drag and drop', async () => {
    // Arrange
    const testNodes = [
      { id: '1', label: 'Item 1' },
      { id: '2', label: 'Item 2' }
    ];
    treeView.setNodes(testNodes);

    let draggedNode: any = null;
    let targetNode: any = null;
    treeView.on('nodeMoved', ({ source, target }) => {
      draggedNode = source;
      targetNode = target;
    });

    // Act
    const sourceNode = document.querySelector('[data-id="1"]');
    const targetNode = document.querySelector('[data-id="2"]');

    context.fireEvent.dragStart(sourceNode as HTMLElement);
    context.fireEvent.dragOver(targetNode as HTMLElement);
    context.fireEvent.drop(targetNode as HTMLElement);

    // Assert
    expect(draggedNode?.id).toBe('1');
    expect(targetNode?.id).toBe('2');
  });
}); 