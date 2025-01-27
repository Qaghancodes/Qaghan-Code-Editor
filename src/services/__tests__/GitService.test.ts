import { GitService } from '../GitService';
import simpleGit from 'simple-git';

jest.mock('simple-git');

describe('GitService', () => {
  let gitService: GitService;
  let mockGit: jest.Mocked<ReturnType<typeof simpleGit>>;

  beforeEach(() => {
    mockGit = {
      init: jest.fn(),
      status: jest.fn(),
      add: jest.fn(),
      commit: jest.fn()
    } as any;
    (simpleGit as jest.Mock).mockReturnValue(mockGit);
    
    gitService = new GitService('/test/path');
  });

  describe('init', () => {
    it('should initialize git repository', async () => {
      mockGit.init.mockResolvedValue(undefined);
      
      await gitService.init();
      
      expect(mockGit.init).toHaveBeenCalled();
    });
  });

  describe('stage', () => {
    it('should stage specified files', async () => {
      const files = ['file1.ts', 'file2.ts'];
      mockGit.add.mockResolvedValue(undefined);
      
      await gitService.stage(files);
      
      expect(mockGit.add).toHaveBeenCalledWith(files);
    });
  });
}); 