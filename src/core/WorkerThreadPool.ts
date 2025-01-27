interface WorkerTask {
  id: string;
  type: string;
  payload: any;
  priority: number;
}

export class WorkerThreadPool {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeWorkers = new Map<Worker, WorkerTask>();
  private maxWorkers: number;

  constructor() {
    this.maxWorkers = navigator.hardwareConcurrency || 4;
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module'
      });
      
      worker.onmessage = (e) => this.handleWorkerMessage(worker, e);
      worker.onerror = (e) => this.handleWorkerError(worker, e);
      
      this.workers.push(worker);
    }
  }

  public scheduleTask(task: WorkerTask): Promise<any> {
    return new Promise((resolve, reject) => {
      const enhancedTask = {
        ...task,
        resolve,
        reject
      };

      this.taskQueue.push(enhancedTask);
      this.processNextTask();
    });
  }

  private processNextTask() {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(
      worker => !this.activeWorkers.has(worker)
    );

    if (!availableWorker) return;

    // Sort tasks by priority
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    const task = this.taskQueue.shift();
    if (task) {
      this.activeWorkers.set(availableWorker, task);
      availableWorker.postMessage({
        id: task.id,
        type: task.type,
        payload: task.payload
      });
    }
  }

  private handleWorkerMessage(worker: Worker, event: MessageEvent) {
    const task = this.activeWorkers.get(worker);
    if (task) {
      task.resolve(event.data);
      this.activeWorkers.delete(worker);
      this.processNextTask();
    }
  }

  private handleWorkerError(worker: Worker, error: ErrorEvent) {
    const task = this.activeWorkers.get(worker);
    if (task) {
      task.reject(error);
      this.activeWorkers.delete(worker);
      this.processNextTask();
    }
  }

  public terminateAll() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers.clear();
  }
} 