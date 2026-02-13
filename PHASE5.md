# Phase 5: Production Ready - CI/CD & Testing

Phase 5 hardens the extension for production release with comprehensive testing, improved CI/CD, and quality assurance.

## 🎯 Goals

1. **Fix & enhance integration tests** - Real controller testing
2. **Add Bridge integration tests** - Test AI features
3. **Increase test coverage to 80%** - Production quality
4. **Add E2E workflow tests** - User journey validation
5. **Production hardening** - Error handling, logging, performance

---

## 🧪 Testing Strategy

### Test Pyramid

```
       E2E Tests (5)
      ┏━━━━━━━━━━┓
     Integration (20)
    ┏━━━━━━━━━━━━━━━━┓
   Unit Tests (100+)
  ┏━━━━━━━━━━━━━━━━━━━━━┓
```

**Coverage Targets**:
- Unit tests: 85%
- Integration tests: All major API flows
- E2E tests: 5 critical user workflows
- Overall: 80% minimum

---

## 📋 Test Suites

### 1. Unit Tests (Enhanced)

#### Existing Tests (Fix & Improve)

**commands.test.ts**
- ✅ All command methods
- ✅ Error handling
- ✅ Edge cases
- 🔧 Add async error scenarios
- 🔧 Add Bridge integration scenarios

**treeView.test.ts**
- ✅ Tree rendering
- ✅ Item creation
- 🔧 Add refresh logic
- 🔧 Add filtering tests

**extension.test.ts**
- ✅ Activation
- ✅ Command registration
- 🔧 Add deactivation tests
- 🔧 Add configuration change tests

#### New Unit Tests

**selectionManager.test.ts**
```typescript
✅ Select single item
✅ Multi-select
✅ Select range
✅ Select all
✅ Clear selection
✅ Event emission
✅ Selection persistence
```

**exportService.test.ts**
```typescript
✅ Export to Markdown
✅ Export to JSON
✅ Export to HTML
✅ Export to Text
✅ Batch export
✅ Metadata inclusion/exclusion
✅ File naming/sanitization
✅ Progress tracking
```

**mergeService.test.ts**
```typescript
✅ Merge chronologically
✅ Merge by conversation
✅ Tag combination
✅ Label generation
✅ Delete originals option
✅ Error handling (< 2 conversations)
```

**tagManager.test.ts**
```typescript
✅ Add tags
✅ Remove tags
✅ Get all tags
✅ Tag statistics
✅ AI tag suggestions
✅ Filter by tags
```

**batchCommands.test.ts**
```typescript
✅ Select all
✅ Clear selection
✅ Batch pin
✅ Batch archive
✅ Batch delete (with confirmation)
✅ Batch move
✅ Batch export
✅ Progress tracking
```

### 2. Integration Tests (Fixed & Enhanced)

#### Controller Integration Tests (Enhanced)

**tests/integration/controller.integration.test.ts**

**Existing (Fix)**:
```typescript
✅ Create conversation
✅ Get conversation
✅ List conversations
✅ Query (semantic search)
✅ Update label
✅ Pin/unpin
✅ Count statistics
✅ Assemble context
✅ Full-text search
```

**New Tests**:
```typescript
🆕 Update folder
🆕 Add tags
🆕 Remove tags
🆕 Archive conversation
🆕 Pagination (list with cursor)
🆕 Query with filters
🆕 Context assembly with budget
🆕 Error handling (404, 401, etc.)
```

#### Bridge Integration Tests (New)

**tests/integration/bridge.integration.test.ts**

```typescript
// Setup
- Check Bridge is running
- Validate API key
- Create test conversation

// Tests
✅ Complete with streaming
✅ Complete with memory context
✅ Summarize brief
✅ Summarize detailed
✅ Label suggestions
✅ Tag suggestions
✅ Error handling (timeouts)
✅ Model selection
✅ Temperature control

// Cleanup
- Delete test data
```

**Example Test**:
```typescript
it('should generate completion with memory context', async () => {
  // Create test conversation
  const conv = await client.controller.create({
    label: 'Test Context',
    messages: [
      { role: 'user', content: 'Python is great for data science' },
      { role: 'assistant', content: 'Indeed, with pandas and numpy' },
    ],
  });

  // Query to get context
  const contextResults = await client.controller.query({
    query: 'data science',
    limit: 1,
  });

  // Generate completion with context
  const completion = await client.bridge.complete({
    messages: [
      {
        role: 'user',
        content: 'What libraries are good for data science?'
      }
    ],
    temperature: 0.7,
  });

  expect(completion.choices).toBeDefined();
  expect(completion.choices[0].message.content).toContain('pandas');
  
  // Cleanup
  await client.controller.delete(conv.id);
}, 60000);
```

### 3. E2E Workflow Tests (New)

