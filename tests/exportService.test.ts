import { describe, it, expect, beforeEach } from 'vitest';
import { ExportService } from '../src/exportService';
import type { Conversation } from '@sekha/sdk';

describe('ExportService', () => {
  let service: ExportService;
  let testConversation: Conversation;

  beforeEach(() => {
    service = new ExportService();
    testConversation = {
      id: 'conv-test-123',
      label: 'Test Conversation',
      folder: '/test',
      status: 'active',
      created_at: new Date('2026-01-15T10:00:00Z'),
      updated_at: new Date('2026-01-15T10:30:00Z'),
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test',
          timestamp: new Date('2026-01-15T10:00:15Z'),
        },
        {
          role: 'assistant',
          content: 'Hello! How can I help you?',
          timestamp: new Date('2026-01-15T10:01:00Z'),
        },
      ],
      tags: ['test', 'example'],
    } as Conversation;
  });

  describe('Markdown Export', () => {
    it('should export to markdown with metadata', async () => {
      const result = await service.exportConversation(testConversation, {
        format: 'markdown',
        includeMetadata: true,
      });

      expect(result).toContain('# Test Conversation');
      expect(result).toContain('**Created**:');
      expect(result).toContain('**Folder**: /test');
      expect(result).toContain('**Tags**: test, example');
      expect(result).toContain('## Message 1');
      expect(result).toContain('**Role**: user');
      expect(result).toContain('Hello, this is a test');
    });

    it('should export to markdown without metadata', async () => {
      const result = await service.exportConversation(testConversation, {
        format: 'markdown',
        includeMetadata: false,
      });

      expect(result).toContain('# Test Conversation');
      expect(result).not.toContain('**Created**:');
      expect(result).not.toContain('**Tags**:');
      expect(result).toContain('Hello, this is a test');
    });
  });

  describe('JSON Export', () => {
    it('should export to valid JSON', async () => {
      const result = await service.exportConversation(testConversation, {
        format: 'json',
        includeMetadata: true,
      });

      const parsed = JSON.parse(result);
      expect(parsed.id).toBe('conv-test-123');
      expect(parsed.label).toBe('Test Conversation');
      expect(parsed.messages).toHaveLength(2);
      expect(parsed.tags).toEqual(['test', 'example']);
    });

    it('should export to JSON without metadata', async () => {
      const result = await service.exportConversation(testConversation, {
        format: 'json',
        includeMetadata: false,
      });

      const parsed = JSON.parse(result);
      expect(parsed.messages).toBeDefined();
      expect(parsed.created_at).toBeUndefined();
      expect(parsed.status).toBeUndefined();
    });
  });

  describe('HTML Export', () => {
    it('should export to HTML with styling', async () => {
      const result = await service.exportConversation(testConversation, {
        format: 'html',
        includeMetadata: true,
      });

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<style>');
      expect(result).toContain('<h1>Test Conversation</h1>');
      expect(result).toContain('class="message user"');
      expect(result).toContain('class="message assistant"');
    });

    it('should escape HTML in content', async () => {
      const convWithHtml: Conversation = {
        ...testConversation,
        messages: [
          {
            role: 'user',
            content: '<script>alert("xss")</script>',
            timestamp: new Date(),
          },
        ],
      };

      const result = await service.exportConversation(convWithHtml, {
        format: 'html',
        includeMetadata: true,
      });

      expect(result).not.toContain('<script>alert');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('Text Export', () => {
    it('should export to plain text', async () => {
      const result = await service.exportConversation(testConversation, {
        format: 'text',
        includeMetadata: true,
      });

      expect(result).toContain('Test Conversation');
      expect(result).toContain('Folder: /test');
      expect(result).toContain('user: Hello, this is a test');
      expect(result).toContain('assistant: Hello! How can I help you?');
    });

    it('should export to text without metadata', async () => {
      const result = await service.exportConversation(testConversation, {
        format: 'text',
        includeMetadata: false,
      });

      expect(result).toContain('Test Conversation');
      expect(result).not.toContain('Folder:');
      expect(result).toContain('user: Hello');
    });
  });

  describe('Batch Export', () => {
    it('should batch export multiple conversations', async () => {
      const conversations = [
        testConversation,
        { ...testConversation, id: 'conv-2', label: 'Second Conv' },
      ];

      const results = await service.batchExport(conversations, {
        format: 'markdown',
        includeMetadata: true,
        combineFiles: false,
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toContain('Test Conversation');
      expect(results[1]).toContain('Second Conv');
    });

    it('should combine files when requested', async () => {
      const conversations = [
        testConversation,
        { ...testConversation, id: 'conv-2', label: 'Second Conv' },
      ];

      const results = await service.batchExport(conversations, {
        format: 'markdown',
        includeMetadata: true,
        combineFiles: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toContain('Test Conversation');
      expect(results[0]).toContain('Second Conv');
    });
  });

  describe('File Naming', () => {
    it('should sanitize file names', () => {
      const unsafeLabel = 'Test / Invalid \\ Name : "File" <>';
      const safe = service.sanitizeFileName(unsafeLabel);
      
      expect(safe).not.toContain('/');
      expect(safe).not.toContain('\\');
      expect(safe).not.toContain(':');
      expect(safe).not.toContain('"');
    });

    it('should generate file name with extension', () => {
      const fileName = service.generateFileName(testConversation, 'markdown');
      
      expect(fileName).toContain('Test_Conversation');
      expect(fileName).toEndWith('.md');
    });
  });
});
