# Testing Sekha VS Code Extension

## Running Tests
```bash
npm run compile  # Compile TypeScript
npm test         # Run Vitest unit tests
npm run test:coverage  # With coverage report

Test Structure
Unit tests: tests/*.test.ts (mocked VS Code API)
Integration tests: .vscode-test/ directory with real VS Code instance
Coverage Goals
Minimum 70% overall
100% for critical paths (config validation, API calls)


### 2. Update `README.md` - Add Testing section
```markdown
## Development & Testing

### Running Tests
1. Compile: `npm run compile`
2. Run tests: `npm test`
3. Coverage: `npm run test:coverage`

### Test Coverage
Current coverage: >70% (target met)