**tests/e2e/workflows.test.ts**

#### Workflow 1: Complete Save & Retrieve
```typescript
it('should save, search, and retrieve conversation', async () => {
  // 1. Create conversation programmatically
  // 2. Search for it semantically
  // 3. Retrieve and verify content
  // 4. Delete
});
```

#### Workflow 2: AI Complete with Memory
```typescript
it('should generate AI completion with memory context', async () => {
  // 1. Create background knowledge conversations
  // 2. Query for context
  // 3. Send to Bridge with context
  // 4. Verify response uses context
  // 5. Cleanup
});
```

#### Workflow 3: Batch Operations
```typescript
it('should batch archive multiple conversations', async () => {
  // 1. Create 10 test conversations
  // 2. Select all
  // 3. Batch archive
  // 4. Verify all archived
  // 5. Cleanup
});
```

#### Workflow 4: Export & Merge
```typescript
it('should merge conversations and export', async () => {
  // 1. Create 3 related conversations
  // 2. Merge chronologically
  // 3. Export as markdown
  // 4. Verify file content
  // 5. Cleanup
});
```

#### Workflow 5: Tag Organization
```typescript
it('should suggest tags and organize', async () => {
  // 1. Create conversation
  // 2. Get AI tag suggestions
  // 3. Apply tags
  // 4. Filter by tags
  // 5. Verify results
  // 6. Cleanup
});
```

---

## 🔧 Test Infrastructure Improvements

### Test Environment Setup

**tests/setup/testEnv.ts**
```typescript
export class TestEnvironment {
  async setup(): Promise<void> {
    // Start mock controller if needed
    // Create test API key
    // Initialize test database
  }

  async teardown(): Promise<void> {
    // Cleanup test data
    // Stop mock services
  }

  async reset(): Promise<void> {
    // Reset to clean state between tests
  }
}
```

### Test Helpers

**tests/helpers/fixtures.ts**
```typescript
export const createTestConversation = () => ({
  label: `Test-${Date.now()}`,
  folder: '/test',
  messages: [
    { role: 'user', content: 'Test message' },
    { role: 'assistant', content: 'Test response' },
  ],
});

export const createTestMessages = (count: number) => {
  // Generate N test messages
};

export const waitForCondition = async (fn: () => boolean, timeout: number) => {
  // Poll until condition met or timeout
};
```

### Mock Services

**tests/mocks/mockController.ts**
```typescript
export class MockController {
  private conversations: Map<string, Conversation> = new Map();

  async create(req: CreateRequest): Promise<Conversation> {
    // In-memory implementation
  }

  async get(id: string): Promise<Conversation> {
    // In-memory implementation
  }

  // ... other methods
}
```

**tests/mocks/mockBridge.ts**
```typescript
export class MockBridge {
  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    // Return mock completion
    return {
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Mocked completion response',
          },
        },
      ],
    };
  }

  async summarize(req: SummarizeRequest): Promise<SummaryResponse> {
    // Return mock summary
  }
}
```

---

## 📊 Coverage Strategy

### Coverage Thresholds

**vitest.config.ts** update:
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
});
```

### Per-File Targets

| File | Target | Priority |
|------|--------|----------|
| `commands.ts` | 85% | High |
| `batchCommands.ts` | 85% | High |
| `selectionManager.ts` | 90% | High |
| `exportService.ts` | 85% | High |
| `mergeService.ts` | 85% | High |
| `tagManager.ts` | 85% | High |
| `treeView.ts` | 75% | Medium |
| `webview.ts` | 70% | Medium |
| `extension.ts` | 75% | Medium |

---

## 🚀 CI/CD Improvements

### GitHub Actions Updates

**.github/workflows/ci.yml** enhancements:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      # Start controller for integration tests
      controller:
        image: sekha/controller:latest
        ports:
          - 8080:8080
        env:
          DATABASE_URL: postgresql://test:test@postgres:5432/test
      
      # Start bridge for integration tests
      bridge:
        image: sekha/bridge:latest
        ports:
          - 5001:5001
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm test
      
      - name: Integration tests
        env:
          SEKHA_INTEGRATION_TESTS: 1
          SEKHA_BASE_URL: http://localhost:8080
          SEKHA_BRIDGE_URL: http://localhost:5001
          SEKHA_API_KEY: ${{ secrets.SEKHA_TEST_API_KEY }}
        run: npm run test:integration
      
      - name: E2E tests
        env:
          SEKHA_E2E_TESTS: 1
          SEKHA_BASE_URL: http://localhost:8080
          SEKHA_BRIDGE_URL: http://localhost:5001
          SEKHA_API_KEY: ${{ secrets.SEKHA_TEST_API_KEY }}
        run: npm run test:e2e
      
      - name: Coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
      
      - name: Check coverage threshold
        run: |
          coverage=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
          echo "Coverage: $coverage%"
          if (( $(echo "$coverage < 80" | bc -l) )); then
            echo "Coverage below 80% threshold!"
            exit 1
          fi
```

