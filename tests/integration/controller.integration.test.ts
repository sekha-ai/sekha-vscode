import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SekhaClient, SekhaConfig } from '@sekha/sdk';

// Integration tests - only run when environment is configured
const shouldRun = process.env.SEKHA_INTEGRATION_TESTS === '1';

const testConfig: SekhaConfig = {
  controllerURL: process.env.SEKHA_BASE_URL || 'http://localhost:8080',
  apiKey: process.env.SEKHA_API_KEY || 'test-token-123456789012345678901234567890',
  timeout: 30000,
};

const testLabel = `VSCode-Test-${Date.now()}`;
let createdConversationId: string;

(shouldRun ? describe : describe.skip)('Controller Integration Tests', () => {
  let client: SekhaClient;

  beforeAll(() => {
    client = new SekhaClient(testConfig);
  });

  afterAll(async () => {
    // Cleanup - delete test conversation
    if (createdConversationId) {
      try {
        await client.controller.delete(createdConversationId);
      } catch (e) {
        console.error('Cleanup failed:', e);
      }
    }
  });

  it('should create a conversation', async () => {
    const result = await client.controller.create({
      label: testLabel,
      folder: '/vscode/test',
      messages: [
        { role: 'user', content: 'Hello from integration test' },
        { role: 'assistant', content: 'Hi! This is a test response.' },
      ],
    });

    expect(result.id).toBeDefined();
    expect(result.label).toBe(testLabel);
    createdConversationId = result.id;
  }, 30000);

  it('should get the created conversation', async () => {
    const conversation = await client.controller.get(createdConversationId);

    expect(conversation.id).toBe(createdConversationId);
    expect(conversation.label).toBe(testLabel);
    expect(conversation.messages.length).toBe(2);
  }, 30000);

  it('should list conversations', async () => {
    const response = await client.controller.list({ limit: 10 });

    expect(response.conversations).toBeDefined();
    expect(Array.isArray(response.conversations)).toBe(true);
    expect(response.total).toBeGreaterThan(0);
  }, 30000);

  it('should query conversations semantically', async () => {
    const response = await client.controller.query({
      query: 'integration test',
      limit: 5,
    });

    expect(response.results).toBeDefined();
    expect(Array.isArray(response.results)).toBe(true);
  }, 30000);

  it('should update conversation label', async () => {
    const newLabel = `${testLabel}-Updated`;
    await client.controller.updateLabel(createdConversationId, { label: newLabel });

    const conversation = await client.controller.get(createdConversationId);
    expect(conversation.label).toBe(newLabel);
  }, 30000);

  it('should pin conversation', async () => {
    await client.controller.pin(createdConversationId);

    const conversation = await client.controller.get(createdConversationId);
    expect(conversation.status).toBe('pinned');
  }, 30000);

  it('should unpin conversation', async () => {
    await client.controller.unpin(createdConversationId);

    const conversation = await client.controller.get(createdConversationId);
    expect(conversation.status).toBe('active');
  }, 30000);

  it('should get conversation count', async () => {
    const stats = await client.controller.count();

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.by_status).toBeDefined();
  }, 30000);

  it('should assemble context', async () => {
    const result = await client.controller.assembleContext({
      query: 'integration test',
      context_budget: 2000,
    });

    expect(result.assembled_context).toBeDefined();
    expect(result.conversations_used).toBeGreaterThanOrEqual(0);
    expect(result.tokens_used).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should full-text search', async () => {
    const response = await client.controller.fullTextSearch({
      query: 'integration',
      limit: 5,
    });

    expect(response.results).toBeDefined();
    expect(Array.isArray(response.results)).toBe(true);
  }, 30000);
});
