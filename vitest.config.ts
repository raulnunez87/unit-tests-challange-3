import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'lib/**/*.ts',
        'app/api/**/*.ts'
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'coverage/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/types.ts',
        '**/index.ts'
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80
      }
    },
    include: [
      'tests/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'coverage/**'
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@lib': resolve(__dirname, './lib'),
      '@app': resolve(__dirname, './app')
    }
  }
});