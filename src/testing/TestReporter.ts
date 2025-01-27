import { TestRunner, TestResult, TestSummary } from './TestRunner';

interface ReportOptions {
  format: 'json' | 'html' | 'junit';
  output?: string;
  includeStack?: boolean;
  includeCoverage?: boolean;
}

export class TestReporter {
  constructor(private runner: TestRunner) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.runner.on('started', () => this.onTestingStarted());
    this.runner.on('completed', (results) => this.onTestingCompleted(results));
    this.runner.on('testCompleted', (test, result) => this.onTestCompleted(test, result));
  }

  public async generateReport(options: ReportOptions): Promise<string> {
    const results = this.runner.getResults();
    const summary = this.runner.getSummary();

    switch (options.format) {
      case 'json':
        return this.generateJsonReport(results, summary, options);
      case 'html':
        return this.generateHtmlReport(results, summary, options);
      case 'junit':
        return this.generateJUnitReport(results, summary, options);
      default:
        throw new Error(`Unsupported report format: ${options.format}`);
    }
  }

  private generateJsonReport(
    results: TestResult[],
    summary: TestSummary,
    options: ReportOptions
  ): string {
    return JSON.stringify({
      summary,
      results: results.map(result => ({
        ...result,
        error: options.includeStack ? result.error : result.error?.message
      }))
    }, null, 2);
  }

  private generateHtmlReport(
    results: TestResult[],
    summary: TestSummary,
    options: ReportOptions
  ): string {
    // Implementation for generating HTML report
    return '';
  }

  private generateJUnitReport(
    results: TestResult[],
    summary: TestSummary,
    options: ReportOptions
  ): string {
    // Implementation for generating JUnit XML report
    return '';
  }

  private onTestingStarted() {
    console.log('Starting test run...');
  }

  private onTestingCompleted(results: TestResult[]) {
    const summary = this.runner.getSummary();
    console.log('\nTest Run Summary:');
    console.log(`Total: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Duration: ${summary.duration}ms`);
  }

  private onTestCompleted(test: any, result: TestResult) {
    const status = result.success ? '✓' : '✗';
    console.log(`${status} ${test.label} (${result.duration}ms)`);
    if (!result.success && result.message) {
      console.log(`  Error: ${result.message}`);
    }
  }
} 