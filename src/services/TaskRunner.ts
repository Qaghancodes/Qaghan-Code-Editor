import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface Task {
  id: string;
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
}

export class TaskRunner extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private runningProcesses: Map<string, ChildProcess> = new Map();

  public registerTask(task: Task) {
    this.tasks.set(task.id, task);
  }

  public async runTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    return new Promise((resolve, reject) => {
      const process = spawn(task.command, task.args || [], {
        cwd: task.cwd,
        shell: true
      });

      this.runningProcesses.set(taskId, process);

      process.stdout.on('data', (data) => {
        this.emit('taskOutput', {
          taskId,
          type: 'stdout',
          data: data.toString()
        });
      });

      process.stderr.on('data', (data) => {
        this.emit('taskOutput', {
          taskId,
          type: 'stderr',
          data: data.toString()
        });
      });

      process.on('close', (code) => {
        this.runningProcesses.delete(taskId);
        if (code === 0) {
          this.emit('taskComplete', { taskId });
          resolve();
        } else {
          reject(new Error(`Task ${taskId} failed with code ${code}`));
        }
      });
    });
  }

  public stopTask(taskId: string) {
    const process = this.runningProcesses.get(taskId);
    if (process) {
      process.kill();
      this.runningProcesses.delete(taskId);
    }
  }

  public stopAllTasks() {
    for (const [taskId, process] of this.runningProcesses) {
      process.kill();
      this.runningProcesses.delete(taskId);
    }
  }
} 