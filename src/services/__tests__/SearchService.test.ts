import { SearchService } from '../SearchService';
import * as monaco from 'monaco-editor';

describe('SearchService', () => {
  let searchService: SearchService;
  let mockEditor: jest.Mocked<monaco.editor.IStandaloneCodeEditor>;
  let mockModel: jest.Mocked<monaco.editor.ITextModel>;

  beforeEach(() => {
    mockModel = {
      findMatches: jest.fn(),
      pushEditOperations: jest.fn()
    } as any;

    mockEditor = {
      getModel: jest.fn().mockReturnValue(mockModel)
    } as any;

    searchService = new SearchService(mockEditor);
  });

  describe('findAll', () => {
    it('should return matches from the editor model', () => {
      const mockMatches = [{
        range: { startLineNumber: 1, startColumn: 1 },
        matches: ['test']
      }];

      mockModel.findMatches.mockReturnValue(mockMatches);

      const results = searchService.findAll('test');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        line: 1,
        column: 1,
        text: 'test',
        matchLength: 4
      });
    });
  });

  describe('replace', () => {
    it('should replace all occurrences and return count', () => {
      const mockMatches = [{
        range: { startLineNumber: 1, startColumn: 1 },
        matches: ['test']
      }];

      mockModel.findMatches.mockReturnValue(mockMatches);

      const count = searchService.replace('test', 'replaced');

      expect(count).toBe(1);
      expect(mockModel.pushEditOperations).toHaveBeenCalled();
    });
  });
}); 