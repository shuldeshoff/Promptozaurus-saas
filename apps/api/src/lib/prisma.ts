import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test connection only in non-test environment
if (process.env.NODE_ENV !== 'test') {
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connected');
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error);
    });
}

export { prisma };
export default prisma;

