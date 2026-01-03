import { describe, it, expect, beforeEach } from 'vitest';
import { WebviewProvider } from '../src/webview';
import { Conversation } from '@sekha/sdk';
import * as vscode from 'vscode';
import { vi } from 'vitest';
import { Message } from '@sekha/sdk';

// Mock vscode module
vi.mock('vscode', () => ({
  Uri: {
    file: (path: string) => ({ fsPath: path } as vscode.Uri)
  }
}));

describe('WebviewProvider', () => {
  let provider: WebviewProvider;
  let mockExtensionUri: vscode.Uri;

  beforeEach(() => {
    mockExtensionUri = { fsPath: '/test' } as vscode.Uri;
    provider = new WebviewProvider(mockExtensionUri);
  });

  describe('getConversationHtml', () => {
    it('should generate valid HTML for conversation', () => {
      const mockConversation: Conversation = {
        id: '123',
        label: 'Test Conversation',
        messages: [
          { role: 'user', content: 'Hello' } as Message,
          { role: 'assistant', content: 'Hi there!' } as Message
        ],
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        folder: '/test'
      };

      const html = provider.getConversationHtml(mockConversation);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Conversation');
      expect(html).toContain('ID: 123');
      expect(html).toContain('Hello');
      expect(html).toContain('Hi there!');
      expect(html).toContain('user');
      expect(html).toContain('assistant');
    });

    it('should handle empty conversation', () => {
      const mockConversation: Conversation = {
        id: '123',
        label: '',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const html = provider.getConversationHtml(mockConversation);

      expect(html).toContain('Untitled');
      expect(html).toContain('ID: 123');
    });

    it('should escape HTML in conversation content', () => {
      const mockConversation: Conversation = {
        id: '123',
        label: 'Test <script>alert("xss")</script>',
        messages: [
          { role: 'user', content: 'Hello <b>world</b>' } as Message,
          { role: 'assistant', content: 'Click <a href="#">here</a>' } as Message
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const html = provider.getConversationHtml(mockConversation);

      expect(html).toContain('Test &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(html).toContain('Hello &lt;b&gt;world&lt;/b&gt;');
      expect(html).toContain('Click &lt;a href=&quot;#&quot;&gt;here&lt;/a&gt;');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<b>world</b>');
    });

    it('should handle long messages', () => {
      const longContent = 'A'.repeat(1000);
      const mockConversation: Conversation = {
        id: '123',
        label: 'Test',
        messages: [{ role: 'user', content: longContent } as Message],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const html = provider.getConversationHtml(mockConversation);

      expect(html).toContain(longContent);
    });

    it('should use correct CSS classes for roles', () => {
      const mockConversation: Conversation = {
        id: '123',
        label: 'Test',
        messages: [
          { role: 'user', content: 'Hello' } as Message,
          { role: 'assistant', content: 'Hi' } as Message
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const html = provider.getConversationHtml(mockConversation);

      expect(html).toContain('<div class="message user">');
      expect(html).toContain('<div class="message assistant">');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const mockConversation: Conversation = {
        id: '123',
        label: 'Test',
        messages: [],
        createdAt: date.toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const html = provider.getConversationHtml(mockConversation);

      expect(html).toContain(date.toLocaleString());
    });

    it('should handle missing folder', () => {
      const mockConversation: Conversation = {
        id: '123',
        label: 'Test',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const html = provider.getConversationHtml(mockConversation);

      expect(html).toContain('Folder: N/A');
    });

    it('should handle empty messages gracefully', () => {
      const mockConversation: Conversation = {
        id: '1',
        label: 'Test',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const html = provider.getConversationHtml(mockConversation);
      
      expect(html).toContain('Test');
      expect(html).toContain('ID: 1');
    });

    it('should preserve whitespace in messages', () => {
      const mockConversation: Conversation = {
        id: '123',
        label: 'Test',
        messages: [{ role: 'user', content: 'Line 1\n\nLine 2\nLine 3' } as Message],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const html = provider.getConversationHtml(mockConversation);

      expect(html).toContain('Line 1\n\nLine 2\nLine 3');
      expect(html).toContain('white-space: pre-wrap');
    });

    it('should handle single quotes in content', () => {
      const mockConversation: Conversation = {
        id: '123',
        label: "Test's Title",
        messages: [{ role: 'user', content: "It's working" } as Message],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const html = provider.getConversationHtml(mockConversation);

      expect(html).toContain('Test&#039;s Title');
      expect(html).toContain('It&#039;s working');
    });
  });
});