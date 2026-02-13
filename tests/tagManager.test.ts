import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagManager } from '../src/tagManager';
import { SekhaClient } from '@sekha/sdk';

describe('TagManager', () => {
  let manager: TagManager;
  let mockClient: SekhaClient;

  beforeEach(() => {
    mockClient = {
      controller: {
        get: vi.fn(),
        update: vi.fn(),
        list: vi.fn(),
      },
      bridge: {
        complete: vi.fn(),
      },
    } as any;
    manager = new TagManager(mockClient);
  });

  describe('Add Tags', () => {
    it('should add tags to conversation', async () => {
      vi.mocked(mockClient.controller.get).mockResolvedValue({
        id: 'conv-1',
        tags: ['existing'],
      } as any);

      await manager.addTags('conv-1', ['new1', 'new2']);

      expect(mockClient.controller.update).toHaveBeenCalledWith(
        'conv-1',
        expect.objectContaining({
          tags: ['existing', 'new1', 'new2'],
        })
      );
    });

    it('should handle conversation without existing tags', async () => {
      vi.mocked(mockClient.controller.get).mockResolvedValue({
        id: 'conv-1',
        tags: undefined,
      } as any);

      await manager.addTags('conv-1', ['tag1']);

      expect(mockClient.controller.update).toHaveBeenCalledWith(
        'conv-1',
        expect.objectContaining({
          tags: ['tag1'],
        })
      );
    });

    it('should not add duplicate tags', async () => {
      vi.mocked(mockClient.controller.get).mockResolvedValue({
        id: 'conv-1',
        tags: ['existing'],
      } as any);

      await manager.addTags('conv-1', ['existing', 'new']);

      const call = vi.mocked(mockClient.controller.update).mock.calls[0][1];
      expect(call.tags).toEqual(['existing', 'new']);
    });
  });

  describe('Remove Tags', () => {
    it('should remove tags from conversation', async () => {
      vi.mocked(mockClient.controller.get).mockResolvedValue({
        id: 'conv-1',
        tags: ['tag1', 'tag2', 'tag3'],
      } as any);

      await manager.removeTags('conv-1', ['tag2']);

      expect(mockClient.controller.update).toHaveBeenCalledWith(
        'conv-1',
        expect.objectContaining({
          tags: ['tag1', 'tag3'],
        })
      );
    });

    it('should handle removing non-existent tags', async () => {
      vi.mocked(mockClient.controller.get).mockResolvedValue({
        id: 'conv-1',
        tags: ['tag1'],
      } as any);

      await manager.removeTags('conv-1', ['tag2']);

      const call = vi.mocked(mockClient.controller.update).mock.calls[0][1];
      expect(call.tags).toEqual(['tag1']);
    });
  });

  describe('Get Tags', () => {
    it('should get tags from conversation', async () => {
      vi.mocked(mockClient.controller.get).mockResolvedValue({
        id: 'conv-1',
        tags: ['python', 'api', 'rest'],
      } as any);

      const tags = await manager.getTags('conv-1');

      expect(tags).toEqual(['python', 'api', 'rest']);
    });

    it('should return empty array if no tags', async () => {
      vi.mocked(mockClient.controller.get).mockResolvedValue({
        id: 'conv-1',
        tags: undefined,
      } as any);

      const tags = await manager.getTags('conv-1');

      expect(tags).toEqual([]);
    });
  });

  describe('Get All Tags', () => {
    it('should aggregate tags from all conversations', async () => {
      vi.mocked(mockClient.controller.list).mockResolvedValue({
        conversations: [
          { id: '1', tags: ['python', 'api'] },
          { id: '2', tags: ['python', 'web'] },
          { id: '3', tags: ['api', 'rest'] },
        ],
        total: 3,
      } as any);

      const stats = await manager.getAllTags();

      expect(stats).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tag: 'python', count: 2 }),
          expect.objectContaining({ tag: 'api', count: 2 }),
          expect.objectContaining({ tag: 'web', count: 1 }),
          expect.objectContaining({ tag: 'rest', count: 1 }),
        ])
      );
    });

    it('should sort tags by count descending', async () => {
      vi.mocked(mockClient.controller.list).mockResolvedValue({
        conversations: [
          { id: '1', tags: ['python', 'web'] },
          { id: '2', tags: ['python'] },
          { id: '3', tags: ['python'] },
        ],
        total: 3,
      } as any);

      const stats = await manager.getAllTags();

      expect(stats[0].tag).toBe('python');
      expect(stats[0].count).toBe(3);
      expect(stats[1].count).toBe(1);
    });
  });

  describe('Suggest Tags (AI)', () => {
    it('should suggest tags using AI', async () => {
      vi.mocked(mockClient.controller.get).mockResolvedValue({
        id: 'conv-1',
        messages: [
          { role: 'user', content: 'How do I use Python pandas for data analysis?' },
          { role: 'assistant', content: 'Pandas is great for data manipulation...' },
        ],
      } as any);

      vi.mocked(mockClient.bridge.complete).mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'python, pandas, data-analysis, data-manipulation, tutorial',
            },
          },
        ],
      } as any);

      const suggestions = await manager.suggestTags('conv-1');

      expect(suggestions).toEqual(
        expect.arrayContaining(['python', 'pandas', 'data-analysis'])
      );
    });

    it('should handle AI errors gracefully', async () => {
      vi.mocked(mockClient.controller.get).mockResolvedValue({
        id: 'conv-1',
        messages: [],
      } as any);

      vi.mocked(mockClient.bridge.complete).mockRejectedValue(
        new Error('Bridge unavailable')
      );

      await expect(manager.suggestTags('conv-1')).rejects.toThrow();
    });
  });

  describe('Filter by Tags', () => {
    it('should filter conversations by tags', async () => {
      vi.mocked(mockClient.controller.list).mockResolvedValue({
        conversations: [
          { id: '1', tags: ['python', 'api'] },
          { id: '2', tags: ['javascript', 'api'] },
          { id: '3', tags: ['python', 'web'] },
        ],
        total: 3,
      } as any);

      const filtered = await manager.filterByTags(['python']);

      expect(filtered).toEqual(['1', '3']);
    });

    it('should handle AND logic for multiple tags', async () => {
      vi.mocked(mockClient.controller.list).mockResolvedValue({
        conversations: [
          { id: '1', tags: ['python', 'api', 'rest'] },
          { id: '2', tags: ['python', 'web'] },
          { id: '3', tags: ['api', 'rest'] },
        ],
        total: 3,
      } as any);

      const filtered = await manager.filterByTags(['python', 'api']);

      expect(filtered).toEqual(['1']);
    });
  });
});
