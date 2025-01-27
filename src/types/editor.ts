export interface EditorConfig {
  theme?: string;
  fontSize?: number;
  language?: string;
  enabledFeatures?: EditorFeatures;
  plugins?: Plugin[];
}

export interface EditorFeatures {
  git?: boolean;
  lsp?: boolean;
  debugger?: boolean;
  terminal?: boolean;
  collaboration?: boolean;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  activate: () => Promise<void>;
  deactivate: () => Promise<void>;
} 