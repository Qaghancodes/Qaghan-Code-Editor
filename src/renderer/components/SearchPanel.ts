import { SearchService } from '../../services/SearchService';

export class SearchPanel {
  private element: HTMLElement;
  private searchService: SearchService;
  private searchInput: HTMLInputElement;
  private replaceInput: HTMLInputElement;
  private resultsContainer: HTMLElement;

  constructor(containerId: string, searchService: SearchService) {
    this.element = document.getElementById(containerId)!;
    this.searchService = searchService;
    this.initialize();
  }

  private initialize() {
    this.element.innerHTML = `
      <div class="search-panel">
        <div class="search-input-container">
          <input type="text" class="search-input" placeholder="Search...">
          <label><input type="checkbox" class="regex-toggle"> Regex</label>
        </div>
        <div class="replace-input-container">
          <input type="text" class="replace-input" placeholder="Replace...">
          <button class="replace-button">Replace All</button>
        </div>
        <div class="search-results"></div>
      </div>
    `;

    this.searchInput = this.element.querySelector('.search-input')!;
    this.replaceInput = this.element.querySelector('.replace-input')!;
    this.resultsContainer = this.element.querySelector('.search-results')!;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    let searchTimeout: NodeJS.Timeout;

    this.searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this.performSearch(), 300);
    });

    this.element.querySelector('.replace-button')?.addEventListener('click', () => {
      this.performReplace();
    });
  }

  private performSearch() {
    const searchText = this.searchInput.value;
    const isRegex = (this.element.querySelector('.regex-toggle') as HTMLInputElement).checked;

    if (!searchText) {
      this.resultsContainer.innerHTML = '';
      return;
    }

    const results = this.searchService.findAll(searchText, isRegex);
    this.displayResults(results);
  }

  private performReplace() {
    const searchText = this.searchInput.value;
    const replaceText = this.replaceInput.value;
    const isRegex = (this.element.querySelector('.regex-toggle') as HTMLInputElement).checked;

    const count = this.searchService.replace(searchText, replaceText, isRegex);
    this.resultsContainer.innerHTML = `Replaced ${count} occurrence(s)`;
  }

  private displayResults(results: SearchResult[]) {
    this.resultsContainer.innerHTML = results.map(result => `
      <div class="search-result">
        Line ${result.line}: ${this.escapeHtml(result.text)}
      </div>
    `).join('');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
} 