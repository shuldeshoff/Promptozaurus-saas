import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testMatch: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/tests/**',
      ],
    },
    testTimeout: 30000, // 30 секунд по умолчанию для AI тестов
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
});
