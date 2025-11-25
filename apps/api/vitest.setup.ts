import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';

// Load test environment
config({ path: path.resolve(__dirname, '.env.test') });

const prisma = new PrismaClient();

// Setup before all tests
beforeAll(async () => {
  // Ensure test database is ready
  try {
    // Run migrations for test database
    // Note: This will create SQLite test.db file
    await prisma.$connect();
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    // Don't fail tests if DB is not available - unit tests can still run
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('Error disconnecting test database:', error);
  }
});

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: () => {}, // Disable console.log in tests
  warn: () => {}, // Disable console.warn in tests
  error: console.error, // Keep console.error for debugging
};

