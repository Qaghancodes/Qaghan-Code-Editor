import { PerformanceTestRunner } from './PerformanceTestRunner';
import { Editor } from '../../renderer/components/Editor';
import { FileSystemService } from '../../services/FileSystemService';

export async function runEditorPerformanceTests() {
  const runner = new PerformanceTestRunner();
  const fs = new FileSystemService();

  // Test large file loading
  await runner.runTest({
    name: 'Large File Loading Performance',
    setup: async () => {
      const largeContent = generateLargeFile(100000); // 100K lines
      await fs.writeFile('/tmp/large-file.ts', largeContent);
      return { content: largeContent };
    },
    test: async ({ content }) => {
      const editor = new Editor('editor-container');
      await editor.openFile('/tmp/large-file.ts', content);
    },
    iterations: 20,
    warmupIterations: 3
  });

  // Test syntax highlighting performance
  await runner.runTest({
    name: 'Syntax Highlighting Performance',
    setup: async () => {
      const complexContent = generateComplexTypeScriptCode(1000); // 1K lines
      return { content: complexContent };
    },
    test: async ({ content }) => {
      const editor = new Editor('editor-container');
      await editor.setText(content);
      await editor.setLanguage('typescript');
    },
    iterations: 30
  });

  // Test search and replace performance
  await runner.runTest({
    name: 'Search and Replace Performance',
    setup: async () => {
      const content = generateSearchableContent(50000); // 50K lines
      return { content };
    },
    test: async ({ content }) => {
      const editor = new Editor('editor-container');
      await editor.setText(content);
      await editor.replace(/pattern\d+/g, 'replacement');
    },
    iterations: 25
  });

  console.log(runner.generateReport());
}

function generateLargeFile(lines: number): string {
  return Array.from({ length: lines }, (_, i) => 
    `// Line ${i}\nconst variable${i} = "value${i}";\n`
  ).join('');
}

function generateComplexTypeScriptCode(lines: number): string {
  return Array.from({ length: lines }, (_, i) => `
    interface Interface${i} {
      property${i}: string;
      method${i}<T extends number>(param: T): Promise<T>;
    }

    class Class${i} implements Interface${i} {
      private _property${i}: string;

      constructor() {
        this._property${i} = "value";
      }

      get property${i}(): string {
        return this._property${i};
      }

      async method${i}<T extends number>(param: T): Promise<T> {
        return new Promise(resolve => resolve(param));
      }
    }
  `).join('\n');
}

function generateSearchableContent(lines: number): string {
  return Array.from({ length: lines }, (_, i) => 
    `const pattern${i} = "value";\n// Some other content\n`
  ).join('');
} 