interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
}

interface PerformanceTestCase {
  name: string;
  setup?: () => Promise<void>;
  test: () => Promise<void>;
  teardown?: () => Promise<void>;
  iterations?: number;
  warmupIterations?: number;
}

interface PerformanceTestResult {
  testName: string;
  metrics: PerformanceMetrics[];
  averageMetrics: PerformanceMetrics;
  standardDeviation: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export class PerformanceTestRunner {
  private results: Map<string, PerformanceTestResult> = new Map();

  public async runTest(testCase: PerformanceTestCase): Promise<PerformanceTestResult> {
    const iterations = testCase.iterations || 100;
    const warmupIterations = testCase.warmupIterations || 10;

    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      await this.runSingleIteration(testCase);
    }

    // Actual test
    const metrics: PerformanceMetrics[] = [];
    for (let i = 0; i < iterations; i++) {
      const result = await this.runSingleIteration(testCase);
      metrics.push(result);
    }

    const testResult = this.calculateTestResult(testCase.name, metrics);
    this.results.set(testCase.name, testResult);
    return testResult;
  }

  private async runSingleIteration(testCase: PerformanceTestCase): Promise<PerformanceMetrics> {
    if (testCase.setup) {
      await testCase.setup();
    }

    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();
    const startTime = performance.now();

    await testCase.test();

    const endTime = performance.now();
    const endCpu = process.cpuUsage(startCpu);
    const endMemory = process.memoryUsage();

    if (testCase.teardown) {
      await testCase.teardown();
    }

    return {
      executionTime: endTime - startTime,
      memoryUsage: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external
      },
      cpuUsage: {
        user: endCpu.user,
        system: endCpu.system
      }
    };
  }

  private calculateTestResult(
    testName: string,
    metrics: PerformanceMetrics[]
  ): PerformanceTestResult {
    const executionTimes = metrics.map(m => m.executionTime);
    const sorted = [...executionTimes].sort((a, b) => a - b);

    return {
      testName,
      metrics,
      averageMetrics: this.calculateAverageMetrics(metrics),
      standardDeviation: this.calculateStandardDeviation(executionTimes),
      percentiles: {
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      }
    };
  }

  private calculateAverageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    const sum = metrics.reduce(
      (acc, curr) => ({
        executionTime: acc.executionTime + curr.executionTime,
        memoryUsage: {
          heapUsed: acc.memoryUsage.heapUsed + curr.memoryUsage.heapUsed,
          heapTotal: acc.memoryUsage.heapTotal + curr.memoryUsage.heapTotal,
          external: acc.memoryUsage.external + curr.memoryUsage.external
        },
        cpuUsage: curr.cpuUsage ? {
          user: acc.cpuUsage!.user + curr.cpuUsage.user,
          system: acc.cpuUsage!.system + curr.cpuUsage.system
        } : undefined
      }),
      {
        executionTime: 0,
        memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0 },
        cpuUsage: { user: 0, system: 0 }
      }
    );

    return {
      executionTime: sum.executionTime / metrics.length,
      memoryUsage: {
        heapUsed: sum.memoryUsage.heapUsed / metrics.length,
        heapTotal: sum.memoryUsage.heapTotal / metrics.length,
        external: sum.memoryUsage.external / metrics.length
      },
      cpuUsage: sum.cpuUsage ? {
        user: sum.cpuUsage.user / metrics.length,
        system: sum.cpuUsage.system / metrics.length
      } : undefined
    };
  }

  private calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b) / values.length);
  }

  public generateReport(): string {
    let report = 'Performance Test Report\n';
    report += '======================\n\n';

    for (const [testName, result] of this.results) {
      report += `Test: ${testName}\n`;
      report += `-----------------\n`;
      report += `Average Execution Time: ${result.averageMetrics.executionTime.toFixed(2)}ms\n`;
      report += `Standard Deviation: ${result.standardDeviation.toFixed(2)}ms\n`;
      report += `Percentiles:\n`;
      report += `  50th: ${result.percentiles.p50.toFixed(2)}ms\n`;
      report += `  90th: ${result.percentiles.p90.toFixed(2)}ms\n`;
      report += `  95th: ${result.percentiles.p95.toFixed(2)}ms\n`;
      report += `  99th: ${result.percentiles.p99.toFixed(2)}ms\n`;
      report += `Memory Usage (avg):\n`;
      report += `  Heap Used: ${(result.averageMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB\n`;
      report += `  Heap Total: ${(result.averageMetrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB\n`;
      report += '\n';
    }

    return report;
  }
} 