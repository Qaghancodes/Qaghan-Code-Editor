import { PerformanceTestRunner } from './PerformanceTestRunner';
import { TreeView } from '../../renderer/components/TreeView';
import { TabManager } from '../../renderer/components/TabManager';

export async function runComponentPerformanceTests() {
  const runner = new PerformanceTestRunner();

  // Test TreeView Performance
  await runner.runTest({
    name: 'TreeView Large Dataset Rendering',
    setup: async () => {
      const container = document.createElement('div');
      container.id = 'tree-test';
      document.body.appendChild(container);
    },
    test: async () => {
      const treeView = new TreeView('tree-test');
      const largeDataset = generateLargeTreeDataset(1000); // 1000 nodes
      treeView.setNodes(largeDataset);
      await waitForRender();
    },
    teardown: async () => {
      document.getElementById('tree-test')?.remove();
    },
    iterations: 50,
    warmupIterations: 5
  });

  // Test Tab Manager Performance
  await runner.runTest({
    name: 'TabManager Tab Switching',
    setup: async () => {
      const container = document.createElement('div');
      container.id = 'tab-test';
      document.body.appendChild(container);
      
      const tabManager = new TabManager('tab-test');
      // Create 100 tabs
      for (let i = 0; i < 100; i++) {
        const content = document.createElement('div');
        content.textContent = `Tab Content ${i}`;
        tabManager.addTab({
          id: `tab-${i}`,
          title: `Tab ${i}`
        }, content);
      }
      return { tabManager };
    },
    test: async ({ tabManager }) => {
      // Switch between tabs rapidly
      for (let i = 0; i < 20; i++) {
        tabManager.activateTab(`tab-${i}`);
        await waitForRender();
      }
    },
    iterations: 30
  });

  // Test Search Performance
  await runner.runTest({
    name: 'Search Large File Performance',
    test: async () => {
      const largeContent = generateLargeFileContent(1000000); // 1M lines
      const searchPattern = /pattern\d+/g;
      return performSearch(largeContent, searchPattern);
    },
    iterations: 20
  });

  console.log(runner.generateReport());
}

// Helper functions
function generateLargeTreeDataset(nodeCount: number) {
  const nodes: any[] = [];
  let remainingNodes = nodeCount;

  function generateNodes(depth: number = 0): any[] {
    if (remainingNodes <= 0 || depth > 5) return [];

    const currentLevelNodes = Math.min(
      Math.floor(Math.random() * 5) + 1,
      remainingNodes
    );
    remainingNodes -= currentLevelNodes;

    return Array.from({ length: currentLevelNodes }, (_, i) => ({
      id: `node-${depth}-${i}`,
      label: `Node ${depth}-${i}`,
      children: generateNodes(depth + 1)
    }));
  }

  return generateNodes();
}

function generateLargeFileContent(lines: number): string {
  return Array.from({ length: lines }, (_, i) => 
    `Line ${i}: Some content with pattern${i % 100}`
  ).join('\n');
}

async function performSearch(content: string, pattern: RegExp): Promise<number> {
  return content.match(pattern)?.length ?? 0;
}

function waitForRender(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
} 