### Pre-commit Hooks

**.husky/pre-commit**:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Lint staged files
npm run lint:fix

# Run tests
npm test

# Check coverage
npm run test:coverage
```

---

## 🔍 Production Hardening

### Error Handling

**Comprehensive error catching**:
```typescript
try {
  await operation();
} catch (error) {
  if (error instanceof SekhaAPIError) {
    // API-specific handling
    vscode.window.showErrorMessage(
      `Sekha API Error: ${error.message} (${error.statusCode})`
    );
  } else if (error instanceof NetworkError) {
    // Network-specific handling
    vscode.window.showErrorMessage(
      'Network error. Is the controller running?'
    );
  } else {
    // Generic handling
    vscode.window.showErrorMessage(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  
  // Log for debugging
  console.error('[Sekha]', error);
}
```

### Logging

**Structured logging**:
```typescript
export class Logger {
  private output: vscode.OutputChannel;

  constructor() {
    this.output = vscode.window.createOutputChannel('Sekha');
  }

  info(message: string, ...args: any[]): void {
    this.output.appendLine(`[INFO] ${message} ${JSON.stringify(args)}`);
  }

  error(message: string, error?: Error): void {
    this.output.appendLine(`[ERROR] ${message}`);
    if (error) {
      this.output.appendLine(error.stack || error.message);
    }
  }

  warn(message: string): void {
    this.output.appendLine(`[WARN] ${message}`);
  }
}
```

### Performance Monitoring

**Track operation times**:
```typescript
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    console.log(`[Performance] ${name}: ${duration}ms`);
    
    if (duration > 5000) {
      console.warn(`[Performance] ${name} took longer than 5s!`);
    }
  }
}

// Usage
await withTiming('batchArchive', async () => {
  await batchCommands.batchArchive();
});
```

### Input Validation

**Validate all user inputs**:
```typescript
export function validateApiKey(key: string): boolean {
  return key.length >= 32 && /^[a-zA-Z0-9-_]+$/.test(key);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateLabel(label: string): boolean {
  return label.length > 0 && label.length <= 200;
}
```

---

## 📦 Package Scripts Updates

**package.json** additions:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run tests/**/*.test.ts --exclude tests/integration tests/e2e",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "vitest run tests/e2e",
    "test:coverage": "vitest run --coverage",
    "test:coverage:unit": "vitest run --coverage tests/**/*.test.ts --exclude tests/integration tests/e2e",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "coverage:check": "node scripts/check-coverage.js"
  }
}
```

---

## ✅ Success Criteria

### Phase 5 Complete When:

- [ ] All unit tests passing
- [ ] All integration tests passing (controller + bridge)
- [ ] All E2E workflow tests passing
- [ ] Overall coverage ≥ 80%
- [ ] Per-file coverage meets targets
- [ ] CI/CD pipeline fully automated
- [ ] Error handling comprehensive
- [ ] Logging implemented
- [ ] Performance monitoring added
- [ ] Input validation complete
- [ ] Documentation updated

### Quality Metrics:

| Metric | Target | Status |
|--------|--------|--------|
| Unit test coverage | 85% | 🔴 |
| Integration coverage | 100% workflows | 🔴 |
| E2E coverage | 5 workflows | 🔴 |
| Overall coverage | 80% | 🔴 |
| CI/CD automated | Yes | 🔴 |
| Error handling | Comprehensive | 🔴 |

---

## 🔄 Testing Workflow

### Local Development

```bash
# 1. Start services
cd sekha-docker && docker compose up -d

# 2. Run unit tests
npm test

# 3. Run integration tests
export SEKHA_INTEGRATION_TESTS=1
export SEKHA_API_KEY="your-key"
npm run test:integration

# 4. Run E2E tests
export SEKHA_E2E_TESTS=1
npm run test:e2e

# 5. Check coverage
npm run test:coverage
```

### CI Pipeline

```
Push to branch
  │
  v
GitHub Actions triggered
  │
  ├── Lint code
  ├── Unit tests
  ├── Integration tests (with services)
  ├── E2E tests
  ├── Coverage check (80% threshold)
  ├── Upload to Codecov
  └── Deploy (if main branch)
```

---

## 📊 Test Execution Time Targets

| Suite | Tests | Target Time | Max Time |
|-------|-------|-------------|----------|
| Unit | 100+ | 10s | 30s |
| Integration | 20 | 30s | 60s |
| E2E | 5 | 60s | 120s |
| **Total** | **125+** | **100s** | **210s** |

---

**Phase 5 Status**: In Progress
**Target Completion**: Before marketplace release
