interface ThemeDefinition {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: {
    [key: string]: string;
  };
  tokenColors: {
    scope: string | string[];
    settings: {
      foreground?: string;
      fontStyle?: string;
    };
  }[];
}

export class ThemeService {
  private currentTheme: ThemeDefinition | null = null;
  private themes: Map<string, ThemeDefinition> = new Map();
  private styleElement: HTMLStyleElement;

  constructor() {
    this.styleElement = document.createElement('style');
    document.head.appendChild(this.styleElement);
    this.loadBuiltinThemes();
  }

  private loadBuiltinThemes() {
    // Add default themes
    this.registerTheme({
      id: 'default-dark',
      name: 'Default Dark',
      type: 'dark',
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        // Add more colors
      },
      tokenColors: [
        {
          scope: ['keyword'],
          settings: {
            foreground: '#569cd6'
          }
        },
        // Add more token colors
      ]
    });
  }

  public registerTheme(theme: ThemeDefinition): void {
    this.themes.set(theme.id, theme);
  }

  public async setTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeDefinition): void {
    let css = '';

    // Apply color variables
    css += ':root {';
    Object.entries(theme.colors).forEach(([key, value]) => {
      css += `--${key}: ${value};`;
    });
    css += '}';

    // Apply token colors
    theme.tokenColors.forEach(token => {
      const scopes = Array.isArray(token.scope) ? token.scope : [token.scope];
      scopes.forEach(scope => {
        css += `
          .mtk-${scope.replace(/[^a-zA-Z0-9]/g, '-')} {
            color: ${token.settings.foreground};
            ${token.settings.fontStyle ? `font-style: ${token.settings.fontStyle};` : ''}
          }
        `;
      });
    });

    this.styleElement.textContent = css;
    document.body.setAttribute('data-theme', theme.type);
  }

  public getCurrentTheme(): ThemeDefinition | null {
    return this.currentTheme;
  }

  public getThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values());
  }
} 