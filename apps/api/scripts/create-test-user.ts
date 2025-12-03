#!/usr/bin/env tsx
import prisma from '../src/lib/prisma.js';

async function createTestUser() {
  const user = await prisma.user.create({
    data: {
      googleId: 'test-' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
      language: 'ru',
      theme: 'dark'
    }
  });
  console.log('✅ Created user:', user.email, 'ID:', user.id);
  await prisma.$disconnect();
}

createTestUser();

