import { FileSystemService } from '../FileSystemService';
import { promises as fs } from 'fs';

jest.mock('fs/promises');

describe('FileSystemService', () => {
  let fileSystem: FileSystemService;

  beforeEach(() => {
    fileSystem = new FileSystemService('/test/path');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('openFile', () => {
    it('should read file content successfully', async () => {
      const mockContent = 'test file content';
      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const content = await fileSystem.openFile('/test/file.txt');
      
      expect(content).toBe(mockContent);
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('should emit error when file reading fails', async () => {
      const error = new Error('File not found');
      (fs.readFile as jest.Mock).mockRejectedValue(error);

      const errorHandler = jest.fn();
      fileSystem.on('error', errorHandler);

      await expect(fileSystem.openFile('/test/file.txt')).rejects.toThrow();
      expect(errorHandler).toHaveBeenCalled();
    });
  });
}); 