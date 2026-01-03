// tests/__mocks__/vscode.ts

import { vi, Mock } from 'vitest';

// Base TreeItem mock
export class TreeItem {
  label?: string;
  collapsibleState?: number;
  iconPath?: any;
  contextValue?: string;
  command?: any;
  
  constructor(label: string, collapsibleState?: number) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
}

// EventEmitter - must be exported as named export
export class EventEmitter<T> {
  private listeners: Array<(e?: T) => any> = [];
  
  event = (listener: (e?: T) => any) => {
    this.listeners.push(listener);
    return { 
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index > -1) this.listeners.splice(index, 1);
      }
    };
  };

  fire(data?: T) {
    this.listeners.forEach(listener => listener(data));
  }

  dispose() {
    this.listeners = [];
  }
}

// ThemeIcon - must be exported as named export
export class ThemeIcon {
  id: string;
  
  constructor(id: string) {
    this.id = id;
  }
}

export const window = {
  activeTextEditor: undefined,
  showWarningMessage: vi.fn(),
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showInputBox: vi.fn(),
  showQuickPick: vi.fn(),
  createWebviewPanel: vi.fn(() => ({
    webview: { html: '' },
    reveal: vi.fn(),
    onDidDispose: vi.fn()
  })),
  createTreeView: vi.fn(() => ({ dispose: vi.fn() })),
  registerTreeDataProvider: vi.fn()
};

export const workspace = {
  getConfiguration: vi.fn(() => ({
    get: vi.fn(),
    has: vi.fn(),
    inspect: vi.fn(),
    update: vi.fn()
  })),
  onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() }))
};

export const commands = {
  registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
  executeCommand: vi.fn()
};

export const Uri = {
  file: (path: string) => ({ fsPath: path }),
  parse: (path: string) => ({ fsPath: path })
};

export const ViewColumn = { One: 1, Two: 2 };

export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2
};

const vscode = {
  window,
  workspace,
  commands,
  Uri,
  ViewColumn,
  TreeItemCollapsibleState,
  ThemeIcon,
  EventEmitter,
  TreeItem
};

export default vscode;