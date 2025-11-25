import { beforeAll, afterAll, vi } from 'vitest';
import { config } from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

// Load test environment
config({ path: path.resolve(__dirname, '.env.test') });

// Setup before all tests
beforeAll(async () => {
  try {
    // Применить миграции к тестовой БД
    console.log('📦 Running Prisma migrations for test database...');
    execSync('npx prisma migrate deploy', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
    console.log('✅ Test database ready');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Очистить тестовую БД после всех тестов
    const { prisma } = await import('./src/lib/prisma.js');
    
    // Удалить все данные
    await prisma.apiKey.deleteMany();
    await prisma.template.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    
    await prisma.$disconnect();
    console.log('✅ Test database cleaned and disconnected');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
});

// Mock console methods to reduce noise in test output (но не в setup)
if (process.env.VITEST_WORKER_ID) {
  global.console = {
    ...console,
    log: vi.fn(), // Disable console.log in tests
    warn: vi.fn(), // Disable console.warn in tests
    error: console.error, // Keep console.error for debugging
  };
}


