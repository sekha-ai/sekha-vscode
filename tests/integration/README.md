# Integration Tests

Integration tests for the Sekha VS Code extension verify functionality against real Sekha Controller and Bridge instances.

## Prerequisites

1. **Running Sekha Controller**
   ```bash
   # Start the controller on http://localhost:8080
   cd sekha-controller
   poetry run python -m sekha_controller.server
   ```

2. **Valid API Key**
   - Generate an API key from your controller
   - At least 32 characters long

3. **Environment Configuration**
   ```bash
   export SEKHA_INTEGRATION_TESTS=1
   export SEKHA_BASE_URL="http://localhost:8080"
   export SEKHA_API_KEY="your-api-key-here"
   ```

## Running Integration Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run with Coverage
```bash
npm run test:integration -- --coverage
```

### Run Specific Test File
```bash
npm run test:integration -- tests/integration/controller.integration.test.ts
```

## Test Structure

### Controller Integration Tests (`controller.integration.test.ts`)

Tests core controller functionality:
- ✅ Create conversation
- ✅ Get conversation
- ✅ List conversations
- ✅ Query (semantic search)
- ✅ Update label
- ✅ Pin/unpin conversation
- ✅ Get statistics
- ✅ Assemble context
- ✅ Full-text search

### Bridge Integration Tests (Future)

Will test Bridge features:
- AI completion
- Summarization
- Label suggestions

## Cleanup

Tests automatically clean up created data in the `afterAll` hook. If tests fail mid-execution, you may need to manually delete test conversations:

```bash
# Find test conversations
curl -X GET "http://localhost:8080/api/v1/conversations?limit=100" \
  -H "Authorization: Bearer $SEKHA_API_KEY"

# Delete specific conversation
curl -X DELETE "http://localhost:8080/api/v1/conversations/{id}" \
  -H "Authorization: Bearer $SEKHA_API_KEY"
```

## CI/CD Integration

Integration tests are skipped in CI by default. To enable:

1. **Add secrets to GitHub Actions**:
   - `SEKHA_API_KEY`
   - `SEKHA_BASE_URL` (optional, defaults to localhost)

2. **Update workflow**:
   ```yaml
   - name: Run Integration Tests
     if: github.event_name == 'push'
     env:
       SEKHA_INTEGRATION_TESTS: 1
       SEKHA_BASE_URL: ${{ secrets.SEKHA_BASE_URL }}
       SEKHA_API_KEY: ${{ secrets.SEKHA_API_KEY }}
     run: npm run test:integration
   ```

## Troubleshooting

### "Connection refused" errors
- Ensure controller is running: `curl http://localhost:8080/health`
- Check firewall settings
- Verify `SEKHA_BASE_URL` is correct

### "Unauthorized" errors
- Verify API key is valid
- Check API key length (minimum 32 chars)
- Ensure key has required permissions

### Tests timeout
- Increase timeout in vitest config
- Check controller performance
- Verify network connectivity

### Cleanup failures
- Manually delete test conversations
- Check controller logs for errors
- Verify API key has delete permissions

## Best Practices

1. **Unique Test Data**: Use timestamps in labels to avoid collisions
2. **Idempotent Tests**: Each test should be independent
3. **Cleanup**: Always clean up in `afterAll`
4. **Timeouts**: Set appropriate timeouts (30s default)
5. **Assertions**: Verify both success and data correctness

## Example Usage

```bash
# Full integration test run
export SEKHA_INTEGRATION_TESTS=1
export SEKHA_API_KEY="sk-test-12345678901234567890123456789012"
npm run test:integration

# Output:
# ✓ Controller Integration Tests (8/8)
#   ✓ should create a conversation
#   ✓ should get the created conversation
#   ✓ should list conversations
#   ...
```
