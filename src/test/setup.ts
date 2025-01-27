import '@testing-library/jest-dom';

// Mock electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn()
  },
  ipcMain: {
    on: jest.fn(),
    send: jest.fn()
  },
  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn()
  }
}));

// Mock monaco-editor
jest.mock('monaco-editor', () => ({
  editor: {
    create: jest.fn(() => ({
      dispose: jest.fn(),
      layout: jest.fn(),
      setValue: jest.fn(),
      getValue: jest.fn(),
      onDidChangeModelContent: jest.fn()
    }))
  },
  languages: {
    register: jest.fn(),
    registerCompletionItemProvider: jest.fn()
  }
})); 