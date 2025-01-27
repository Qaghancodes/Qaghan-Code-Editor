import { TaskRunner } from '../TaskRunner';
import { EventEmitter } from 'events';

describe('TaskRunner', () => {
  let taskRunner: TaskRunner;

  beforeEach(() => {
    taskRunner = new TaskRunner();
  });

  it('should register a task', () => {
    const task = {
      id: 'test-task',
      name: 'Test Task',
      command: 'echo',
      args: ['hello']
    };

    taskRunner.registerTask(task);
    expect(taskRunner['tasks'].get('test-task')).toEqual(task);
  });

  it('should run a task and emit output', async () => {
    const task = {
      id: 'echo-task',
      name: 'Echo Task',
      command: 'echo',
      args: ['hello']
    };

    taskRunner.registerTask(task);

    const outputPromise = new Promise(resolve => {
      taskRunner.on('taskOutput', resolve);
    });

    taskRunner.runTask('echo-task');
    const output = await outputPromise;
    
    expect(output).toEqual({
      taskId: 'echo-task',
      type: 'stdout',
      data: expect.stringContaining('hello')
    });
  });

  it('should handle task failure', async () => {
    const task = {
      id: 'fail-task',
      name: 'Fail Task',
      command: 'nonexistent-command'
    };

    taskRunner.registerTask(task);
    await expect(taskRunner.runTask('fail-task')).rejects.toThrow();
  });
}); 