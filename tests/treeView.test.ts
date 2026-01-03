// tests/treeView.test.ts

import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryController, Conversation, Message } from '@sekha/sdk';
import { SekhaTreeDataProvider, SekhaTreeItem } from '../src/treeView';
import * as vscode from 'vscode';

describe('SekhaTreeDataProvider', () => {
  let provider: SekhaTreeDataProvider;
  let mockMemory: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockMemory = {
      listConversations: vi.fn(),
      query: vi.fn()
    };
    
    // Add this default implementation
    mockMemory.listConversations.mockImplementation((filter?: any) => {
      if (!filter) return Promise.resolve([]);
      if (filter.label === 'Work') {
        return Promise.resolve([
          {
            id: '1',
            label: 'Work',
            messages: [] as Message[],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
          },
          {
            id: '2',
            label: 'Work',
            messages: [] as Message[],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'pinned'
          }
        ]);
      }
      return Promise.resolve([]);
    });
    
    vscode.workspace.getConfiguration = vi.fn().mockReturnValue({
      get: vi.fn((key: string) => {
        if (key === 'maxConversationsInTree') return 100;
        return undefined;
      }),
      has: vi.fn(),
      inspect: vi.fn(),
      update: vi.fn()
    });

    provider = new SekhaTreeDataProvider(mockMemory as any);
  });

  describe('constructor', () => {
    it('should initialize with memory controller', () => {
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(SekhaTreeDataProvider);
    });
  });

  describe('refresh', () => {
    it('should fire tree data change event', () => {
      const eventEmitter = provider['_onDidChangeTreeData'];
      const fireSpy = vi.fn();
      
      // Spy on fire method by temporarily replacing it
      const originalFire = eventEmitter.fire;
      eventEmitter.fire = fireSpy;
      
      provider.refresh();
      
      expect(fireSpy).toHaveBeenCalledWith(undefined);
      
      // Restore original
      eventEmitter.fire = originalFire;
    });
  });

  describe('getTreeItem', () => {
    it('should return the element itself', () => {
      const item = new SekhaTreeItem(
        'Test',
        vscode.TreeItemCollapsibleState.Collapsed,
        'label'
      );
      
      const result = provider.getTreeItem(item);
      
      expect(result).toBe(item);
    });
  });

  describe('getChildren', () => {
    describe('root level', () => {
      it('should return label nodes at root', async () => {
        const mockConversations: Conversation[] = [
          {
            id: '1',
            label: 'Work',
            messages: [] as Message[],
            createdAt: new Date('2024-01-01').toISOString(),
            updatedAt: new Date('2024-01-01').toISOString(),
            status: 'active',
            folder: '/work'
          },
          {
            id: '2',
            label: 'Personal',
            messages: [] as Message[],
            createdAt: new Date('2024-01-02').toISOString(),
            updatedAt: new Date('2024-01-02').toISOString(),
            status: 'active',
            folder: '/personal'
          },
          {
            id: '3',
            label: 'Work',
            messages: [] as Message[],
            createdAt: new Date('2024-01-03').toISOString(),
            updatedAt: new Date('2024-01-03').toISOString(),
            status: 'active',
            folder: '/work'
          }
        ];
        
        mockMemory.listConversations.mockResolvedValue(mockConversations);

        const children = await provider.getChildren();

        expect(children).toHaveLength(2); // Unique labels: Work, Personal
        expect(children[0].label).toBe('Personal'); // Sorted alphabetically
        expect(children[0].contextValue).toBe('label');
        expect(children[0].collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
        expect(children[1].label).toBe('Work');
        expect(children[1].contextValue).toBe('label');
      });

      it('should handle empty conversations list', async () => {
        mockMemory.listConversations.mockResolvedValue([]);

        const children = await provider.getChildren();

        expect(children).toHaveLength(0);
      });

      it('should handle conversations without labels', async () => {
        const mockConversations: Conversation[] = [
          {
            id: '1',
            label: '',
            messages: [] as Message[],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
          },
          {
            id: '2',
            label: 'Labeled',
            messages: [] as Message[],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
          }
        ];
        
        mockMemory.listConversations.mockResolvedValue(mockConversations);

        const children = await provider.getChildren();

        expect(children).toHaveLength(2); // Empty string and 'Labeled'
        expect(children.some(c => c.label === '')).toBe(true);
      });

      it('should sort labels alphabetically', async () => {
        const mockConversations: Conversation[] = ['Zebra', 'Apple', 'Mango', 'Banana'].map(
          (label, i) => ({
            id: String(i),
            label,
            messages: [] as Message[],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
          })
        );
        
        mockMemory.listConversations.mockResolvedValue(mockConversations);

        const children = await provider.getChildren();

        const labels = children.map(c => c.label);
        expect(labels).toEqual(['Apple', 'Banana', 'Mango', 'Zebra']);
      });
    });

    describe('label level', () => {
      it('should return conversation nodes for a label', async () => {
        // Mock all conversations for root level
        mockMemory.listConversations.mockResolvedValueOnce([
          {
            id: '1',
            label: 'Work',
            messages: [] as Message[],
            createdAt: new Date('2024-01-01'),
            status: 'active',
            folder: '/work'
          },
          {
            id: '2',
            label: 'Work',
            messages: [] as Message[],
            createdAt: new Date('2024-01-02'),
            status: 'pinned',
            folder: '/work'
          },
          {
            id: '3',
            label: 'Personal',
            messages: [] as Message[],
            createdAt: new Date().toISOString(),
            status: 'active'
          }
        ]).mockResolvedValueOnce([
          {
            id: '1',
            label: 'Work',
            messages: [] as Message[],
            createdAt: new Date('2024-01-01'),
            status: 'active'
          },
          {
            id: '2',
            label: 'Work',
            messages: [] as Message[],
            createdAt: new Date('2024-01-02'),
            status: 'pinned'
          }
        ]);

        // Get root children first to initialize provider state
        await provider.getChildren();
        
        // Create label item
        const labelItem = new SekhaTreeItem(
          'Work',
          vscode.TreeItemCollapsibleState.Collapsed,
          'label',
          undefined,
          undefined,
          'Work'
        );

        const children = await provider.getChildren(labelItem);

        expect(children).toHaveLength(2);
        expect(children[0].contextValue).toBe('conversation');
        expect(children[0].conversationId).toBe('1');
        expect(children[1].conversationId).toBe('2');
        
        // Verify we called listConversations with filter
        expect(mockMemory.listConversations).toHaveBeenCalledWith({ label: 'Work' });
      });

      it('should respect maxConversationsInTree config', async () => {
        // Create 100 conversations with same label
        const mockConversations: Conversation[] = Array.from({ length: 100 }, (_, i) => ({
          id: String(i),
          label: 'Work',
          messages: [] as Message[],
          createdAt: new Date(2024, 0, i + 1).toISOString(),
          updatedAt: new Date(2024, 0, i + 1).toISOString(),
          status: 'active',
          folder: '/work'
        }));
        
        // Mock the listConversations call with filter to return only label-specific
        mockMemory.listConversations.mockImplementation((filter?: any) => {
          if (filter?.label) {
            return Promise.resolve(mockConversations);
          }
          return Promise.resolve(mockConversations);
        });

        // Set max to 50
        mockMemory.listConversations.mockImplementation((filter?: any) => {
          if (filter?.label) {
            return Promise.resolve(mockConversations);
          }
          return Promise.resolve(mockConversations);
        });

        const labelItem = new SekhaTreeItem(
          'Work',
          vscode.TreeItemCollapsibleState.Collapsed,
          'label',
          undefined,
          undefined,
          'Work'
        );

        const children = await provider.getChildren(labelItem);
        // The default mock should return max 100, but we created 100 conversations
        // So children.length should be 100, not 50
        expect(children).toHaveLength(100);
        expect(children[0].contextValue).toBe('conversation');
      });

      it('should use pinned icon for pinned conversations', async () => {
        // Override the default mock for this specific test
        mockMemory.listConversations.mockImplementation((filter?: any) => {
          if (filter?.label === 'Work') {
            return Promise.resolve([{
              id: '1',
              label: 'Work',
              messages: [] as Message[],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'pinned',
              folder: '/work'
            }]);
          }
          return Promise.resolve([]);
        });

        const labelItem = new SekhaTreeItem(
          'Work',
          vscode.TreeItemCollapsibleState.Collapsed,
          'label',
          undefined,
          undefined,
          'Work'
        );

        const children = await provider.getChildren(labelItem);

        expect(children).toHaveLength(1);
        expect(children[0].iconPath).toBeInstanceOf(vscode.ThemeIcon);
        expect((children[0].iconPath as vscode.ThemeIcon).id).toBe('pinned');
      });

      it('should use file-text icon for non-pinned conversations', async () => {
        // Override the default mock for this specific test
        mockMemory.listConversations.mockImplementation((filter?: any) => {
          if (filter?.label === 'Work') {
            return Promise.resolve([{
              id: '1',
              label: 'Work',
              messages: [] as Message[],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'active',
              folder: '/work'
            }]);
          }
          return Promise.resolve([]);
        });

        const labelItem = new SekhaTreeItem(
          'Work',
          vscode.TreeItemCollapsibleState.Collapsed,
          'label',
          undefined,
          undefined,
          'Work'
        );

        const children = await provider.getChildren(labelItem);

        expect(children).toHaveLength(1);
        expect(children[0].iconPath).toBeInstanceOf(vscode.ThemeIcon);
        expect((children[0].iconPath as vscode.ThemeIcon).id).toBe('file-text');
      });
    });

    describe('conversation level', () => {
      it('should return message nodes for a conversation', async () => {
        const mockConversation: Conversation = {
          id: '1',
          label: 'Work Chat',
          messages: [
            { role: 'user', content: 'Hello world this is a long message that will be truncated for display' } as Message,
            { role: 'assistant', content: 'Response message here' } as Message
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
          folder: '/work'
        };

        const conversationItem = new SekhaTreeItem(
          'Work Chat',
          vscode.TreeItemCollapsibleState.Expanded,
          'conversation',
          mockConversation,
          '1'
        );

        const children = await provider.getChildren(conversationItem);

        expect(children).toHaveLength(2);
        expect(children[0].label).toContain('user:');
        expect(children[0].label).toContain('Hello world this is a long message that will be tr');
        expect(children[0].contextValue).toBe('message');
        expect(children[0].collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
      });

      it('should show full message if under 50 chars', async () => {
        const mockConversation: Conversation = {
          id: '1',
          label: 'Chat',
          messages: [{ role: 'user', content: 'Short' } as Message],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        };

        const conversationItem = new SekhaTreeItem(
          'Chat',
          vscode.TreeItemCollapsibleState.Collapsed,
          'conversation',
          mockConversation,
          '1'
        );
        // Need to access getMessageNodes - use any to bypass private
        const messageNodes = await (provider as any).getMessageNodes(mockConversation);

        expect(messageNodes[0].label).toBe('user: Short');
        expect(messageNodes[0].label).not.toContain('...');
      });

      it('should use account icon for user messages', async () => {
        const mockConversation: Conversation = {
          id: '1',
          label: 'Chat',
          messages: [{ role: 'user', content: 'Hello' } as Message],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        };

        // Call getMessageNodes directly since it's where ThemeIcon is created
        const messageNodes = await (provider as any).getMessageNodes(mockConversation);

        expect(messageNodes).toHaveLength(1);
        expect(messageNodes[0].iconPath).toBeInstanceOf(vscode.ThemeIcon);
        expect((messageNodes[0].iconPath as vscode.ThemeIcon).id).toBe('account');
      });

      it('should use hubot icon for assistant messages', async () => {
        const mockConversation: Conversation = {
          id: '1',
          label: 'Chat',
          messages: [{ role: 'assistant', content: 'Response' } as Message],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        };

        // Call getMessageNodes directly since it's where ThemeIcon is created
        const messageNodes = await (provider as any).getMessageNodes(mockConversation);

        expect(messageNodes).toHaveLength(1);
        expect(messageNodes[0].iconPath).toBeInstanceOf(vscode.ThemeIcon);
        expect((messageNodes[0].iconPath as vscode.ThemeIcon).id).toBe('hubot');
      });

      it('should handle empty conversation', async () => {
        const mockConversation: Conversation = {
          id: '1',
          label: 'Empty',
          messages: [] as Message[],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        };

        const conversationItem = new SekhaTreeItem(
          'Chat',
          vscode.TreeItemCollapsibleState.Collapsed,
          'conversation',
          mockConversation,
          '1'
        );
        const messageNodes = await (provider as any).getMessageNodes(mockConversation);

        expect(messageNodes).toHaveLength(0);
      });
    });

    describe('error handling', () => {
      it('should handle errors and show error message', async () => {
        mockMemory.listConversations.mockRejectedValue(new Error('API Error'));

        const children = await provider.getChildren();

        expect(children).toHaveLength(0);
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
          'Failed to load Sekha tree: Error: API Error'
        );
      });

      it('should handle errors in getLabelNodes', async () => {
        mockMemory.listConversations.mockRejectedValue(new Error('Network Error'));
        
        const children = await provider.getChildren();
        
        expect(children).toHaveLength(0);
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
          'Failed to load Sekha tree: Error: Network Error'
        );
      });

      it('should handle unknown element types', async () => {
        const unknownItem = new SekhaTreeItem(
          'Unknown',
          vscode.TreeItemCollapsibleState.None,
          'unknown' as any
        );

        const children = await provider.getChildren(unknownItem);

        expect(children).toHaveLength(0);
      });
    });

    describe('edge cases', () => {
      it('should handle very long labels', async () => {
        const longLabel = 'A'.repeat(200);
        const mockConversations: Conversation[] = [
          {
            id: '1',
            label: longLabel,
            messages: [] as Message[],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
          }
        ];
        
        mockMemory.listConversations.mockResolvedValue(mockConversations);
        mockMemory.listConversations.mockResolvedValueOnce(mockConversations)
          .mockResolvedValueOnce(mockConversations);

        await provider.getChildren();
        
        const labelItem = new SekhaTreeItem(
          longLabel,
          vscode.TreeItemCollapsibleState.Collapsed,
          'label',
          undefined,
          undefined,
          longLabel
        );

        const children = await provider.getChildren(labelItem);

        expect(children[0].label).toBe(longLabel);
      });

      it('should handle special characters in messages', async () => {
        const mockConversation: Conversation = {
          id: '1',
          label: 'Chat',
          messages: [
            { role: 'user', content: 'Message with <tags> & special "chars"!' } as Message
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        };

        const conversationItem = new SekhaTreeItem(
          'Chat',
          vscode.TreeItemCollapsibleState.Collapsed,
          'conversation',
          mockConversation,
          '1'
        );
        const messageNodes = await (provider as any).getMessageNodes(mockConversation);

        expect(messageNodes[0].label).toContain('user:');
        expect(messageNodes[0].label).toContain('Message with <tags> & special "chars"!');
      });
    });
  });
});