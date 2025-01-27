import { readFile, writeFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { EventEmitter } from 'events';

export class FileSystemService extends EventEmitter {
  private workingDirectory: string;

  constructor(initialDirectory: string) {
    super();
    this.workingDirectory = initialDirectory;
  }

  async openFile(path: string): Promise<string> {
    try {
      const content = await readFile(path, 'utf-8');
      this.emit('fileOpened', { path, content });
      return content;
    } catch (error) {
      this.emit('error', `Failed to open file: ${error.message}`);
      throw error;
    }
  }

  async saveFile(path: string, content: string): Promise<void> {
    try {
      await writeFile(path, content, 'utf-8');
      this.emit('fileSaved', { path });
    } catch (error) {
      this.emit('error', `Failed to save file: ${error.message}`);
      throw error;
    }
  }

  async listFiles(directory: string = this.workingDirectory): Promise<string[]> {
    try {
      const files = await readdir(directory, { withFileTypes: true });
      return files.map(file => ({
        name: file.name,
        path: join(directory, file.name),
        isDirectory: file.isDirectory()
      }));
    } catch (error) {
      this.emit('error', `Failed to list files: ${error.message}`);
      throw error;
    }
  }
} 