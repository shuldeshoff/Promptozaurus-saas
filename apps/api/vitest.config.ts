import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
      ],
    },
    setupFiles: ['./vitest.setup.ts'],
    // Установить таймаут для медленных тестов
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});

