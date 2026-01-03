import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Commands } from '../src/commands';
import { MemoryController, Conversation, SearchResult, Message } from '@sekha/sdk';
import { SekhaTreeDataProvider } from '../src/treeView';
import { WebviewProvider } from '../src/webview';
import * as vscode from 'vscode';

// Define mock inside the factory to avoid hoisting issues
vi.mock('vscode', () => ({
  window: {
    activeTextEditor: undefined,
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showInputBox: vi.fn(),
    showQuickPick: vi.fn(),
    createWebviewPanel: vi.fn(() => ({
      webview: { html: '' }
    }))
  },
  workspace: {
    getConfiguration: vi.fn()
  },
  commands: {
    executeCommand: vi.fn()
  },
  ViewColumn: { One: 1 },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  },
  ThemeIcon: vi.fn((id: string) => ({ id })),
  Uri: {
    file: (path: string) => ({ fsPath: path })
  }
}));

describe('Commands', () => {
  let mockMemory: any;
  let mockTreeView: any;
  let mockWebview: any;
  let commands: Commands;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockMemory = {
      store: vi.fn(),
      get: vi.fn(),
      listConversations: vi.fn(),
      query: vi.fn(),
      assembleContext: vi.fn()
    };

    mockTreeView = {
      refresh: vi.fn()
    };

    mockWebview = {
      getConversationHtml: vi.fn().mockReturnValue('<html></html>')
    };

    commands = new Commands(mockMemory, mockTreeView as any, mockWebview as any);
  });

  describe('saveConversation', () => {
    it('should show warning when no active editor', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).activeTextEditor = undefined;
      
      await commands.saveConversation();
      
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'No active editor to save from'
      );
    });

    it('should save conversation successfully', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).activeTextEditor = {
        document: { 
          getText: () => 'User: Hello\nAssistant: Hi there!',
          isDirty: false
        }
      };
      (vscode.window as any).showInputBox.mockResolvedValue('Test Conversation');
      (vscode.window as any).showInformationMessage.mockResolvedValue(undefined);
      mockMemory.store.mockResolvedValue({ id: '123' });

      await commands.saveConversation();

      expect(mockMemory.store).toHaveBeenCalledWith({
        messages: [
          { role: 'user', content: 'Hello' } as Message,
          { role: 'assistant', content: 'Hi there!' } as Message,
        ],
        label: 'Test Conversation',
        folder: '/vscode',
      });
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Conversation saved to Sekha!'
      );
      expect(mockTreeView.refresh).toHaveBeenCalled();
    });

    it('should handle autoSaveConversation with malformed content', async () => {
      const vscode = await import('vscode');
      // Content that parses to zero messages
      (vscode.window as any).activeTextEditor = {
        document: { getText: () => 'Just plain text without roles' }
      };
      
      await commands.autoSaveConversation();
      
      expect(mockMemory.store).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search and show results', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).showInputBox.mockResolvedValue('test query');
      const mockResults: SearchResult[] = [
        { 
          id: '123', 
          label: 'Test', 
          score: 0.95, 
          conversationId: '123',
          content: 'Test content',
          similarity: 0.95,
          status: 'active',
          importanceScore: 0.5,
          createdAt: new Date().toISOString()
        } as SearchResult,
      ];
      mockMemory.query.mockResolvedValue(mockResults);
      (vscode.window as any).showQuickPick.mockResolvedValue(undefined);

      await commands.search();

      expect(mockMemory.query).toHaveBeenCalledWith('test query');
      expect(vscode.window.showQuickPick).toHaveBeenCalled();
    });

    it('should show message when no search results', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).showInputBox.mockResolvedValue('test');
      mockMemory.query.mockResolvedValue([]);
      
      await commands.search();
      
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('No results found');
    });

    it('should handle conversation selection cancellation in search', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).showInputBox.mockResolvedValue('test');
      (vscode.window as any).showQuickPick.mockResolvedValue(undefined);
      mockMemory.query.mockResolvedValue([{ id: '123', label: 'Test', score: 0.95 }]);
      
      await commands.search();
      
      expect(mockMemory.get).not.toHaveBeenCalled();
    });
  });

  describe('parseMessages edge cases', () => {
    it('should handle messages with colons in content', () => {
      const content = 'User: Hello: How are you?\nAssistant: I am: fine!';
      const result = (commands as any).parseMessages(content);
      
      expect(result).toEqual([
        { role: 'user', content: 'Hello: How are you?' } as Message,
        { role: 'assistant', content: 'I am: fine!' } as Message
      ]);
    });

    it('should handle system messages in parseMessages', () => {
      const content = 'System: You are a helpful assistant\nUser: Hello\nAssistant: Hi';
      const result = (commands as any).parseMessages(content);
      
      expect(result).toEqual([
        { role: 'user', content: 'Hello' } as Message,
        { role: 'assistant', content: 'Hi' } as Message
      ]);
    });

    it('should handle parseMessages with only role markers and no content', () => {
      const content = 'User:\nAssistant:'; // Empty role content
      const result = (commands as any).parseMessages(content);
      
      expect(result).toEqual([
        { role: 'user', content: '' } as Message,
        { role: 'assistant', content: '' } as Message
      ]);
    });

    it('should handle content with only whitespace', () => {
      const result = (commands as any).parseMessages('   \n   \n   ');
      expect(result).toHaveLength(0);
    });

    it('should handle messages without role markers', () => {
      const content = 'This is just text without roles';
      const result = (commands as any).parseMessages(content);
      expect(result).toHaveLength(0);
    });

    it('should handle trailing newlines', () => {
      const content = 'User: Hello\n\n\n';
      const result = (commands as any).parseMessages(content);
      expect(result).toEqual([{ role: 'user', content: 'Hello' } as Message]);
    });

    it('should handle empty lines between messages', () => {
      const content = 'User: Hello\n\n\nAssistant: Hi';
      const result = (commands as any).parseMessages(content);
      
      expect(result).toEqual([
        { role: 'user', content: 'Hello' } as Message,
        { role: 'assistant', content: 'Hi' } as Message
      ]);
    });
  });

  describe('error handling', () => {
    it('should handle API errors in search', async () => {
      mockMemory.query.mockRejectedValue(new Error('API Error'));
      
      await commands.search();
      
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Search failed: API Error');
    });

    it('should handle API errors in searchAndInsert', async () => {
      mockMemory.query.mockRejectedValue(new Error('API Error'));
      
      await commands.searchAndInsert();
      
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Search and insert failed: API Error');
    });

    it('should silently fail autoSave on API error', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).activeTextEditor = {
        document: { getText: () => 'User: Test' }
      };
      mockMemory.store.mockRejectedValue(new Error('API Error'));
      
      // Should not throw
      await expect(commands.autoSaveConversation()).resolves.not.toThrow();
    });

    it('should silently return if no content for autoSave', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).activeTextEditor = {
        document: { getText: () => '' }
      };
      
      await commands.autoSaveConversation();
      
      expect(mockMemory.store).not.toHaveBeenCalled();
    });

    it('should throw error when no editor for insertConversationContext', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).activeTextEditor = undefined;
      
      const mockConversation: Conversation = {
        id: '1',
        label: 'Test',
        messages: [{ role: 'user', content: 'Test' } as Message],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };
      
      await expect(commands.insertConversationContext(mockConversation)).rejects.toThrow(
        'No active editor'
      );
    });  

    it('should show warning when no active editor for insertContext', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).activeTextEditor = undefined;
      
      mockMemory.assembleContext.mockResolvedValue({
        formattedContext: 'Test context',
        sources: []
      });
      
      await commands.insertContext();
      
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'No active editor to insert into'
      );
    });

    it('should handle cancellation in searchAndInsert', async () => {
      mockMemory.query.mockResolvedValue([
        { id: '123', label: 'Test', score: 0.95 }
      ]);
      
      // Add vi.mocked wrapper
      vi.mocked(vscode.window.showQuickPick).mockResolvedValue(undefined);
      
      await commands.searchAndInsert();
      
      expect(mockMemory.get).not.toHaveBeenCalled();
    });
  });  

  describe('insertContext error paths', () => {
    it('should handle context assembly failure', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).activeTextEditor = undefined;
      
      mockMemory.assembleContext.mockRejectedValue(new Error('Context error'));
      
      await commands.insertContext();
      
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Failed to insert context: Context error'
      );
    });

    it('should return early if no query in searchAndInsert', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).showInputBox.mockResolvedValue('');
      
      await commands.searchAndInsert();
      
      expect(mockMemory.query).not.toHaveBeenCalled();
    });

    it('should handle errors when inserting context', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).showInputBox.mockResolvedValue('test query');
      mockMemory.assembleContext.mockRejectedValue(new Error('Context Error'));
      // Add active editor to reach the assembleContext call
      (vscode.window as any).activeTextEditor = {
        edit: vi.fn(),
        selection: { active: { line: 0, character: 0 } }
      };
      
      await commands.insertContext();
      
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to insert context: Context Error');
    });

    it('should handle missing active editor in insertContext', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).activeTextEditor = undefined;
      mockMemory.assembleContext.mockResolvedValue({
        formattedContext: 'Test',
        sources: []
      });
      
      await commands.insertContext();
      
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'No active editor to insert into'
      );
    });
  });

  describe('viewConversation edge cases', () => {
    it('should handle conversation with no label', async () => {
      const vscode = await import('vscode');
      const mockConversation: Conversation = {
        id: '123',
        label: '',
        messages: [{ role: 'user', content: 'Test' } as Message],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };
      mockMemory.get.mockResolvedValue(mockConversation);
      (vscode.window as any).createWebviewPanel.mockReturnValue({ webview: { html: '' } });
      
      await commands.viewConversation('123');
      
      expect((vscode.window as any).createWebviewPanel).toHaveBeenCalledWith(
        'sekhaConversation',
        'Conversation',
        expect.anything(),
        expect.anything()
      );
    });

    it('should handle get conversation error in viewConversation', async () => {
      const vscode = await import('vscode');
      mockMemory.get.mockRejectedValue(new Error('Not found'));
      
      await commands.viewConversation('123');
      
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Failed to load conversation: Not found'
      );
    });
  });

  describe('openSettings', () => {
    it('should open settings', async () => {
      await commands.openSettings();
      
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'workbench.action.openSettings',
        'sekha'
      );
    });

    it('should open settings successfully', async () => {
      const vscode = await import('vscode');
      (vscode.commands as any).executeCommand.mockResolvedValue(undefined);
      
      await commands.openSettings();
      
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'workbench.action.openSettings',
        'sekha'
      );
    });
  });

  describe('searchAndInsert', () => {
    it('should search and insert context', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).showInputBox.mockResolvedValue('test query');
      const mockResults: SearchResult[] = [
        { 
          id: '123', 
          label: 'Test', 
          score: 0.95, 
          conversationId: '123',
          content: 'Test content',
          similarity: 0.95,
          status: 'active',
          importanceScore: 0.5,
          createdAt: new Date().toISOString()
        } as SearchResult,
      ];
      mockMemory.query.mockResolvedValue(mockResults);
      (vscode.window as any).showQuickPick.mockResolvedValue({ 
        label: 'Test', 
        conversationId: '123' 
      });

      const mockConversation: Conversation = {
        id: '123',
        label: 'Test',
        messages: [{ role: 'user', content: 'Hello' } as Message],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };
      mockMemory.get.mockResolvedValue(mockConversation);

      const mockEditor = {
        edit: vi.fn().mockResolvedValue(true),
        selection: { active: { line: 0, character: 0 } }
      };
      (vscode.window as any).activeTextEditor = mockEditor;

      await commands.searchAndInsert();

      expect(mockMemory.get).toHaveBeenCalledWith('123');
      expect(mockEditor.edit).toHaveBeenCalled();
    });

    it('should handle quick pick cancellation in searchAndInsert', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).showInputBox.mockResolvedValue('test');
      const mockResults: SearchResult[] = [{ id: '123', label: 'Test', score: 0.95 } as SearchResult];
      mockMemory.query.mockResolvedValue(mockResults);
      (vscode.window as any).showQuickPick.mockResolvedValue(undefined);
      
      await commands.searchAndInsert();
      
      expect(mockMemory.get).not.toHaveBeenCalled();
    });

    it('should handle editor edit failure in insertContext', async () => {
      const vscode = await import('vscode');
      (vscode.window as any).showInputBox.mockResolvedValue('test');
      mockMemory.assembleContext.mockResolvedValue({
        formattedContext: 'Test context',
        sources: []
      });
      
      const mockEditor = {
        edit: vi.fn(() => Promise.resolve(false)), // Edit failed
        selection: { active: { line: 0, character: 0 } }
      };
      (vscode.window as any).activeTextEditor = mockEditor;
      
      await commands.insertContext();
      
      // Should still show success message even if edit fails
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Context inserted from Sekha!');
    });
  });
});