import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SekhaClient, SekhaConfig } from '@sekha/sdk';

// Bridge integration tests - only run when environment is configured
const shouldRun = process.env.SEKHA_INTEGRATION_TESTS === '1';

const testConfig: SekhaConfig = {
  controllerURL: process.env.SEKHA_BASE_URL || 'http://localhost:8080',
  bridgeURL: process.env.SEKHA_BRIDGE_URL || 'http://localhost:5001',
  apiKey: process.env.SEKHA_API_KEY || 'test-token-123456789012345678901234567890',
  timeout: 60000, // Bridge operations can take longer
};

const testLabel = `VSCode-Bridge-Test-${Date.now()}`;
const createdConversationIds: string[] = [];

(shouldRun ? describe : describe.skip)('Bridge Integration Tests', () => {
  let client: SekhaClient;

  beforeAll(() => {
    client = new SekhaClient(testConfig);
  });

  afterAll(async () => {
    // Cleanup - delete all test conversations
    for (const id of createdConversationIds) {
      try {
        await client.controller.delete(id);
      } catch (e) {
        console.error(`Cleanup failed for ${id}:`, e);
      }
    }
  });

  it('should generate completion with Bridge', async () => {
    const response = await client.bridge.complete({
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from VS Code integration test" and nothing else.',
        },
      ],
      temperature: 0.1,
      max_tokens: 50,
    });

    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0].message).toBeDefined();
    expect(response.choices[0].message.content).toContain('Hello');
  }, 60000);

  it('should generate completion with memory context', async () => {
    // Create a test conversation with Python context
    const contextConv = await client.controller.create({
      label: `${testLabel}-context`,
      folder: '/test',
      messages: [
        {
          role: 'user',
          content: 'What are the best Python libraries for data science?',
        },
        {
          role: 'assistant',
          content: 'The best Python libraries for data science are pandas, numpy, scikit-learn, and matplotlib.',
        },
      ],
    });
    createdConversationIds.push(contextConv.id);

    // Query to get context
    const queryResults = await client.controller.query({
      query: 'Python data science libraries',
      limit: 1,
    });

    expect(queryResults.results.length).toBeGreaterThan(0);

    // Build context string
    const contextText = queryResults.results
      .map((r) => {
        const conv = r.conversation;
        return conv.messages
          .map((m) => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
          .join('\n');
      })
      .join('\n\n');

    // Generate completion with context
    const response = await client.bridge.complete({
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Use the following context from memory:\n\n${contextText}`,
        },
        {
          role: 'user',
          content: 'What library would you recommend for data manipulation?',
        },
      ],
      temperature: 0.3,
    });

    expect(response.choices).toBeDefined();
    expect(response.choices[0].message.content.toLowerCase()).toContain('pandas');
  }, 60000);

  it('should summarize text briefly', async () => {
    const longText = `
      Machine learning is a subset of artificial intelligence that focuses on 
      building systems that can learn from data. These systems improve their 
      performance over time without being explicitly programmed. Common 
      applications include image recognition, natural language processing, 
      recommendation systems, and autonomous vehicles. The field has grown 
      rapidly with the availability of large datasets and powerful computing 
      resources.
    `;

    const response = await client.bridge.summarize({
      text: longText,
      level: 'brief',
    });

    expect(response.summary).toBeDefined();
    expect(response.summary.length).toBeLessThan(longText.length);
    expect(response.summary.toLowerCase()).toContain('machine learning');
  }, 60000);

  it('should summarize text in detail', async () => {
    const text = 'Python is a versatile programming language used for web development, data science, and automation.';

    const response = await client.bridge.summarize({
      text,
      level: 'detailed',
    });

    expect(response.summary).toBeDefined();
    expect(response.summary.toLowerCase()).toContain('python');
  }, 60000);

  it('should suggest labels for conversation', async () => {
    const messages = [
      {
        role: 'user',
        content: 'How do I implement JWT authentication in Express.js?',
      },
      {
        role: 'assistant',
        content: 'To implement JWT auth in Express, you need to install jsonwebtoken and create middleware for token verification.',
      },
    ];

    const response = await client.controller.suggestLabel({
      messages,
      count: 3,
    });

    expect(response.suggestions).toBeDefined();
    expect(response.suggestions.length).toBeGreaterThan(0);
    expect(response.suggestions.length).toBeLessThanOrEqual(3);

    // Check structure
    const firstSuggestion = response.suggestions[0];
    expect(firstSuggestion.label).toBeDefined();
    expect(firstSuggestion.confidence).toBeDefined();
    expect(firstSuggestion.confidence).toBeGreaterThan(0);
    expect(firstSuggestion.confidence).toBeLessThanOrEqual(1);

    // Should relate to JWT/auth/Express
    const labels = response.suggestions.map((s) => s.label.toLowerCase());
    const hasRelevant = labels.some(
      (label) =>
        label.includes('jwt') ||
        label.includes('auth') ||
        label.includes('express') ||
        label.includes('token')
    );
    expect(hasRelevant).toBe(true);
  }, 60000);

  it('should handle completion with custom parameters', async () => {
    const response = await client.bridge.complete({
      messages: [
        {
          role: 'user',
          content: 'Count to 3',
        },
      ],
      temperature: 0.1,
      max_tokens: 20,
      top_p: 0.9,
    });

    expect(response.choices).toBeDefined();
    expect(response.choices[0].message.content).toBeDefined();
  }, 60000);

  it('should handle errors gracefully for invalid requests', async () => {
    try {
      await client.bridge.complete({
        messages: [], // Invalid: empty messages
        temperature: 0.5,
      });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
      // Error handling should be graceful
    }
  }, 60000);

  it('should complete with system message', async () => {
    const response = await client.bridge.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful coding assistant who speaks concisely.',
        },
        {
          role: 'user',
          content: 'What is TypeScript?',
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    expect(response.choices).toBeDefined();
    expect(response.choices[0].message.content.toLowerCase()).toContain('typescript');
  }, 60000);

  it('should generate labels with reasoning', async () => {
    const messages = [
      {
        role: 'user',
        content: 'How do I optimize PostgreSQL queries?',
      },
      {
        role: 'assistant',
        content: 'You can optimize PostgreSQL queries by using indexes, EXPLAIN ANALYZE, query planning, and proper WHERE clauses.',
      },
    ];

    const response = await client.controller.suggestLabel({
      messages,
      count: 2,
    });

    expect(response.suggestions).toBeDefined();
    response.suggestions.forEach((suggestion) => {
      expect(suggestion.label).toBeDefined();
      expect(suggestion.confidence).toBeDefined();
      expect(suggestion.reasoning).toBeDefined();
      expect(typeof suggestion.reasoning).toBe('string');
      expect(suggestion.reasoning.length).toBeGreaterThan(0);
    });
  }, 60000);
});
