import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SekhaTreeDataProvider, SekhaTreeItem } from '../src/treeView';
import * as vscode from 'vscode';
import type { SekhaClient, Conversation, ListConversationsResponse } from '@sekha/sdk';

// Mock vscode
vi.mock('vscode', () => ({
  EventEmitter: vi.fn().mockImplementation(() => ({
    event: vi.fn(),
    fire: vi.fn(),
  })),
  window: {
    showErrorMessage: vi.fn(),
  },
  workspace: {
    getConfiguration: vi.fn(),
  },
  TreeItem: vi.fn(),
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  ThemeIcon: vi.fn().mockImplementation((id) => ({ id })),
}));

describe('SekhaTreeDataProvider', () => {
  let mockSekha: SekhaClient;
  let provider: SekhaTreeDataProvider;
  let mockConfig: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSekha = {
      controller: {
        list: vi.fn(),
      },
    } as any;

    mockConfig = {
      get: vi.fn((key: string, defaultValue: any) => {
        if (key === 'maxConversationsInTree') return 100;
        return defaultValue;
      }),
    };

    (vscode.workspace as any).getConfiguration.mockReturnValue(mockConfig);

    provider = new SekhaTreeDataProvider(mockSekha);
  });

  describe('refresh', () => {
    it('should fire tree data change event', () => {
      const fireSpy = vi.spyOn(provider['_onDidChangeTreeData'], 'fire');
      provider.refresh();
      expect(fireSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getChildren', () => {
    it('should return label nodes at root', async () => {
      const mockResponse: ListConversationsResponse = {
        conversations: [
          {
            id: 'conv-1',
            label: 'Label A',
            messages: [],
            created_at: new Date().toISOString(),
          } as Conversation,
          {
            id: 'conv-2',
            label: 'Label B',
            messages: [],
            created_at: new Date().toISOString(),
          } as Conversation,
        ],
        total: 2,
      };

      mockSekha.controller.list.mockResolvedValue(mockResponse);

      const children = await provider.getChildren();

      expect(children.length).toBe(2);
      expect(children[0].label).toBe('Label A');
      expect(children[0].contextValue).toBe('label');
    });

    it('should return conversation nodes for a label', async () => {
      const mockResponse: ListConversationsResponse = {
        conversations: [
          {
            id: 'conv-1',
            label: 'Test Label',
            status: 'pinned',
            messages: [{ role: 'user', content: 'test' }],
            created_at: new Date().toISOString(),
          } as Conversation,
        ],
        total: 1,
      };

      mockSekha.controller.list.mockResolvedValue(mockResponse);

      const labelItem = new SekhaTreeItem(
        'Test Label',
        vscode.TreeItemCollapsibleState.Collapsed,
        'label',
        undefined,
        undefined,
        'Test Label'
      );

      const children = await provider.getChildren(labelItem);

      expect(mockSekha.controller.list).toHaveBeenCalledWith({
        limit: 100,
        filter: { label: 'Test Label' },
      });
      expect(children.length).toBe(1);
      expect(children[0].contextValue).toBe('conversation');
    });

    it('should return message nodes for a conversation', async () => {
      const conversation: Conversation = {
        id: 'conv-1',
        label: 'Test',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        created_at: new Date().toISOString(),
      } as Conversation;

      const convItem = new SekhaTreeItem(
        'Test',
        vscode.TreeItemCollapsibleState.Collapsed,
        'conversation',
        conversation,
        'conv-1'
      );

      const children = await provider.getChildren(convItem);

      expect(children.length).toBe(2);
      expect(children[0].label).toContain('user:');
      expect(children[1].label).toContain('assistant:');
    });

    it('should handle errors gracefully', async () => {
      mockSekha.controller.list.mockRejectedValue(new Error('Network error'));

      const children = await provider.getChildren();

      expect(children).toEqual([]);
      expect(vscode.window.showErrorMessage).toHaveBeenCalled();
    });
  });

  describe('SekhaTreeItem', () => {
    it('should create conversation item with command', () => {
      const item = new SekhaTreeItem(
        'Test',
        vscode.TreeItemCollapsibleState.None,
        'conversation',
        undefined,
        'conv-123'
      );

      expect(item.command).toBeDefined();
      expect(item.command?.command).toBe('sekha.viewConversation');
      expect(item.command?.arguments).toEqual(['conv-123']);
    });

    it('should create label item without command', () => {
      const item = new SekhaTreeItem(
        'Label',
        vscode.TreeItemCollapsibleState.Collapsed,
        'label'
      );

      expect(item.command).toBeUndefined();
    });
  });
});
