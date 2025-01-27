import { Sidebar } from '../Sidebar';

describe('Sidebar', () => {
  let sidebar: Sidebar;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'sidebar-container';
    document.body.appendChild(container);
    sidebar = new Sidebar('sidebar-container');
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should create file tree element', () => {
    const fileTree = container.querySelector('.file-tree');
    expect(fileTree).toBeTruthy();
  });

  it('should update file tree with new files', () => {
    const mockFiles = [
      { name: 'file1.ts', path: '/path/file1.ts', isDirectory: false },
      { name: 'folder1', path: '/path/folder1', isDirectory: true }
    ];

    sidebar.updateFileTree(mockFiles);
    
    const fileElements = container.querySelectorAll('.file-tree-item');
    expect(fileElements.length).toBe(2);
  });
}); 