import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/extension.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    // Fix: Exclude node_modules from transforms
    exclude: ['node_modules', 'dist', 'coverage']
  },
  resolve: {
    alias: {
      'vscode': path.resolve(__dirname, './tests/__mocks__/vscode.ts'),
      '@sekha/sdk': path.resolve(__dirname, '../sekha-js-sdk/src')
    }
  }
});