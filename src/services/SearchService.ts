export interface SearchResult {
  line: number;
  column: number;
  text: string;
  matchLength: number;
}

export class SearchService {
  private editor: monaco.editor.IStandaloneCodeEditor;

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
  }

  public findAll(searchText: string, isRegex: boolean = false): SearchResult[] {
    const model = this.editor.getModel();
    if (!model) return [];

    const matches = model.findMatches(
      searchText,
      false, // searchOnlyEditableRange
      isRegex, // isRegExp
      false, // matchCase
      null, // wordSeparators
      true // captureMatches
    );

    return matches.map(match => ({
      line: match.range.startLineNumber,
      column: match.range.startColumn,
      text: match.matches![0],
      matchLength: match.matches![0].length
    }));
  }

  public replace(searchText: string, replaceText: string, isRegex: boolean = false): number {
    const model = this.editor.getModel();
    if (!model) return 0;

    const matches = this.findAll(searchText, isRegex);
    let replacements = 0;

    // Apply replacements from last to first to maintain position accuracy
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const range = new monaco.Range(
        match.line,
        match.column,
        match.line,
        match.column + match.matchLength
      );

      model.pushEditOperations(
        [],
        [{
          range: range,
          text: replaceText
        }],
        () => null
      );
      replacements++;
    }

    return replacements;
  }
} 