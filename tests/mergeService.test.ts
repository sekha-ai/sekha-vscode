import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MergeService } from '../src/mergeService';
import { SekhaClient } from '@sekha/sdk';
import type { Conversation } from '@sekha/sdk';

describe('MergeService', () => {
  let service: MergeService;
  let mockClient: SekhaClient;

  beforeEach(() => {
    mockClient = {
      controller: {
        create: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
      },
    } as any;
    service = new MergeService(mockClient);
  });

  const createTestConversation = (id: string, time: Date): Conversation => ({
    id,
    label: `Conv ${id}`,
    folder: '/test',
    status: 'active',
    created_at: time,
    updated_at: time,
    messages: [
      {
        role: 'user',
        content: `Message from ${id}`,
        timestamp: time,
      },
    ],
    tags: [`tag-${id}`],
  }) as Conversation;

  describe('Validation', () => {
    it('should throw error if less than 2 conversations', async () => {
      await expect(
        service.merge(['conv-1'], {})
      ).rejects.toThrow('At least 2 conversations required');
    });

    it('should throw error if no conversations', async () => {
      await expect(
        service.merge([], {})
      ).rejects.toThrow('At least 2 conversations required');
    });
  });

  describe('Chronological Merge', () => {
    it('should merge messages chronologically', async () => {
      const conv1 = createTestConversation('1', new Date('2026-01-01T10:00:00Z'));
      const conv2 = createTestConversation('2', new Date('2026-01-01T09:00:00Z'));
      const conv3 = createTestConversation('3', new Date('2026-01-01T11:00:00Z'));

      vi.mocked(mockClient.controller.get)
        .mockResolvedValueOnce(conv1)
        .mockResolvedValueOnce(conv2)
        .mockResolvedValueOnce(conv3);

      vi.mocked(mockClient.controller.create).mockResolvedValue({
        id: 'merged',
        label: 'Merged',
        messages: [],
      } as any);

      const result = await service.merge(['1', '2', '3'], {
        sortBy: 'chronological',
      });

      expect(mockClient.controller.create).toHaveBeenCalled();
      const createCall = vi.mocked(mockClient.controller.create).mock.calls[0][0];
      
      // Messages should be sorted by timestamp
      expect(createCall.messages[0].content).toContain('2'); // 9:00
      expect(createCall.messages[1].content).toContain('1'); // 10:00
      expect(createCall.messages[2].content).toContain('3'); // 11:00
    });
  });

  describe('By Conversation Merge', () => {
    it('should merge by conversation with separators', async () => {
      const conv1 = createTestConversation('1', new Date('2026-01-01T10:00:00Z'));
      const conv2 = createTestConversation('2', new Date('2026-01-01T09:00:00Z'));

      vi.mocked(mockClient.controller.get)
        .mockResolvedValueOnce(conv1)
        .mockResolvedValueOnce(conv2);

      vi.mocked(mockClient.controller.create).mockResolvedValue({
        id: 'merged',
        messages: [],
      } as any);

      await service.merge(['1', '2'], {
        sortBy: 'conversation',
      });

      const createCall = vi.mocked(mockClient.controller.create).mock.calls[0][0];
      
      // Should have separator between conversations
      const hasSystemMessages = createCall.messages.some(
        (m: any) => m.role === 'system' && m.content.includes('=====')
      );
      expect(hasSystemMessages).toBe(true);
    });
  });

  describe('Tag Combination', () => {
    it('should combine unique tags', async () => {
      const conv1 = { ...createTestConversation('1', new Date()), tags: ['python', 'api'] };
      const conv2 = { ...createTestConversation('2', new Date()), tags: ['api', 'rest'] };

      vi.mocked(mockClient.controller.get)
        .mockResolvedValueOnce(conv1)
        .mockResolvedValueOnce(conv2);

      vi.mocked(mockClient.controller.create).mockResolvedValue({ id: 'merged' } as any);

      await service.merge(['1', '2'], {});

      const createCall = vi.mocked(mockClient.controller.create).mock.calls[0][0];
      
      expect(createCall.tags).toEqual(['python', 'api', 'rest']);
    });

    it('should handle conversations without tags', async () => {
      const conv1 = { ...createTestConversation('1', new Date()), tags: undefined };
      const conv2 = { ...createTestConversation('2', new Date()), tags: ['test'] };

      vi.mocked(mockClient.controller.get)
        .mockResolvedValueOnce(conv1)
        .mockResolvedValueOnce(conv2);

      vi.mocked(mockClient.controller.create).mockResolvedValue({ id: 'merged' } as any);

      await service.merge(['1', '2'], {});

      const createCall = vi.mocked(mockClient.controller.create).mock.calls[0][0];
      
      expect(createCall.tags).toEqual(['test']);
    });
  });

  describe('Label Generation', () => {
    it('should use custom label if provided', async () => {
      const conv1 = createTestConversation('1', new Date());
      const conv2 = createTestConversation('2', new Date());

      vi.mocked(mockClient.controller.get)
        .mockResolvedValueOnce(conv1)
        .mockResolvedValueOnce(conv2);

      vi.mocked(mockClient.controller.create).mockResolvedValue({ id: 'merged' } as any);

      await service.merge(['1', '2'], {
        label: 'Custom Merged Label',
      });

      const createCall = vi.mocked(mockClient.controller.create).mock.calls[0][0];
      
      expect(createCall.label).toBe('Custom Merged Label');
    });

    it('should auto-generate label if not provided', async () => {
      const conv1 = createTestConversation('1', new Date());
      const conv2 = createTestConversation('2', new Date());

      vi.mocked(mockClient.controller.get)
        .mockResolvedValueOnce(conv1)
        .mockResolvedValueOnce(conv2);

      vi.mocked(mockClient.controller.create).mockResolvedValue({ id: 'merged' } as any);

      await service.merge(['1', '2'], {});

      const createCall = vi.mocked(mockClient.controller.create).mock.calls[0][0];
      
      expect(createCall.label).toContain('Merged');
    });
  });

  describe('Delete Originals', () => {
    it('should delete originals when requested', async () => {
      const conv1 = createTestConversation('1', new Date());
      const conv2 = createTestConversation('2', new Date());

      vi.mocked(mockClient.controller.get)
        .mockResolvedValueOnce(conv1)
        .mockResolvedValueOnce(conv2);

      vi.mocked(mockClient.controller.create).mockResolvedValue({ id: 'merged' } as any);

      await service.merge(['1', '2'], {
        deleteOriginals: true,
      });

      expect(mockClient.controller.delete).toHaveBeenCalledWith('1');
      expect(mockClient.controller.delete).toHaveBeenCalledWith('2');
    });

    it('should not delete originals by default', async () => {
      const conv1 = createTestConversation('1', new Date());
      const conv2 = createTestConversation('2', new Date());

      vi.mocked(mockClient.controller.get)
        .mockResolvedValueOnce(conv1)
        .mockResolvedValueOnce(conv2);

      vi.mocked(mockClient.controller.create).mockResolvedValue({ id: 'merged' } as any);

      await service.merge(['1', '2'], {});

      expect(mockClient.controller.delete).not.toHaveBeenCalled();
    });
  });
});
