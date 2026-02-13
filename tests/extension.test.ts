import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { activate, deactivate } from '../src/extension';
import * as vscode from 'vscode';

// Mock VS Code API - define directly in factory
vi.mock('vscode', () => ({
  window: {
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    createTreeView: vi.fn().mockReturnValue({}),
    registerTreeDataProvider: vi.fn()
  },
  workspace: {
    getConfiguration: vi.fn(),
    onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() }))
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn()
  },
  ExtensionContext: vi.fn(),
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  },
  ViewColumn: { One: 1 },
  Uri: {
    file: (path: string) => ({ fsPath: path })
  },
  ConfigurationChangeEvent: vi.fn()
}));

// Mock @sekha/sdk with new SekhaClient
vi.mock('@sekha/sdk', () => ({
  SekhaClient: vi.fn().mockImplementation(() => ({
    controller: {
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      query: vi.fn(),
      assembleContext: vi.fn(),
    },
    bridge: {
      complete: vi.fn(),
      summarize: vi.fn(),
    }
  })),
  SekhaConfig: vi.fn()
}));

// Fix: Mock as actual class, not factory function
class MockSekhaTreeDataProvider {
  refresh = vi.fn();
}

class MockCommands {
  saveConversation = vi.fn();
  search = vi.fn();
  insertContext = vi.fn();
  searchAndInsert = vi.fn();
  aiComplete = vi.fn();
  summarizeSelection = vi.fn();
  suggestLabels = vi.fn();
  viewConversation = vi.fn();
  openSettings = vi.fn();
  autoSaveConversation = vi.fn();
}

class MockWebviewProvider {
  getConversationHtml = vi.fn().mockReturnValue('<html></html>');
}

vi.mock('../src/treeView', () => ({
  SekhaTreeDataProvider: vi.fn().mockImplementation(function(this: any) {
    return new MockSekhaTreeDataProvider();
  })
}));

vi.mock('../src/commands', () => ({
  Commands: vi.fn().mockImplementation(function(this: any) {
    return new MockCommands();
  })
}));

vi.mock('../src/webview', () => ({
  WebviewProvider: vi.fn().mockImplementation(function(this: any, uri: any) {
    return new MockWebviewProvider();
  })
}));

describe('Extension', () => {
  let mockContext: vscode.ExtensionContext;
  let mockConfig: any;
  let setIntervalSpy: any;
  let clearIntervalSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      subscriptions: [],
      extensionUri: { fsPath: '/test' } as vscode.Uri
    } as any;

    mockConfig = {
      get: vi.fn((key: string) => {
        switch (key) {
          case 'apiUrl': return 'http://localhost:8080';
          case 'apiKey': return 'sk-'.padEnd(35, 'x');
          case 'bridgeUrl': return 'http://localhost:5001';
          case 'autoSave': return false;
          case 'autoSaveInterval': return 5;
          default: return undefined;
        }
      })
    };

    (vscode.workspace as any).getConfiguration.mockReturnValue(mockConfig);
    (vscode.workspace as any).onDidChangeConfiguration.mockReturnValue({ dispose: vi.fn() });
    (vscode.commands as any).registerCommand.mockReturnValue({ dispose: vi.fn() });

    setIntervalSpy = vi.spyOn(global, 'setInterval');
    clearIntervalSpy = vi.spyOn(global, 'clearInterval');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('activate', () => {
    it('should activate successfully with valid config', async () => {
      await activate(mockContext);

      expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('sekha');
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    it('should show warning with invalid config', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'apiUrl') return '';
        if (key === 'apiKey') return '';
        return undefined;
      });

      await activate(mockContext);

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'Sekha: Configuration missing. Please set sekha.apiUrl and sekha.apiKey in settings.'
      );
    });

    it('should register all commands including new Bridge commands', async () => {
      await activate(mockContext);

      // Original commands
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'sekha.saveConversation',
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'sekha.search',
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'sekha.searchAndInsert',
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'sekha.insertContext',
        expect.any(Function)
      );
      
      // New Bridge commands
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'sekha.aiComplete',
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'sekha.summarizeSelection',
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'sekha.suggestLabels',
        expect.any(Function)
      );
      
      // Utility commands
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'sekha.refresh',
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'sekha.viewConversation',
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'sekha.openSettings',
        expect.any(Function)
      );
    });

    it('should setup configuration watcher', async () => {
      await activate(mockContext);

      expect(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
    });

    it('should setup auto-save when enabled', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        switch (key) {
          case 'apiUrl': return 'http://localhost:8080';
          case 'apiKey': return 'sk-'.padEnd(35, 'x');
          case 'autoSave': return true;
          case 'autoSaveInterval': return 5;
          default: return undefined;
        }
      });

      await activate(mockContext);

      expect(setIntervalSpy).toHaveBeenCalled();
    });

    it('should not setup auto-save when disabled', async () => {
      await activate(mockContext);

      expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    it('should enforce minimum auto-save interval', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        switch (key) {
          case 'apiUrl': return 'http://localhost:8080';
          case 'apiKey': return 'sk-'.padEnd(35, 'x');
          case 'autoSave': return true;
          case 'autoSaveInterval': return 0.5; // Less than 1 minute
          default: return undefined;
        }
      });

      await activate(mockContext);

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
    });
  });

  describe('deactivate', () => {
    it('should clear auto-save timer', () => {
      const spy = vi.spyOn(global, 'clearInterval');
      
      // Activate with auto-save enabled
      mockConfig.get.mockImplementation((key: string) => {
        switch (key) {
          case 'apiUrl': return 'http://localhost:8080';
          case 'apiKey': return 'sk-'.padEnd(35, 'x');
          case 'autoSave': return true;
          case 'autoSaveInterval': return 5;
          default: return undefined;
        }
      });

      activate(mockContext);
      deactivate();

      // The extension should call clearInterval on the timer
      expect(spy).toHaveBeenCalled();
      
      spy.mockRestore();
    });
  });
});