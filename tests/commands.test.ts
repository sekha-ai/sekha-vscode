import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Commands } from '../src/commands';
import * as vscode from 'vscode';
import type { SekhaClient, QueryResponse, Conversation, ContextAssembleResponse, LabelSuggestionsResponse } from '@sekha/sdk';

// Mock vscode
vi.mock('vscode', () => ({
  window: {
    showInputBox: vi.fn(),
    showQuickPick: vi.fn(),
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    activeTextEditor: undefined,
    createWebviewPanel: vi.fn(),
  },
  workspace: {
    getConfiguration: vi.fn(),
  },
  ViewColumn: { One: 1 },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
}));

describe('Commands', () => {
  let mockSekha: SekhaClient;
  let mockTreeView: any;
  let mockWebview: any;
  let commands: Commands;
  let mockEditor: any;
  let mockConfig: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSekha = {
      controller: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        query: vi.fn(),
        assembleContext: vi.fn(),
        suggestLabel: vi.fn(),
      },
      bridge: {
        complete: vi.fn(),
        summarize: vi.fn(),
      },
    } as any;

    mockTreeView = {
      refresh: vi.fn(),
    };

    mockWebview = {
      getConversationHtml: vi.fn().mockReturnValue('<html></html>'),
    };

    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'defaultFolder') return '/vscode';
        return undefined;
      }),
    };

    (vscode.workspace as any).getConfiguration.mockReturnValue(mockConfig);

    commands = new Commands(mockSekha, mockTreeView, mockWebview);

    mockEditor = {
      document: {
        getText: vi.fn(),
        lineAt: vi.fn(),
      },
      selection: {
        active: { line: 0 },
        end: { line: 0, character: 0 },
      },
      edit: vi.fn((callback) => {
        const editBuilder = {
          insert: vi.fn(),
        };
        callback(editBuilder);
        return Promise.resolve(true);
      }),
    };
  });

  describe('saveConversation', () => {
    it('should save conversation successfully', async () => {
      (vscode.window as any).activeTextEditor = mockEditor;
      mockEditor.document.getText.mockReturnValue('User: Hello\nAssistant: Hi there!');
      (vscode.window as any).showInputBox.mockResolvedValue('Test Label');

      await commands.saveConversation();

      expect(mockSekha.controller.create).toHaveBeenCalledWith({
        messages: expect.any(Array),
        label: 'Test Label',
        folder: '/vscode',
      });
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Conversation saved to Sekha!'
      );
      expect(mockTreeView.refresh).toHaveBeenCalled();
    });

    it('should warn if no active editor', async () => {
      (vscode.window as any).activeTextEditor = undefined;

      await commands.saveConversation();

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'No active editor to save from'
      );
    });

    it('should warn if editor is empty', async () => {
      (vscode.window as any).activeTextEditor = mockEditor;
      mockEditor.document.getText.mockReturnValue('');

      await commands.saveConversation();

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Editor is empty');
    });
  });

  describe('search', () => {
    it('should search and display results', async () => {
      const mockResponse: QueryResponse = {
        results: [
          {
            conversation_id: 'conv-1',
            label: 'Test Conv',
            folder: '/test',
            score: 0.95,
            conversation: {
              id: 'conv-1',
              label: 'Test Conv',
              messages: [{ role: 'user', content: 'test' }],
            } as Conversation,
          },
        ],
        total: 1,
        query: 'test',
      };

      (vscode.window as any).showInputBox.mockResolvedValue('test query');
      mockSekha.controller.query.mockResolvedValue(mockResponse);
      (vscode.window as any).showQuickPick.mockResolvedValue({
        conversationId: 'conv-1',
      });
      mockSekha.controller.get.mockResolvedValue(mockResponse.results[0].conversation);
      (vscode.window as any).createWebviewPanel.mockReturnValue({
        webview: { html: '' },
      });

      await commands.search();

      expect(mockSekha.controller.query).toHaveBeenCalledWith({
        query: 'test query',
        limit: 10,
      });
      expect(vscode.window.showQuickPick).toHaveBeenCalled();
    });

    it('should handle no results', async () => {
      (vscode.window as any).showInputBox.mockResolvedValue('test');
      mockSekha.controller.query.mockResolvedValue({
        results: [],
        total: 0,
        query: 'test',
      });

      await commands.search();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('No results found');
    });
  });

  describe('insertContext', () => {
    it('should insert assembled context', async () => {
      (vscode.window as any).activeTextEditor = mockEditor;
      (vscode.window as any).showInputBox.mockResolvedValue('context query');
      
      const mockContextResponse: ContextAssembleResponse = {
        assembled_context: 'Assembled context here',
        conversations_used: 2,
        tokens_used: 500,
      };

      mockSekha.controller.assembleContext.mockResolvedValue(mockContextResponse);

      await commands.insertContext();

      expect(mockSekha.controller.assembleContext).toHaveBeenCalledWith({
        query: 'context query',
        context_budget: 4000,
      });
      expect(mockEditor.edit).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Context inserted! (2 conversations, 500 tokens)'
      );
    });

    it('should handle no active editor', async () => {
      (vscode.window as any).showInputBox.mockResolvedValue('query');
      mockSekha.controller.assembleContext.mockResolvedValue({
        assembled_context: 'test',
        conversations_used: 1,
        tokens_used: 100,
      });

      await commands.insertContext();

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'No active editor to insert into'
      );
    });
  });

  describe('aiComplete', () => {
    it('should generate AI completion with memory context', async () => {
      (vscode.window as any).activeTextEditor = mockEditor;
      mockEditor.document.getText.mockReturnValue('Write a function');
      mockEditor.selection = {
        active: { line: 0 },
      };

      const mockQueryResponse: QueryResponse = {
        results: [
          {
            conversation_id: 'conv-1',
            label: 'Python Functions',
            score: 0.9,
            conversation: {
              id: 'conv-1',
              label: 'Python Functions',
              messages: [{ role: 'assistant', content: 'def example(): pass' }],
            } as Conversation,
          },
        ],
        total: 1,
        query: 'Write a function',
      };

      mockSekha.controller.query.mockResolvedValue(mockQueryResponse);
      mockSekha.bridge.complete.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'def my_function():\n    pass',
            },
          },
        ],
      });

      await commands.aiComplete();

      expect(mockSekha.controller.query).toHaveBeenCalled();
      expect(mockSekha.bridge.complete).toHaveBeenCalled();
      expect(mockEditor.edit).toHaveBeenCalled();
    });

    it('should warn if no text to complete', async () => {
      (vscode.window as any).activeTextEditor = mockEditor;
      mockEditor.document.getText.mockReturnValue('');
      mockEditor.document.lineAt.mockReturnValue({ text: '' });

      await commands.aiComplete();

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'No text selected or at cursor'
      );
    });
  });

  describe('summarizeSelection', () => {
    it('should summarize selected text', async () => {
      (vscode.window as any).activeTextEditor = mockEditor;
      mockEditor.document.getText.mockReturnValue('Long text to summarize...');
      (vscode.window as any).showQuickPick.mockResolvedValue({
        label: 'Brief',
        value: 'brief',
      });
      mockSekha.bridge.summarize.mockResolvedValue({
        summary: 'Short summary',
      });

      await commands.summarizeSelection();

      expect(mockSekha.bridge.summarize).toHaveBeenCalledWith({
        text: 'Long text to summarize...',
        level: 'brief',
      });
      expect(mockEditor.edit).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Summary inserted!');
    });

    it('should warn if no text selected', async () => {
      (vscode.window as any).activeTextEditor = mockEditor;
      mockEditor.document.getText.mockReturnValue('');

      await commands.summarizeSelection();

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No text selected');
    });
  });

  describe('suggestLabels', () => {
    it('should suggest labels for conversation', async () => {
      (vscode.window as any).activeTextEditor = mockEditor;
      mockEditor.document.getText.mockReturnValue('User: How to code?\nAssistant: Here is how...');

      const mockSuggestions: LabelSuggestionsResponse = {
        suggestions: [
          {
            label: 'Programming Help',
            confidence: 0.95,
            reasoning: 'Discussion about coding',
          },
          {
            label: 'Tutorial',
            confidence: 0.85,
            reasoning: 'Educational content',
          },
        ],
      };

      mockSekha.controller.suggestLabel.mockResolvedValue(mockSuggestions);
      (vscode.window as any).showQuickPick.mockResolvedValue({
        value: 'Programming Help',
      });

      await commands.suggestLabels();

      expect(mockSekha.controller.suggestLabel).toHaveBeenCalledWith({
        messages: expect.any(Array),
        count: 5,
      });
      expect(vscode.window.showQuickPick).toHaveBeenCalled();
    });

    it('should warn if editor is empty', async () => {
      (vscode.window as any).activeTextEditor = mockEditor;
      mockEditor.document.getText.mockReturnValue('');

      await commands.suggestLabels();

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Editor is empty');
    });
  });
});