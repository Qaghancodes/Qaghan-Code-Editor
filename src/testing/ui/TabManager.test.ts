import { ComponentTestRunner } from './ComponentTestRunner';
import { TabManager } from '../../renderer/components/TabManager';

describe('TabManager Component', () => {
  let testRunner: ComponentTestRunner;
  let context: any;
  let tabManager: TabManager;

  beforeEach(async () => {
    testRunner = new ComponentTestRunner();
    context = await testRunner.setup();
    
    const tabContainer = document.createElement('div');
    tabContainer.id = 'tab-manager';
    context.container.appendChild(tabContainer);
    
    tabManager = new TabManager('tab-manager');
  });

  afterEach(() => {
    context.cleanup();
  });

  it('should add and activate tabs correctly', async () => {
    // Arrange
    const tab1Content = document.createElement('div');
    const tab2Content = document.createElement('div');

    // Act
    tabManager.addTab({ id: 'tab1', title: 'Tab 1' }, tab1Content);
    tabManager.addTab({ id: 'tab2', title: 'Tab 2' }, tab2Content);

    // Assert
    await context.waitFor(() => {
      const tabs = document.querySelectorAll('.tab');
      return tabs.length === 2;
    });

    const tabs = document.querySelectorAll('.tab');
    expect(tabs[0].textContent).toContain('Tab 1');
    expect(tabs[1].textContent).toContain('Tab 2');
    expect(tabs[0].classList.contains('active')).toBe(true);
  });

  it('should handle tab switching', async () => {
    // Arrange
    const tab1Content = document.createElement('div');
    const tab2Content = document.createElement('div');
    tabManager.addTab({ id: 'tab1', title: 'Tab 1' }, tab1Content);
    tabManager.addTab({ id: 'tab2', title: 'Tab 2' }, tab2Content);

    // Act
    const secondTab = document.querySelectorAll('.tab')[1];
    context.fireEvent.click(secondTab);

    // Assert
    await context.waitFor(() => {
      const activeTab = document.querySelector('.tab.active');
      return activeTab?.textContent.includes('Tab 2');
    });

    const visibleContent = document.querySelector('.tab-pane.active');
    expect(visibleContent).toBe(tab2Content);
  });

  it('should close tabs correctly', async () => {
    // Arrange
    const tab1Content = document.createElement('div');
    tabManager.addTab({ id: 'tab1', title: 'Tab 1' }, tab1Content);
    
    // Act
    const closeButton = document.querySelector('.tab-close');
    context.fireEvent.click(closeButton as HTMLElement);

    // Assert
    await context.waitFor(() => {
      const tabs = document.querySelectorAll('.tab');
      return tabs.length === 0;
    });

    const tabContent = document.querySelector('.tab-pane');
    expect(tabContent).toBeNull();
  });

  it('should handle dirty state correctly', async () => {
    // Arrange
    const content = document.createElement('div');
    tabManager.addTab({ id: 'tab1', title: 'Tab 1' }, content);

    // Act
    tabManager.updateTab('tab1', { dirty: true });

    // Assert
    await context.waitFor(() => {
      const dirtyIndicator = document.querySelector('.tab-dirty');
      return dirtyIndicator !== null;
    });

    const dirtyIndicator = document.querySelector('.tab-dirty');
    expect(dirtyIndicator).not.toBeNull();
    expect(dirtyIndicator?.textContent).toBe('●');
  });
}); 