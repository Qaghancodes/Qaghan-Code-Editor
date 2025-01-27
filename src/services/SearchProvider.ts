interface SearchOptions {
  includePattern?: string[];
  excludePattern?: string[];
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  maxResults?: number;
}

interface SearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
  matches: {
    start: number;
    end: number;
    value: string;
  }[];
}

export class SearchProvider {
  private workerPool: Worker[] = [];
  private currentSearchId = 0;
  private activeSearches = new Map<number, AbortController>();

  constructor(private maxWorkers = navigator.hardwareConcurrency || 4) {
    this.initializeWorkerPool();
  }

  private initializeWorkerPool() {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(new URL('../workers/search.worker.ts', import.meta.url));
      this.workerPool.push(worker);
    }
  }

  public async searchInFiles(
    searchText: string,
    files: string[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const searchId = ++this.currentSearchId;
    const abortController = new AbortController();
    this.activeSearches.set(searchId, abortController);

    try {
      const chunks = this.splitFilesIntoChunks(files);
      const searchPromises = chunks.map((chunk, index) =>
        this.searchInWorker(this.workerPool[index], searchText, chunk, options, abortController.signal)
      );

      const results = await Promise.all(searchPromises);
      return this.mergeResults(results, options.maxResults);
    } finally {
      this.activeSearches.delete(searchId);
    }
  }

  private splitFilesIntoChunks(files: string[]): string[][] {
    const chunkSize = Math.ceil(files.length / this.maxWorkers);
    const chunks: string[][] = [];
    
    for (let i = 0; i < files.length; i += chunkSize) {
      chunks.push(files.slice(i, i + chunkSize));
    }
    
    return chunks;
  }

  private searchInWorker(
    worker: Worker,
    searchText: string,
    files: string[],
    options: SearchOptions,
    signal: AbortSignal
  ): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'searchComplete') {
          cleanup();
          resolve(event.data.results);
        } else if (event.data.type === 'error') {
          cleanup();
          reject(new Error(event.data.error));
        }
      };

      const cleanup = () => {
        worker.removeEventListener('message', messageHandler);
        signal.removeEventListener('abort', abortHandler);
      };

      const abortHandler = () => {
        worker.postMessage({ type: 'abort' });
        cleanup();
        reject(new Error('Search aborted'));
      };

      worker.addEventListener('message', messageHandler);
      signal.addEventListener('abort', abortHandler);

      worker.postMessage({
        type: 'search',
        searchText,
        files,
        options
      });
    });
  }

  private mergeResults(results: SearchResult[][], maxResults?: number): SearchResult[] {
    const merged = results.flat().sort((a, b) => {
      const fileCompare = a.file.localeCompare(b.file);
      if (fileCompare !== 0) return fileCompare;
      return a.line - b.line;
    });

    return maxResults ? merged.slice(0, maxResults) : merged;
  }

  public cancelSearch(searchId: number) {
    const controller = this.activeSearches.get(searchId);
    if (controller) {
      controller.abort();
      this.activeSearches.delete(searchId);
    }
  }

  public cancelAllSearches() {
    this.activeSearches.forEach(controller => controller.abort());
    this.activeSearches.clear();
  }

  public dispose() {
    this.cancelAllSearches();
    this.workerPool.forEach(worker => worker.terminate());
    this.workerPool = [];
  }
} 