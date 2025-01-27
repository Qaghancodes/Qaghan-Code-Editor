interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  language: string;
  code: string;
  tags: string[];
}

export class SnippetManager {
  private snippets: Map<string, CodeSnippet> = new Map();
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
    this.loadSnippets();
  }

  private loadSnippets() {
    const savedSnippets = this.storage.getItem('codeSnippets');
    if (savedSnippets) {
      const parsed = JSON.parse(savedSnippets);
      parsed.forEach((snippet: CodeSnippet) => {
        this.snippets.set(snippet.id, snippet);
      });
    }
  }

  public saveSnippet(snippet: CodeSnippet): void {
    this.snippets.set(snippet.id, snippet);
    this.persistSnippets();
  }

  public getSnippet(id: string): CodeSnippet | undefined {
    return this.snippets.get(id);
  }

  public searchSnippets(query: string): CodeSnippet[] {
    const searchTerms = query.toLowerCase().split(' ');
    return Array.from(this.snippets.values()).filter(snippet => {
      return searchTerms.every(term =>
        snippet.name.toLowerCase().includes(term) ||
        snippet.description.toLowerCase().includes(term) ||
        snippet.tags.some(tag => tag.toLowerCase().includes(term))
      );
    });
  }

  private persistSnippets(): void {
    this.storage.setItem(
      'codeSnippets',
      JSON.stringify(Array.from(this.snippets.values()))
    );
  }
} 