interface TokenDefinition {
  pattern: RegExp;
  type: string;
}

interface LanguageDefinition {
  id: string;
  name: string;
  fileExtensions: string[];
  tokens: TokenDefinition[];
  completionItems?: CompletionItem[];
  formatter?: (code: string) => string;
}

interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText: string;
}

enum CompletionItemKind {
  Text,
  Method,
  Function,
  Constructor,
  Field,
  Variable,
  Class,
  Interface,
  Module,
  Property,
  Keyword,
  Snippet
}

export class LanguageService {
  private languages: Map<string, LanguageDefinition> = new Map();

  public registerLanguage(definition: LanguageDefinition) {
    this.languages.set(definition.id, definition);
    
    // Register with Monaco Editor
    monaco.languages.register({
      id: definition.id,
      extensions: definition.fileExtensions,
      aliases: [definition.name]
    });

    // Register tokenizer
    monaco.languages.setMonarchTokensProvider(definition.id, {
      tokenizer: {
        root: definition.tokens.map(token => ([{
          regex: token.pattern,
          action: { token: token.type }
        }]))
      }
    });

    // Register completion provider if available
    if (definition.completionItems) {
      monaco.languages.registerCompletionItemProvider(definition.id, {
        provideCompletionItems: () => ({
          suggestions: definition.completionItems!.map(item => ({
            ...item,
            kind: monaco.languages.CompletionItemKind[
              CompletionItemKind[item.kind] as keyof typeof monaco.languages.CompletionItemKind
            ]
          }))
        })
      });
    }

    // Register formatter if available
    if (definition.formatter) {
      monaco.languages.registerDocumentFormattingEditProvider(definition.id, {
        provideDocumentFormattingEdits: (model) => {
          const text = model.getValue();
          const formatted = definition.formatter!(text);
          return [{
            range: model.getFullModelRange(),
            text: formatted
          }];
        }
      });
    }
  }

  public getLanguageForFile(filename: string): string | undefined {
    const ext = filename.split('.').pop()!;
    for (const [id, lang] of this.languages) {
      if (lang.fileExtensions.includes(`.${ext}`)) {
        return id;
      }
    }
    return undefined;
  }
} 