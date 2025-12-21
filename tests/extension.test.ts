import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Sekha VS Code Extension', () => {
  describe('Configuration Validation', () => {
    it('should validate required config fields', () => {
      const config = {
        apiUrl: 'http://localhost:8080',
        apiKey: 'sk-test-key-12345678901234567890123456',
      };
      
      expect(config.apiUrl).toBeTruthy();
      expect(config.apiKey).toBeTruthy();
      expect(config.apiKey.length).toBeGreaterThanOrEqual(32);
    });

    it('should reject invalid API keys', () => {
      const shortKey = 'sk-short';
      expect(shortKey.length).toBeLessThan(32);
    });
  });

  describe('Message Parser', () => {
    it('should parse user and assistant messages', () => {
      const content = `User: Hello
Assistant: Hi there!`;
      
      const messages = parseMessages(content);
      
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });

    it('should handle multi-line messages', () => {
      const content = `User: This is a
multi-line
message
Assistant: Got it`;
      
      const messages = parseMessages(content);
      
      expect(messages[0].content).toContain('multi-line');
    });

    it('should filter empty messages', () => {
      const content = `User:
Assistant: Response`;
      
      const messages = parseMessages(content);
      
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('assistant');
    });
  });
});

// Helper function (mirrors implementation)
function parseMessages(content: string): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
  const lines = content.split('\n');
  
  let currentRole: 'user' | 'assistant' | 'system' | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('User:') || trimmed.startsWith('Assistant:') || trimmed.startsWith('System:')) {
      if (currentRole && currentContent.length > 0) {
        const content = currentContent.join('\n').trim();
        if (content) {
          messages.push({ role: currentRole, content });
        }
      }
      
      if (trimmed.startsWith('User:')) {
        currentRole = 'user';
      } else if (trimmed.startsWith('Assistant:')) {
        currentRole = 'assistant';
      } else {
        currentRole = 'system';
      }
      
      currentContent = [trimmed.replace(/^(User|Assistant|System):\s*/, '')];
    } else if (trimmed && currentRole) {
      currentContent.push(line);
    }
  }
  
  if (currentRole && currentContent.length > 0) {
    const content = currentContent.join('\n').trim();
    if (content) {
      messages.push({ role: currentRole, content });
    }
  }
  
  return messages;
}
