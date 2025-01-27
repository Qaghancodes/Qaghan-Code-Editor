interface ProfilerMark {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  children: ProfilerMark[];
}

interface ProfilerOptions {
  maxSampleSize?: number;
  samplingRate?: number;
  includeStack?: boolean;
}

export class PerformanceProfiler {
  private activeMarks: Map<string, ProfilerMark> = new Map();
  private completedMarks: ProfilerMark[] = [];
  private options: Required<ProfilerOptions>;
  private isRecording: boolean = false;
  private stackTraces: Map<string, string> = new Map();

  constructor(options: ProfilerOptions = {}) {
    this.options = {
      maxSampleSize: options.maxSampleSize || 1000,
      samplingRate: options.samplingRate || 1,
      includeStack: options.includeStack || false
    };
  }

  public startRecording() {
    this.isRecording = true;
    this.activeMarks.clear();
    this.completedMarks = [];
    this.stackTraces.clear();
  }

  public stopRecording(): ProfilerMark[] {
    this.isRecording = false;
    // Complete any remaining active marks
    this.activeMarks.forEach(mark => this.endMark(mark.id));
    return this.completedMarks;
  }

  public startMark(name: string, metadata?: Record<string, any>): string {
    if (!this.isRecording) return '';

    const id = this.generateId();
    const mark: ProfilerMark = {
      id,
      name,
      startTime: performance.now(),
      metadata,
      children: []
    };

    if (this.options.includeStack) {
      this.stackTraces.set(id, new Error().stack || '');
    }

    this.activeMarks.set(id, mark);
    return id;
  }

  public endMark(id: string) {
    if (!this.isRecording) return;

    const mark = this.activeMarks.get(id);
    if (mark) {
      mark.endTime = performance.now();
      mark.duration = mark.endTime - mark.startTime;
      this.activeMarks.delete(id);
      this.completedMarks.push(mark);

      this.trimSamples();
    }
  }

  public addMetadata(id: string, metadata: Record<string, any>) {
    const mark = this.activeMarks.get(id);
    if (mark) {
      mark.metadata = { ...mark.metadata, ...metadata };
    }
  }

  public getMarks(): ProfilerMark[] {
    return this.completedMarks;
  }

  public getMarkById(id: string): ProfilerMark | undefined {
    return this.completedMarks.find(mark => mark.id === id);
  }

  public getStackTrace(id: string): string | undefined {
    return this.stackTraces.get(id);
  }

  public clear() {
    this.activeMarks.clear();
    this.completedMarks = [];
    this.stackTraces.clear();
  }

  public generateReport(): string {
    const marks = this.getMarks();
    let report = 'Performance Profile Report\n';
    report += '========================\n\n';

    const totalTime = marks.reduce((sum, mark) => sum + (mark.duration || 0), 0);
    report += `Total Time: ${totalTime.toFixed(2)}ms\n`;
    report += `Total Marks: ${marks.length}\n\n`;

    // Group marks by name
    const groupedMarks = this.groupMarksByName(marks);
    
    for (const [name, group] of groupedMarks) {
      const avgTime = group.reduce((sum, mark) => sum + (mark.duration || 0), 0) / group.length;
      const maxTime = Math.max(...group.map(mark => mark.duration || 0));
      const minTime = Math.min(...group.map(mark => mark.duration || 0));

      report += `${name}:\n`;
      report += `  Count: ${group.length}\n`;
      report += `  Average: ${avgTime.toFixed(2)}ms\n`;
      report += `  Max: ${maxTime.toFixed(2)}ms\n`;
      report += `  Min: ${minTime.toFixed(2)}ms\n\n`;
    }

    return report;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private trimSamples() {
    if (this.completedMarks.length > this.options.maxSampleSize) {
      this.completedMarks = this.completedMarks.slice(-this.options.maxSampleSize);
    }
  }

  private groupMarksByName(marks: ProfilerMark[]): Map<string, ProfilerMark[]> {
    const groups = new Map<string, ProfilerMark[]>();
    
    marks.forEach(mark => {
      const group = groups.get(mark.name) || [];
      group.push(mark);
      groups.set(mark.name, group);
    });

    return groups;
  }
} 