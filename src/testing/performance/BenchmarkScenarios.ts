import { PerformanceTestRunner } from './PerformanceTestRunner';
import { Editor } from '../../renderer/components/Editor';
import { WorkspaceService } from '../../services/WorkspaceService';
import { SearchProvider } from '../../services/SearchProvider';
import { LanguageService } from '../../services/LanguageService';

export async function runBenchmarkScenarios() {
  const runner = new PerformanceTestRunner();

  // Workspace Loading Benchmark
  await runner.runTest({
    name: 'Large Workspace Loading',
    setup: async () => {
      const workspace = new WorkspaceService();
      const files = generateLargeWorkspace(1000); // 1000 files
      return { workspace, files };
    },
    test: async ({ workspace, files }) => {
      await workspace.initialize('/tmp/bench-workspace');
      for (const [path, content] of files) {
        await workspace.createFile(path, content);
      }
      await workspace.indexWorkspace();
    },
    iterations: 5,
    warmupIterations: 1
  });

  // Search Performance Benchmark
  await runner.runTest({
    name: 'Workspace-Wide Search',
    setup: async () => {
      const search = new SearchProvider();
      const files = generateSearchableContent(500); // 500 files
      return { search, files };
    },
    test: async ({ search, files }) => {
      await search.initialize(files);
      await search.searchWorkspace({
        query: 'function\\s+\\w+\\s*\\(',
        useRegex: true,
        caseSensitive: false,
        includePattern: ['**/*.ts']
      });
    },
    iterations: 20
  });

  // Language Service Performance
  await runner.runTest({
    name: 'TypeScript Language Service',
    setup: async () => {
      const language = new LanguageService();
      const complexCode = generateComplexTypeScript(100); // 100 complex classes
      return { language, code: complexCode };
    },
    test: async ({ language, code }) => {
      await language.initialize();
      await language.validateDocument('test.ts', code);
      await language.getDocumentSymbols('test.ts');
      await language.getCompletionsAtPosition('test.ts', { line: 50, character: 25 });
    },
    iterations: 30
  });

  // Memory Usage Benchmark
  await runner.runTest({
    name: 'Memory Usage Under Load',
    setup: async () => {
      const editor = new Editor('bench-editor');
      const largeFile = generateLargeFile(1000000); // 1M lines
      return { editor, content: largeFile };
    },
    test: async ({ editor, content }) => {
      await editor.setText(content);
      for (let i = 0; i < 100; i++) {
        await editor.insertText(`// New line ${i}\n`, { line: i * 1000, character: 0 });
        await editor.deleteRange({ start: { line: i * 1000 + 1, character: 0 }, end: { line: i * 1000 + 2, character: 0 } });
      }
    },
    iterations: 10
  });

  // UI Responsiveness Benchmark
  await runner.runTest({
    name: 'UI Operation Response Time',
    setup: async () => {
      const editor = new Editor('bench-editor');
      return { editor };
    },
    test: async ({ editor }) => {
      const operations = [];
      for (let i = 0; i < 1000; i++) {
        operations.push(
          editor.insertText('test'),
          editor.moveCursor({ line: i % 100, character: 0 }),
          editor.scrollToLine(i % 100)
        );
      }
      await Promise.all(operations);
    },
    iterations: 15
  });

  console.log(runner.generateReport());
}

// Helper functions for generating test data
function generateLargeWorkspace(fileCount: number): [string, string][] {
  return Array.from({ length: fileCount }, (_, i) => [
    `src/module${i}/file${i}.ts`,
    `
    export class Class${i} {
      private field${i}: string;
      
      constructor() {
        this.field${i} = "value";
      }
      
      public method${i}(): void {
        console.log(this.field${i});
      }
    }
    `
  ]);
}

function generateSearchableContent(fileCount: number): Map<string, string> {
  const files = new Map<string, string>();
  for (let i = 0; i < fileCount; i++) {
    files.set(`file${i}.ts`, `
      function func${i}() {
        return "searchable content ${i}";
      }
      
      class Class${i} {
        method${i}() {
          return func${i}();
        }
      }
    `);
  }
  return files;
}

function generateComplexTypeScript(classCount: number): string {
  return Array.from({ length: classCount }, (_, i) => `
    interface Interface${i}<T> {
      field${i}: T;
      method${i}(param: T): Promise<T>;
    }

    class Implementation${i}<T> implements Interface${i}<T> {
      private _field${i}: T;
      
      constructor(value: T) {
        this._field${i} = value;
      }
      
      get field${i}(): T {
        return this._field${i};
      }
      
      async method${i}(param: T): Promise<T> {
        await new Promise(resolve => setTimeout(resolve, 1));
        return param;
      }
    }

    type Union${i} = string | number | Implementation${i}<string>;
  `).join('\n');
}

function generateLargeFile(lines: number): string {
  return Array.from({ length: lines }, (_, i) => 
    `// Line ${i}\nconst variable${i} = ${i};\n`
  ).join('');
} 