import { beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';
import path from 'path';

// Load test environment
config({ path: path.resolve(__dirname, '.env.test') });

// Setup before all tests
beforeAll(async () => {
  // Tests that need database will handle their own connection
  console.log('✅ Test environment loaded');
});

// Cleanup after all tests
afterAll(async () => {
  console.log('✅ Tests completed');
});

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: () => {}, // Disable console.log in tests
  warn: () => {}, // Disable console.warn in tests
  error: console.error, // Keep console.error for debugging
};

