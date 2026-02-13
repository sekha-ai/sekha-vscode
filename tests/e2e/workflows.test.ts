import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SekhaClient, SekhaConfig } from '@sekha/sdk';

// E2E tests - only run when environment is configured
const shouldRun = process.env.SEKHA_E2E_TESTS === '1';

const testConfig: SekhaConfig = {
  controllerURL: process.env.SEKHA_BASE_URL || 'http://localhost:8080',
  bridgeURL: process.env.SEKHA_BRIDGE_URL || 'http://localhost:5001',
  apiKey: process.env.SEKHA_API_KEY || 'test-token-123456789012345678901234567890',
  timeout: 60000,
};

const testIds: string[] = [];

(shouldRun ? describe : describe.skip)('E2E Workflow Tests', () => {
  let client: SekhaClient;

  beforeAll(() => {
    client = new SekhaClient(testConfig);
  });

  afterAll(async () => {
    // Cleanup all test conversations
    for (const id of testIds) {
      try {
        await client.controller.delete(id);
      } catch (e) {
        console.error(`Cleanup failed for ${id}:`, e);
      }
    }
  });

  it('Workflow 1: Complete save, search, and retrieve flow', async () => {
    // 1. Create conversation
    const conv = await client.controller.create({
      label: 'E2E Test - Save & Retrieve',
      folder: '/e2e-test',
      messages: [
        {
          role: 'user',
          content: 'This is a unique test message for E2E workflow testing',
        },
        {
          role: 'assistant',
          content: 'This is a test response for E2E workflow validation',
        },
      ],
      tags: ['e2e', 'test', 'workflow'],
    });
    testIds.push(conv.id);

    expect(conv.id).toBeDefined();

    // 2. Search for it semantically
    const searchResults = await client.controller.query({
      query: 'unique test message E2E',
      limit: 5,
    });

    expect(searchResults.results.length).toBeGreaterThan(0);
    const foundConv = searchResults.results.find(
      (r) => r.conversation.id === conv.id
    );
    expect(foundConv).toBeDefined();

    // 3. Retrieve and verify
    const retrieved = await client.controller.get(conv.id);
    expect(retrieved.label).toBe('E2E Test - Save & Retrieve');
    expect(retrieved.messages).toHaveLength(2);
    expect(retrieved.tags).toEqual(['e2e', 'test', 'workflow']);
  }, 120000);

  it('Workflow 2: AI completion with memory context', async () => {
    // 1. Create background knowledge
    const bgConv = await client.controller.create({
      label: 'Background Knowledge',
      folder: '/e2e-test',
      messages: [
        {
          role: 'user',
          content: 'What are the best practices for REST API design?',
        },
        {
          role: 'assistant',
          content: 'REST API best practices include: use proper HTTP methods, versioning, consistent naming, and proper status codes.',
        },
      ],
    });
    testIds.push(bgConv.id);

    // 2. Query for context
    const contextResults = await client.controller.query({
      query: 'REST API best practices',
      limit: 1,
    });

    expect(contextResults.results.length).toBeGreaterThan(0);

    // 3. Build context
    const context = contextResults.results
      .map((r) => {
        return r.conversation.messages
          .map((m) => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
          .join('\n');
      })
      .join('\n\n');

    // 4. Generate with context
    const completion = await client.bridge.complete({
      messages: [
        {
          role: 'system',
          content: `Context from memory:\n${context}`,
        },
        {
          role: 'user',
          content: 'What HTTP method should I use for updating a resource?',
        },
      ],
      temperature: 0.3,
    });

    expect(completion.choices[0].message.content.toUpperCase()).toContain('PUT');
  }, 120000);

  it('Workflow 3: Batch archive operations', async () => {
    // 1. Create multiple conversations
    const convIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const conv = await client.controller.create({
        label: `Batch Test ${i}`,
        folder: '/e2e-test/batch',
        messages: [
          { role: 'user', content: `Test message ${i}` },
          { role: 'assistant', content: `Response ${i}` },
        ],
      });
      convIds.push(conv.id);
      testIds.push(conv.id);
    }

    expect(convIds).toHaveLength(3);

    // 2. Archive all
    for (const id of convIds) {
      await client.controller.archive(id);
    }

    // 3. Verify all archived
    for (const id of convIds) {
      const conv = await client.controller.get(id);
      expect(conv.status).toBe('archived');
    }
  }, 120000);

  it('Workflow 4: Tag organization', async () => {
    // 1. Create conversation
    const conv = await client.controller.create({
      label: 'Tag Organization Test',
      folder: '/e2e-test',
      messages: [
        {
          role: 'user',
          content: 'How do I use Python for machine learning with scikit-learn?',
        },
        {
          role: 'assistant',
          content: 'Scikit-learn is a powerful ML library for Python...',
        },
      ],
    });
    testIds.push(conv.id);

    // 2. Add tags
    await client.controller.update(conv.id, {
      tags: ['python', 'machine-learning', 'scikit-learn'],
    });

    // 3. Verify tags applied
    const updated = await client.controller.get(conv.id);
    expect(updated.tags).toEqual(['python', 'machine-learning', 'scikit-learn']);

    // 4. Query by tag (using search)
    const searchResults = await client.controller.query({
      query: 'python machine learning',
      limit: 10,
    });

    const found = searchResults.results.some((r) => r.conversation.id === conv.id);
    expect(found).toBe(true);
  }, 120000);

  it('Workflow 5: Full conversation lifecycle', async () => {
    // 1. Create
    const conv = await client.controller.create({
      label: 'Lifecycle Test',
      folder: '/e2e-test',
      messages: [
        { role: 'user', content: 'Initial message' },
        { role: 'assistant', content: 'Initial response' },
      ],
    });
    testIds.push(conv.id);

    // 2. Update label
    await client.controller.updateLabel(conv.id, {
      label: 'Updated Lifecycle Test',
    });
    const afterLabel = await client.controller.get(conv.id);
    expect(afterLabel.label).toBe('Updated Lifecycle Test');

    // 3. Pin
    await client.controller.pin(conv.id);
    const afterPin = await client.controller.get(conv.id);
    expect(afterPin.status).toBe('pinned');

    // 4. Unpin
    await client.controller.unpin(conv.id);
    const afterUnpin = await client.controller.get(conv.id);
    expect(afterUnpin.status).toBe('active');

    // 5. Archive
    await client.controller.archive(conv.id);
    const afterArchive = await client.controller.get(conv.id);
    expect(afterArchive.status).toBe('archived');

    // 6. Delete handled in afterAll cleanup
  }, 120000);
});
